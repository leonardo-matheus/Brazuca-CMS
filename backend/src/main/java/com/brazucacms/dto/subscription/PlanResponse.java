package com.brazucacms.dto.subscription;

import com.brazucacms.model.SubscriptionPlan;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlanResponse {

    private Long id;
    private String name;
    private String displayName;
    private String description;
    private BigDecimal priceMonthly;
    private BigDecimal priceYearly;
    private String stripePriceIdMonthly;
    private String stripePriceIdYearly;

    // Limits
    private Integer maxProjects;
    private Integer maxUsers;
    private Long maxApiRequests;
    private Long maxStorageMb;
    private Integer maxWebhooks;

    // Features
    private Boolean hasGraphql;
    private Boolean hasWebhooks;
    private Boolean hasPrioritySupport;
    private Boolean hasSso;
    private Boolean hasCustomDomain;
    private Boolean hasAdvancedAnalytics;

    public static PlanResponse fromEntity(SubscriptionPlan plan) {
        return PlanResponse.builder()
                .id(plan.getId())
                .name(plan.getName())
                .displayName(plan.getDisplayName())
                .description(plan.getDescription())
                .priceMonthly(plan.getPriceMonthly())
                .priceYearly(plan.getPriceYearly())
                .stripePriceIdMonthly(plan.getStripePriceIdMonthly())
                .stripePriceIdYearly(plan.getStripePriceIdYearly())
                .maxProjects(plan.getMaxProjects())
                .maxUsers(plan.getMaxUsers())
                .maxApiRequests(plan.getMaxApiRequests())
                .maxStorageMb(plan.getMaxStorageMb())
                .maxWebhooks(plan.getMaxWebhooks())
                .hasGraphql(plan.getHasGraphql())
                .hasWebhooks(plan.getHasWebhooks())
                .hasPrioritySupport(plan.getHasPrioritySupport())
                .hasSso(plan.getHasSso())
                .hasCustomDomain(plan.getHasCustomDomain())
                .hasAdvancedAnalytics(plan.getHasAdvancedAnalytics())
                .build();
    }
}
