package com.brazucacms.service;

import com.brazucacms.config.StripeConfig;
import com.brazucacms.dto.subscription.*;
import com.brazucacms.exception.ResourceNotFoundException;
import com.brazucacms.model.*;
import com.brazucacms.repository.*;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.*;
import com.stripe.model.billingportal.Session;
import com.stripe.net.Webhook;
import com.stripe.param.*;
import com.stripe.param.billingportal.SessionCreateParams;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class StripeService {

    private final StripeConfig stripeConfig;
    private final SubscriptionPlanRepository planRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final InvoiceRepository invoiceRepository;
    private final CompanyRepository companyRepository;

    // ============ Plans ============

    public List<PlanResponse> getActivePlans() {
        return planRepository.findByActiveTrueOrderBySortOrderAsc().stream()
                .map(PlanResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public PlanResponse getPlanById(Long id) {
        SubscriptionPlan plan = planRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Plan not found with id: " + id));
        return PlanResponse.fromEntity(plan);
    }

    // ============ Checkout ============

    @Transactional
    public CheckoutSessionResponse createCheckoutSession(Long companyId, CreateCheckoutRequest request) throws StripeException {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found with id: " + companyId));

        SubscriptionPlan plan = planRepository.findById(request.getPlanId())
                .orElseThrow(() -> new ResourceNotFoundException("Plan not found with id: " + request.getPlanId()));

        // Check if company already has active subscription
        subscriptionRepository.findActiveByCompanyId(companyId).ifPresent(sub -> {
            throw new IllegalStateException("Company already has an active subscription. Use the billing portal to manage it.");
        });

        // Determine price ID based on billing interval
        String priceId = request.getBillingInterval().equalsIgnoreCase("YEARLY")
                ? plan.getStripePriceIdYearly()
                : plan.getStripePriceIdMonthly();

        if (priceId == null || priceId.isEmpty()) {
            throw new IllegalStateException("No Stripe price configured for this plan and interval");
        }

        // Get or create Stripe customer
        String customerId = getOrCreateStripeCustomer(company);

        // Create checkout session
        String successUrl = request.getSuccessUrl() != null 
                ? request.getSuccessUrl() 
                : "http://localhost:3000/dashboard/settings?tab=billing&success=true";
        String cancelUrl = request.getCancelUrl() != null 
                ? request.getCancelUrl() 
                : "http://localhost:3000/dashboard/settings?tab=billing&canceled=true";

        com.stripe.param.checkout.SessionCreateParams params = com.stripe.param.checkout.SessionCreateParams.builder()
                .setMode(com.stripe.param.checkout.SessionCreateParams.Mode.SUBSCRIPTION)
                .setCustomer(customerId)
                .setSuccessUrl(successUrl)
                .setCancelUrl(cancelUrl)
                .addLineItem(
                        com.stripe.param.checkout.SessionCreateParams.LineItem.builder()
                                .setPrice(priceId)
                                .setQuantity(1L)
                                .build()
                )
                .putMetadata("company_id", companyId.toString())
                .putMetadata("plan_id", plan.getId().toString())
                .putMetadata("billing_interval", request.getBillingInterval())
                .setSubscriptionData(
                        com.stripe.param.checkout.SessionCreateParams.SubscriptionData.builder()
                                .putMetadata("company_id", companyId.toString())
                                .putMetadata("plan_id", plan.getId().toString())
                                .build()
                )
                .build();

        com.stripe.model.checkout.Session session = com.stripe.model.checkout.Session.create(params);

        return CheckoutSessionResponse.builder()
                .sessionId(session.getId())
                .url(session.getUrl())
                .build();
    }

    // ============ Billing Portal ============

    public PortalSessionResponse createBillingPortalSession(Long companyId, String returnUrl) throws StripeException {
        Subscription subscription = subscriptionRepository.findByCompanyId(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("No subscription found for this company"));

        if (subscription.getStripeCustomerId() == null) {
            throw new IllegalStateException("No Stripe customer associated with this subscription");
        }

        String url = returnUrl != null ? returnUrl : "http://localhost:3000/dashboard/settings?tab=billing";

        SessionCreateParams params = SessionCreateParams.builder()
                .setCustomer(subscription.getStripeCustomerId())
                .setReturnUrl(url)
                .build();

        Session session = Session.create(params);

        return PortalSessionResponse.builder()
                .url(session.getUrl())
                .build();
    }

    // ============ Subscription Management ============

    public SubscriptionResponse getCurrentSubscription(Long companyId) {
        Subscription subscription = subscriptionRepository.findByCompanyId(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("No subscription found for this company"));
        return SubscriptionResponse.fromEntity(subscription);
    }

    public SubscriptionResponse getActiveSubscription(Long companyId) {
        Subscription subscription = subscriptionRepository.findActiveByCompanyId(companyId)
                .orElse(null);
        return subscription != null ? SubscriptionResponse.fromEntity(subscription) : null;
    }

    @Transactional
    public SubscriptionResponse cancelSubscription(Long companyId, boolean immediate) throws StripeException {
        Subscription subscription = subscriptionRepository.findActiveByCompanyId(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("No active subscription found"));

        if (subscription.getStripeSubscriptionId() == null) {
            // Free plan - just mark as canceled
            subscription.setStatus(Subscription.SubscriptionStatus.CANCELED);
            subscription.setCanceledAt(LocalDateTime.now());
            subscription = subscriptionRepository.save(subscription);
            return SubscriptionResponse.fromEntity(subscription);
        }

        com.stripe.model.Subscription stripeSub = com.stripe.model.Subscription.retrieve(subscription.getStripeSubscriptionId());

        if (immediate) {
            stripeSub.cancel();
            subscription.setStatus(Subscription.SubscriptionStatus.CANCELED);
            subscription.setCanceledAt(LocalDateTime.now());
        } else {
            SubscriptionUpdateParams params = SubscriptionUpdateParams.builder()
                    .setCancelAtPeriodEnd(true)
                    .build();
            stripeSub.update(params);
            subscription.setCancelAtPeriodEnd(true);
        }

        subscription = subscriptionRepository.save(subscription);
        return SubscriptionResponse.fromEntity(subscription);
    }

    @Transactional
    public SubscriptionResponse reactivateSubscription(Long companyId) throws StripeException {
        Subscription subscription = subscriptionRepository.findByCompanyId(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("No subscription found"));

        if (!subscription.getCancelAtPeriodEnd()) {
            throw new IllegalStateException("Subscription is not scheduled for cancellation");
        }

        if (subscription.getStripeSubscriptionId() != null) {
            com.stripe.model.Subscription stripeSub = com.stripe.model.Subscription.retrieve(subscription.getStripeSubscriptionId());
            SubscriptionUpdateParams params = SubscriptionUpdateParams.builder()
                    .setCancelAtPeriodEnd(false)
                    .build();
            stripeSub.update(params);
        }

        subscription.setCancelAtPeriodEnd(false);
        subscription = subscriptionRepository.save(subscription);
        return SubscriptionResponse.fromEntity(subscription);
    }

    // ============ Invoices ============

    public List<InvoiceResponse> getInvoices(Long companyId) {
        return invoiceRepository.findByCompanyIdOrderByCreatedAtDesc(companyId).stream()
                .map(InvoiceResponse::fromEntity)
                .collect(Collectors.toList());
    }

    // ============ Webhooks ============

    @Transactional
    public void handleWebhook(String payload, String sigHeader) throws SignatureVerificationException {
        Event event = Webhook.constructEvent(payload, sigHeader, stripeConfig.getWebhookSecret());
        
        log.info("Received Stripe webhook: {}", event.getType());

        switch (event.getType()) {
            case "checkout.session.completed" -> handleCheckoutCompleted(event);
            case "customer.subscription.created" -> handleSubscriptionCreated(event);
            case "customer.subscription.updated" -> handleSubscriptionUpdated(event);
            case "customer.subscription.deleted" -> handleSubscriptionDeleted(event);
            case "invoice.paid" -> handleInvoicePaid(event);
            case "invoice.payment_failed" -> handleInvoicePaymentFailed(event);
            default -> log.info("Unhandled event type: {}", event.getType());
        }
    }

    private void handleCheckoutCompleted(Event event) {
        com.stripe.model.checkout.Session session = (com.stripe.model.checkout.Session) event.getDataObjectDeserializer()
                .getObject().orElseThrow();

        String companyIdStr = session.getMetadata().get("company_id");
        String planIdStr = session.getMetadata().get("plan_id");
        String billingInterval = session.getMetadata().get("billing_interval");

        if (companyIdStr == null || planIdStr == null) {
            log.warn("Missing metadata in checkout session: {}", session.getId());
            return;
        }

        Long companyId = Long.parseLong(companyIdStr);
        Long planId = Long.parseLong(planIdStr);

        Company company = companyRepository.findById(companyId).orElse(null);
        SubscriptionPlan plan = planRepository.findById(planId).orElse(null);

        if (company == null || plan == null) {
            log.warn("Company or plan not found for checkout session");
            return;
        }

        // Update company's Stripe customer ID if needed
        if (company.getStripeCustomerId() == null && session.getCustomer() != null) {
            company.setStripeCustomerId(session.getCustomer());
            companyRepository.save(company);
        }

        log.info("Checkout completed for company {} with plan {}", companyId, plan.getName());
    }

    private void handleSubscriptionCreated(Event event) {
        com.stripe.model.Subscription stripeSub = (com.stripe.model.Subscription) event.getDataObjectDeserializer()
                .getObject().orElseThrow();

        String companyIdStr = stripeSub.getMetadata().get("company_id");
        String planIdStr = stripeSub.getMetadata().get("plan_id");

        if (companyIdStr == null) {
            log.warn("Missing company_id in subscription metadata");
            return;
        }

        Long companyId = Long.parseLong(companyIdStr);
        Company company = companyRepository.findById(companyId).orElse(null);
        
        if (company == null) {
            log.warn("Company not found: {}", companyId);
            return;
        }

        // Find plan by price ID if not in metadata
        SubscriptionPlan plan = null;
        if (planIdStr != null) {
            plan = planRepository.findById(Long.parseLong(planIdStr)).orElse(null);
        }
        
        if (plan == null && !stripeSub.getItems().getData().isEmpty()) {
            String priceId = stripeSub.getItems().getData().get(0).getPrice().getId();
            plan = planRepository.findByStripePriceIdMonthly(priceId)
                    .or(() -> planRepository.findByStripePriceIdYearly(priceId))
                    .orElse(null);
        }

        if (plan == null) {
            log.warn("Plan not found for subscription");
            return;
        }

        // Determine billing interval
        Subscription.BillingInterval interval = Subscription.BillingInterval.MONTHLY;
        if (!stripeSub.getItems().getData().isEmpty()) {
            String priceInterval = stripeSub.getItems().getData().get(0).getPrice().getRecurring().getInterval();
            if ("year".equals(priceInterval)) {
                interval = Subscription.BillingInterval.YEARLY;
            }
        }

        // Create or update subscription
        Subscription subscription = subscriptionRepository.findByCompanyId(companyId)
                .orElse(new Subscription());

        subscription.setCompany(company);
        subscription.setPlan(plan);
        subscription.setStripeSubscriptionId(stripeSub.getId());
        subscription.setStripeCustomerId(stripeSub.getCustomer());
        subscription.setStatus(mapStripeStatus(stripeSub.getStatus()));
        subscription.setBillingInterval(interval);
        subscription.setCurrentPeriodStart(fromTimestamp(stripeSub.getCurrentPeriodStart()));
        subscription.setCurrentPeriodEnd(fromTimestamp(stripeSub.getCurrentPeriodEnd()));
        subscription.setCancelAtPeriodEnd(stripeSub.getCancelAtPeriodEnd());
        
        if (!stripeSub.getItems().getData().isEmpty()) {
            Price price = stripeSub.getItems().getData().get(0).getPrice();
            subscription.setAmount(BigDecimal.valueOf(price.getUnitAmount()).divide(BigDecimal.valueOf(100)));
            subscription.setCurrency(price.getCurrency().toUpperCase());
        }

        subscriptionRepository.save(subscription);
        log.info("Subscription created for company {}", companyId);
    }

    private void handleSubscriptionUpdated(Event event) {
        com.stripe.model.Subscription stripeSub = (com.stripe.model.Subscription) event.getDataObjectDeserializer()
                .getObject().orElseThrow();

        subscriptionRepository.findByStripeSubscriptionId(stripeSub.getId()).ifPresent(subscription -> {
            subscription.setStatus(mapStripeStatus(stripeSub.getStatus()));
            subscription.setCurrentPeriodStart(fromTimestamp(stripeSub.getCurrentPeriodStart()));
            subscription.setCurrentPeriodEnd(fromTimestamp(stripeSub.getCurrentPeriodEnd()));
            subscription.setCancelAtPeriodEnd(stripeSub.getCancelAtPeriodEnd());
            
            if (stripeSub.getCanceledAt() != null) {
                subscription.setCanceledAt(fromTimestamp(stripeSub.getCanceledAt()));
            }

            subscriptionRepository.save(subscription);
            log.info("Subscription updated: {}", stripeSub.getId());
        });
    }

    private void handleSubscriptionDeleted(Event event) {
        com.stripe.model.Subscription stripeSub = (com.stripe.model.Subscription) event.getDataObjectDeserializer()
                .getObject().orElseThrow();

        subscriptionRepository.findByStripeSubscriptionId(stripeSub.getId()).ifPresent(subscription -> {
            subscription.setStatus(Subscription.SubscriptionStatus.CANCELED);
            subscription.setCanceledAt(LocalDateTime.now());
            subscriptionRepository.save(subscription);
            log.info("Subscription canceled: {}", stripeSub.getId());
        });
    }

    private void handleInvoicePaid(Event event) {
        com.stripe.model.Invoice stripeInvoice = (com.stripe.model.Invoice) event.getDataObjectDeserializer()
                .getObject().orElseThrow();

        Subscription subscription = subscriptionRepository.findByStripeCustomerId(stripeInvoice.getCustomer())
                .orElse(null);

        if (subscription == null) {
            log.warn("No subscription found for customer: {}", stripeInvoice.getCustomer());
            return;
        }

        Invoice invoice = invoiceRepository.findByStripeInvoiceId(stripeInvoice.getId())
                .orElse(new Invoice());

        invoice.setCompany(subscription.getCompany());
        invoice.setSubscription(subscription);
        invoice.setStripeInvoiceId(stripeInvoice.getId());
        invoice.setStripePaymentIntentId(stripeInvoice.getPaymentIntent());
        invoice.setInvoiceNumber(stripeInvoice.getNumber());
        invoice.setStatus(Invoice.InvoiceStatus.PAID);
        invoice.setSubtotal(BigDecimal.valueOf(stripeInvoice.getSubtotal()).divide(BigDecimal.valueOf(100)));
        invoice.setTax(stripeInvoice.getTax() != null 
                ? BigDecimal.valueOf(stripeInvoice.getTax()).divide(BigDecimal.valueOf(100)) 
                : BigDecimal.ZERO);
        invoice.setTotal(BigDecimal.valueOf(stripeInvoice.getTotal()).divide(BigDecimal.valueOf(100)));
        invoice.setCurrency(stripeInvoice.getCurrency().toUpperCase());
        invoice.setPeriodStart(fromTimestamp(stripeInvoice.getPeriodStart()));
        invoice.setPeriodEnd(fromTimestamp(stripeInvoice.getPeriodEnd()));
        invoice.setPaidAt(LocalDateTime.now());
        invoice.setInvoicePdf(stripeInvoice.getInvoicePdf());
        invoice.setHostedInvoiceUrl(stripeInvoice.getHostedInvoiceUrl());

        invoiceRepository.save(invoice);
        log.info("Invoice paid: {}", stripeInvoice.getId());
    }

    private void handleInvoicePaymentFailed(Event event) {
        com.stripe.model.Invoice stripeInvoice = (com.stripe.model.Invoice) event.getDataObjectDeserializer()
                .getObject().orElseThrow();

        subscriptionRepository.findByStripeCustomerId(stripeInvoice.getCustomer()).ifPresent(subscription -> {
            subscription.setStatus(Subscription.SubscriptionStatus.PAST_DUE);
            subscriptionRepository.save(subscription);
            log.warn("Invoice payment failed for subscription: {}", subscription.getStripeSubscriptionId());
        });
    }

    // ============ Helpers ============

    private String getOrCreateStripeCustomer(Company company) throws StripeException {
        if (company.getStripeCustomerId() != null) {
            return company.getStripeCustomerId();
        }

        // Use contact email or fallback to company name based email
        String email = company.getContactEmail() != null 
                ? company.getContactEmail() 
                : company.getSlug() + "@brazucacms.com";

        CustomerCreateParams params = CustomerCreateParams.builder()
                .setEmail(email)
                .setName(company.getName())
                .putMetadata("company_id", company.getId().toString())
                .build();

        Customer customer = Customer.create(params);
        company.setStripeCustomerId(customer.getId());
        companyRepository.save(company);

        return customer.getId();
    }

    private com.brazucacms.model.Subscription.SubscriptionStatus mapStripeStatus(String status) {
        return switch (status) {
            case "active" -> com.brazucacms.model.Subscription.SubscriptionStatus.ACTIVE;
            case "past_due" -> com.brazucacms.model.Subscription.SubscriptionStatus.PAST_DUE;
            case "canceled" -> com.brazucacms.model.Subscription.SubscriptionStatus.CANCELED;
            case "unpaid" -> com.brazucacms.model.Subscription.SubscriptionStatus.UNPAID;
            case "trialing" -> com.brazucacms.model.Subscription.SubscriptionStatus.TRIALING;
            case "incomplete" -> com.brazucacms.model.Subscription.SubscriptionStatus.INCOMPLETE;
            case "incomplete_expired" -> com.brazucacms.model.Subscription.SubscriptionStatus.INCOMPLETE_EXPIRED;
            case "paused" -> com.brazucacms.model.Subscription.SubscriptionStatus.PAUSED;
            default -> com.brazucacms.model.Subscription.SubscriptionStatus.ACTIVE;
        };
    }

    private LocalDateTime fromTimestamp(Long timestamp) {
        if (timestamp == null) return null;
        return LocalDateTime.ofInstant(Instant.ofEpochSecond(timestamp), ZoneId.systemDefault());
    }
}
