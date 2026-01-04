package com.brazucacms.dto.subscription;

import com.brazucacms.model.Subscription;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubscriptionResponse {

    private Long id;
    private PlanResponse plan;
    private String status;
    private String billingInterval;
    private LocalDateTime currentPeriodStart;
    private LocalDateTime currentPeriodEnd;
    private Boolean cancelAtPeriodEnd;
    private LocalDateTime canceledAt;
    private LocalDateTime trialStart;
    private LocalDateTime trialEnd;
    private BigDecimal amount;
    private String currency;
    private String stripeSubscriptionId;
    private LocalDateTime createdAt;

    public static SubscriptionResponse fromEntity(Subscription subscription) {
        return SubscriptionResponse.builder()
                .id(subscription.getId())
                .plan(PlanResponse.fromEntity(subscription.getPlan()))
                .status(subscription.getStatus().name())
                .billingInterval(subscription.getBillingInterval().name())
                .currentPeriodStart(subscription.getCurrentPeriodStart())
                .currentPeriodEnd(subscription.getCurrentPeriodEnd())
                .cancelAtPeriodEnd(subscription.getCancelAtPeriodEnd())
                .canceledAt(subscription.getCanceledAt())
                .trialStart(subscription.getTrialStart())
                .trialEnd(subscription.getTrialEnd())
                .amount(subscription.getAmount())
                .currency(subscription.getCurrency())
                .stripeSubscriptionId(subscription.getStripeSubscriptionId())
                .createdAt(subscription.getCreatedAt())
                .build();
    }
}
