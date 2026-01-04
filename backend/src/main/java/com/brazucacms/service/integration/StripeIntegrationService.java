package com.brazucacms.service.integration;

import com.brazucacms.dto.integration.IntegrationConnectRequest;
import com.brazucacms.model.Integration;
import com.brazucacms.repository.IntegrationRepository;
import com.brazucacms.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;

/**
 * Service for Stripe payment integration.
 * Handles subscriptions, customers, products, and webhooks.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class StripeIntegrationService {

    private final IntegrationRepository integrationRepository;
    private final UserRepository userRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${integration.stripe.secret-key:}")
    private String stripeSecretKey;

    @Value("${integration.stripe.publishable-key:}")
    private String stripePublishableKey;

    @Value("${integration.stripe.webhook-secret:}")
    private String webhookSecret;

    private static final String STRIPE_API_URL = "https://api.stripe.com/v1";

    /**
     * Connect Stripe with API keys
     */
    public Integration connectWithApiKey(Long companyId, Long userId, IntegrationConnectRequest request) {
        var user = userRepository.findById(userId).orElseThrow();
        
        String secretKey = request.getApiKey();
        
        // Validate key by fetching account info
        Map<String, Object> account = getAccount(secretKey);
        
        Integration integration = new Integration();
        integration.setCompany(user.getCompany());
        integration.setConnectedBy(user);
        integration.setPlatform(Integration.Platform.STRIPE);
        integration.setName(request.getName() != null ? request.getName() : "Stripe");
        integration.setStatus(Integration.IntegrationStatus.ACTIVE);
        integration.setAccessToken(secretKey);
        
        Map<String, Object> config = new HashMap<>();
        config.put("accountId", account.get("id"));
        config.put("businessName", account.get("business_profile") != null ? 
                ((Map<String, Object>) account.get("business_profile")).get("name") : null);
        config.put("country", account.get("country"));
        config.put("currency", account.get("default_currency"));
        config.put("livemode", account.get("livemode"));
        
        try {
            integration.setConfig(objectMapper.writeValueAsString(config));
        } catch (Exception e) {
            log.error("Failed to serialize config", e);
        }
        
        integration.setConnectedAt(LocalDateTime.now());
        
        return integrationRepository.save(integration);
    }

    /**
     * Get Stripe account info
     */
    public Map<String, Object> getAccount(String secretKey) {
        HttpHeaders headers = createHeaders(secretKey);
        HttpEntity<?> entity = new HttpEntity<>(headers);
        
        ResponseEntity<Map> response = restTemplate.exchange(
                STRIPE_API_URL + "/account",
                HttpMethod.GET,
                entity,
                Map.class
        );
        
        return response.getBody();
    }

    /**
     * List customers
     */
    public Map<String, Object> listCustomers(Long integrationId, int limit, String startingAfter) {
        Integration integration = getIntegration(integrationId);
        HttpHeaders headers = createHeaders(integration.getAccessToken());
        HttpEntity<?> entity = new HttpEntity<>(headers);
        
        String url = STRIPE_API_URL + "/customers?limit=" + limit;
        if (startingAfter != null) {
            url += "&starting_after=" + startingAfter;
        }
        
        ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);
        return response.getBody();
    }

    /**
     * Create a customer
     */
    public Map<String, Object> createCustomer(Long integrationId, Map<String, Object> customerData) {
        Integration integration = getIntegration(integrationId);
        HttpHeaders headers = createHeaders(integration.getAccessToken());
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        
        StringBuilder formData = new StringBuilder();
        if (customerData.containsKey("email")) {
            formData.append("email=").append(customerData.get("email"));
        }
        if (customerData.containsKey("name")) {
            formData.append("&name=").append(customerData.get("name"));
        }
        if (customerData.containsKey("description")) {
            formData.append("&description=").append(customerData.get("description"));
        }
        if (customerData.containsKey("metadata")) {
            Map<String, String> metadata = (Map<String, String>) customerData.get("metadata");
            for (Map.Entry<String, String> entry : metadata.entrySet()) {
                formData.append("&metadata[").append(entry.getKey()).append("]=").append(entry.getValue());
            }
        }
        
        HttpEntity<String> entity = new HttpEntity<>(formData.toString(), headers);
        ResponseEntity<Map> response = restTemplate.exchange(
                STRIPE_API_URL + "/customers",
                HttpMethod.POST,
                entity,
                Map.class
        );
        
        return response.getBody();
    }

    /**
     * List products
     */
    public Map<String, Object> listProducts(Long integrationId, int limit, boolean active) {
        Integration integration = getIntegration(integrationId);
        HttpHeaders headers = createHeaders(integration.getAccessToken());
        HttpEntity<?> entity = new HttpEntity<>(headers);
        
        String url = STRIPE_API_URL + "/products?limit=" + limit + "&active=" + active;
        
        ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);
        return response.getBody();
    }

    /**
     * Create a product
     */
    public Map<String, Object> createProduct(Long integrationId, Map<String, Object> productData) {
        Integration integration = getIntegration(integrationId);
        HttpHeaders headers = createHeaders(integration.getAccessToken());
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        
        StringBuilder formData = new StringBuilder();
        formData.append("name=").append(productData.get("name"));
        if (productData.containsKey("description")) {
            formData.append("&description=").append(productData.get("description"));
        }
        if (productData.containsKey("images")) {
            List<String> images = (List<String>) productData.get("images");
            for (int i = 0; i < images.size(); i++) {
                formData.append("&images[").append(i).append("]=").append(images.get(i));
            }
        }
        
        HttpEntity<String> entity = new HttpEntity<>(formData.toString(), headers);
        ResponseEntity<Map> response = restTemplate.exchange(
                STRIPE_API_URL + "/products",
                HttpMethod.POST,
                entity,
                Map.class
        );
        
        return response.getBody();
    }

    /**
     * Create a price for a product
     */
    public Map<String, Object> createPrice(Long integrationId, Map<String, Object> priceData) {
        Integration integration = getIntegration(integrationId);
        HttpHeaders headers = createHeaders(integration.getAccessToken());
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        
        StringBuilder formData = new StringBuilder();
        formData.append("currency=").append(priceData.getOrDefault("currency", "usd"));
        formData.append("&product=").append(priceData.get("productId"));
        formData.append("&unit_amount=").append(priceData.get("unitAmount")); // In cents
        
        if (priceData.containsKey("recurring")) {
            Map<String, Object> recurring = (Map<String, Object>) priceData.get("recurring");
            formData.append("&recurring[interval]=").append(recurring.getOrDefault("interval", "month"));
            if (recurring.containsKey("interval_count")) {
                formData.append("&recurring[interval_count]=").append(recurring.get("interval_count"));
            }
        }
        
        HttpEntity<String> entity = new HttpEntity<>(formData.toString(), headers);
        ResponseEntity<Map> response = restTemplate.exchange(
                STRIPE_API_URL + "/prices",
                HttpMethod.POST,
                entity,
                Map.class
        );
        
        return response.getBody();
    }

    /**
     * List subscriptions
     */
    public Map<String, Object> listSubscriptions(Long integrationId, String status, int limit) {
        Integration integration = getIntegration(integrationId);
        HttpHeaders headers = createHeaders(integration.getAccessToken());
        HttpEntity<?> entity = new HttpEntity<>(headers);
        
        String url = STRIPE_API_URL + "/subscriptions?limit=" + limit;
        if (status != null) {
            url += "&status=" + status;
        }
        
        ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);
        return response.getBody();
    }

    /**
     * Create a subscription
     */
    public Map<String, Object> createSubscription(Long integrationId, String customerId, String priceId) {
        Integration integration = getIntegration(integrationId);
        HttpHeaders headers = createHeaders(integration.getAccessToken());
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        
        String formData = "customer=" + customerId + "&items[0][price]=" + priceId;
        
        HttpEntity<String> entity = new HttpEntity<>(formData, headers);
        ResponseEntity<Map> response = restTemplate.exchange(
                STRIPE_API_URL + "/subscriptions",
                HttpMethod.POST,
                entity,
                Map.class
        );
        
        return response.getBody();
    }

    /**
     * Cancel a subscription
     */
    public Map<String, Object> cancelSubscription(Long integrationId, String subscriptionId) {
        Integration integration = getIntegration(integrationId);
        HttpHeaders headers = createHeaders(integration.getAccessToken());
        HttpEntity<?> entity = new HttpEntity<>(headers);
        
        ResponseEntity<Map> response = restTemplate.exchange(
                STRIPE_API_URL + "/subscriptions/" + subscriptionId,
                HttpMethod.DELETE,
                entity,
                Map.class
        );
        
        return response.getBody();
    }

    /**
     * Create a checkout session
     */
    public Map<String, Object> createCheckoutSession(Long integrationId, Map<String, Object> sessionData) {
        Integration integration = getIntegration(integrationId);
        HttpHeaders headers = createHeaders(integration.getAccessToken());
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        
        StringBuilder formData = new StringBuilder();
        formData.append("mode=").append(sessionData.getOrDefault("mode", "payment"));
        formData.append("&success_url=").append(sessionData.get("successUrl"));
        formData.append("&cancel_url=").append(sessionData.get("cancelUrl"));
        
        List<Map<String, Object>> lineItems = (List<Map<String, Object>>) sessionData.get("lineItems");
        if (lineItems != null) {
            for (int i = 0; i < lineItems.size(); i++) {
                Map<String, Object> item = lineItems.get(i);
                formData.append("&line_items[").append(i).append("][price]=").append(item.get("priceId"));
                formData.append("&line_items[").append(i).append("][quantity]=").append(item.getOrDefault("quantity", 1));
            }
        }
        
        if (sessionData.containsKey("customerId")) {
            formData.append("&customer=").append(sessionData.get("customerId"));
        }
        
        HttpEntity<String> entity = new HttpEntity<>(formData.toString(), headers);
        ResponseEntity<Map> response = restTemplate.exchange(
                STRIPE_API_URL + "/checkout/sessions",
                HttpMethod.POST,
                entity,
                Map.class
        );
        
        return response.getBody();
    }

    /**
     * Create a payment intent
     */
    public Map<String, Object> createPaymentIntent(Long integrationId, int amount, String currency) {
        Integration integration = getIntegration(integrationId);
        HttpHeaders headers = createHeaders(integration.getAccessToken());
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        
        String formData = "amount=" + amount + "&currency=" + currency + "&automatic_payment_methods[enabled]=true";
        
        HttpEntity<String> entity = new HttpEntity<>(formData, headers);
        ResponseEntity<Map> response = restTemplate.exchange(
                STRIPE_API_URL + "/payment_intents",
                HttpMethod.POST,
                entity,
                Map.class
        );
        
        return response.getBody();
    }

    /**
     * Get invoices
     */
    public Map<String, Object> listInvoices(Long integrationId, String customerId, int limit) {
        Integration integration = getIntegration(integrationId);
        HttpHeaders headers = createHeaders(integration.getAccessToken());
        HttpEntity<?> entity = new HttpEntity<>(headers);
        
        String url = STRIPE_API_URL + "/invoices?limit=" + limit;
        if (customerId != null) {
            url += "&customer=" + customerId;
        }
        
        ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);
        return response.getBody();
    }

    /**
     * Process webhook event
     */
    public Map<String, Object> processWebhook(String signature, String payload) {
        log.info("Processing Stripe webhook");
        
        // In production, verify signature using webhookSecret
        // Stripe-Signature header contains: t=timestamp,v1=signature
        
        try {
            Map<String, Object> event = objectMapper.readValue(payload, Map.class);
            String eventType = (String) event.get("type");
            Map<String, Object> data = (Map<String, Object>) event.get("data");
            Map<String, Object> object = (Map<String, Object>) data.get("object");
            
            log.info("Stripe event type: {}", eventType);
            
            Map<String, Object> result = new HashMap<>();
            result.put("eventType", eventType);
            result.put("processed", true);
            
            switch (eventType) {
                case "checkout.session.completed":
                    result.put("customerId", object.get("customer"));
                    result.put("paymentStatus", object.get("payment_status"));
                    result.put("amountTotal", object.get("amount_total"));
                    break;
                    
                case "customer.subscription.created":
                case "customer.subscription.updated":
                    result.put("subscriptionId", object.get("id"));
                    result.put("status", object.get("status"));
                    result.put("customerId", object.get("customer"));
                    break;
                    
                case "customer.subscription.deleted":
                    result.put("subscriptionId", object.get("id"));
                    result.put("canceled", true);
                    break;
                    
                case "invoice.paid":
                    result.put("invoiceId", object.get("id"));
                    result.put("amountPaid", object.get("amount_paid"));
                    result.put("customerId", object.get("customer"));
                    break;
                    
                case "invoice.payment_failed":
                    result.put("invoiceId", object.get("id"));
                    result.put("amountDue", object.get("amount_due"));
                    result.put("customerId", object.get("customer"));
                    result.put("failed", true);
                    break;
                    
                case "payment_intent.succeeded":
                    result.put("paymentIntentId", object.get("id"));
                    result.put("amount", object.get("amount"));
                    result.put("status", "succeeded");
                    break;
                    
                default:
                    result.put("message", "Event type not handled");
            }
            
            return result;
        } catch (Exception e) {
            log.error("Failed to process webhook", e);
            throw new RuntimeException("Failed to process webhook: " + e.getMessage());
        }
    }

    /**
     * Register webhook endpoint in Stripe
     */
    public Map<String, Object> registerWebhook(Long integrationId, String webhookUrl, List<String> events) {
        Integration integration = getIntegration(integrationId);
        HttpHeaders headers = createHeaders(integration.getAccessToken());
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        
        StringBuilder formData = new StringBuilder();
        formData.append("url=").append(webhookUrl);
        
        for (int i = 0; i < events.size(); i++) {
            formData.append("&enabled_events[").append(i).append("]=").append(events.get(i));
        }
        
        HttpEntity<String> entity = new HttpEntity<>(formData.toString(), headers);
        ResponseEntity<Map> response = restTemplate.exchange(
                STRIPE_API_URL + "/webhook_endpoints",
                HttpMethod.POST,
                entity,
                Map.class
        );
        
        // Store webhook secret from response
        Map<String, Object> webhook = response.getBody();
        if (webhook != null && webhook.containsKey("secret")) {
            try {
                Map<String, Object> config = objectMapper.readValue(integration.getConfig(), Map.class);
                config.put("webhookId", webhook.get("id"));
                config.put("webhookSecret", webhook.get("secret"));
                integration.setConfig(objectMapper.writeValueAsString(config));
                integration.setWebhookConfigured(true);
                integrationRepository.save(integration);
            } catch (Exception e) {
                log.error("Failed to save webhook config", e);
            }
        }
        
        return webhook;
    }

    /**
     * Get balance
     */
    public Map<String, Object> getBalance(Long integrationId) {
        Integration integration = getIntegration(integrationId);
        HttpHeaders headers = createHeaders(integration.getAccessToken());
        HttpEntity<?> entity = new HttpEntity<>(headers);
        
        ResponseEntity<Map> response = restTemplate.exchange(
                STRIPE_API_URL + "/balance",
                HttpMethod.GET,
                entity,
                Map.class
        );
        
        return response.getBody();
    }

    // ============ Helper Methods ============

    private Integration getIntegration(Long integrationId) {
        return integrationRepository.findById(integrationId)
                .orElseThrow(() -> new RuntimeException("Integration not found"));
    }

    private HttpHeaders createHeaders(String secretKey) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBasicAuth(secretKey, "");
        headers.set("Stripe-Version", "2024-04-10");
        return headers;
    }
}
