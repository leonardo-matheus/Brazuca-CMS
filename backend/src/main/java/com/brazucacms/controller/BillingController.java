package com.brazucacms.controller;

import com.brazucacms.dto.common.ApiResponse;
import com.brazucacms.dto.subscription.*;
import com.brazucacms.model.User;
import com.brazucacms.service.StripeService;
import com.brazucacms.service.UserService;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/billing")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Billing", description = "Subscription and billing management endpoints")
public class BillingController {

    private final StripeService stripeService;
    private final UserService userService;

    // ============ Plans ============

    @GetMapping("/plans")
    @Operation(summary = "Get all available subscription plans")
    public ResponseEntity<ApiResponse<List<PlanResponse>>> getPlans() {
        List<PlanResponse> plans = stripeService.getActivePlans();
        return ResponseEntity.ok(ApiResponse.success(plans));
    }

    @GetMapping("/plans/{id}")
    @Operation(summary = "Get a specific plan by ID")
    public ResponseEntity<ApiResponse<PlanResponse>> getPlan(@PathVariable Long id) {
        PlanResponse plan = stripeService.getPlanById(id);
        return ResponseEntity.ok(ApiResponse.success(plan));
    }

    // ============ Checkout ============

    @PostMapping("/checkout")
    @Operation(summary = "Create a Stripe checkout session")
    public ResponseEntity<ApiResponse<CheckoutSessionResponse>> createCheckoutSession(
            @Valid @RequestBody CreateCheckoutRequest request,
            @AuthenticationPrincipal UserDetails userDetails) throws StripeException {
        
        User user = userService.findByEmail(userDetails.getUsername());
        Long companyId = user.getCompany().getId();
        
        CheckoutSessionResponse response = stripeService.createCheckoutSession(companyId, request);
        return ResponseEntity.ok(ApiResponse.success("Checkout session created", response));
    }

    // ============ Billing Portal ============

    @PostMapping("/portal")
    @Operation(summary = "Create a Stripe billing portal session")
    public ResponseEntity<ApiResponse<PortalSessionResponse>> createBillingPortalSession(
            @RequestParam(required = false) String returnUrl,
            @AuthenticationPrincipal UserDetails userDetails) throws StripeException {
        
        User user = userService.findByEmail(userDetails.getUsername());
        Long companyId = user.getCompany().getId();
        
        PortalSessionResponse response = stripeService.createBillingPortalSession(companyId, returnUrl);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // ============ Subscription ============

    @GetMapping("/subscription")
    @Operation(summary = "Get current company subscription")
    public ResponseEntity<ApiResponse<SubscriptionResponse>> getCurrentSubscription(
            @AuthenticationPrincipal UserDetails userDetails) {
        
        User user = userService.findByEmail(userDetails.getUsername());
        Long companyId = user.getCompany().getId();
        
        SubscriptionResponse subscription = stripeService.getActiveSubscription(companyId);
        return ResponseEntity.ok(ApiResponse.success(subscription));
    }

    @PostMapping("/subscription/cancel")
    @Operation(summary = "Cancel subscription")
    public ResponseEntity<ApiResponse<SubscriptionResponse>> cancelSubscription(
            @RequestParam(defaultValue = "false") boolean immediate,
            @AuthenticationPrincipal UserDetails userDetails) throws StripeException {
        
        User user = userService.findByEmail(userDetails.getUsername());
        Long companyId = user.getCompany().getId();
        
        SubscriptionResponse subscription = stripeService.cancelSubscription(companyId, immediate);
        String message = immediate ? "Subscription canceled immediately" : "Subscription will be canceled at the end of the billing period";
        return ResponseEntity.ok(ApiResponse.success(message, subscription));
    }

    @PostMapping("/subscription/reactivate")
    @Operation(summary = "Reactivate a canceled subscription")
    public ResponseEntity<ApiResponse<SubscriptionResponse>> reactivateSubscription(
            @AuthenticationPrincipal UserDetails userDetails) throws StripeException {
        
        User user = userService.findByEmail(userDetails.getUsername());
        Long companyId = user.getCompany().getId();
        
        SubscriptionResponse subscription = stripeService.reactivateSubscription(companyId);
        return ResponseEntity.ok(ApiResponse.success("Subscription reactivated", subscription));
    }

    // ============ Invoices ============

    @GetMapping("/invoices")
    @Operation(summary = "Get company invoices")
    public ResponseEntity<ApiResponse<List<InvoiceResponse>>> getInvoices(
            @AuthenticationPrincipal UserDetails userDetails) {
        
        User user = userService.findByEmail(userDetails.getUsername());
        Long companyId = user.getCompany().getId();
        
        List<InvoiceResponse> invoices = stripeService.getInvoices(companyId);
        return ResponseEntity.ok(ApiResponse.success(invoices));
    }

    // ============ Webhook ============

    @PostMapping("/webhook")
    @Operation(summary = "Stripe webhook endpoint")
    public ResponseEntity<String> handleWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String sigHeader) {
        
        try {
            stripeService.handleWebhook(payload, sigHeader);
            return ResponseEntity.ok("Webhook processed");
        } catch (SignatureVerificationException e) {
            log.error("Invalid webhook signature", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid signature");
        } catch (Exception e) {
            log.error("Webhook processing error", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Webhook error");
        }
    }
}
