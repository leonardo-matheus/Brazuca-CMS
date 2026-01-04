package com.brazucacms.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "subscription_plans")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubscriptionPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name; // starter, pro, enterprise

    @Column(name = "display_name", nullable = false)
    private String displayName;

    private String description;

    @Column(name = "price_monthly", precision = 10, scale = 2)
    private BigDecimal priceMonthly;

    @Column(name = "price_yearly", precision = 10, scale = 2)
    private BigDecimal priceYearly;

    @Column(name = "stripe_price_id_monthly")
    private String stripePriceIdMonthly;

    @Column(name = "stripe_price_id_yearly")
    private String stripePriceIdYearly;

    @Column(name = "stripe_product_id")
    private String stripeProductId;

    // Limits
    @Column(name = "max_projects")
    @Builder.Default
    private Integer maxProjects = 1;

    @Column(name = "max_users")
    @Builder.Default
    private Integer maxUsers = 3;

    @Column(name = "max_api_requests")
    @Builder.Default
    private Long maxApiRequests = 10000L;

    @Column(name = "max_storage_mb")
    @Builder.Default
    private Long maxStorageMb = 1024L; // 1GB

    @Column(name = "max_webhooks")
    @Builder.Default
    private Integer maxWebhooks = 5;

    // Features
    @Builder.Default
    private Boolean hasGraphql = false;

    @Builder.Default
    private Boolean hasWebhooks = true;

    @Builder.Default
    private Boolean hasPrioritySupport = false;

    @Builder.Default
    private Boolean hasSso = false;

    @Builder.Default
    private Boolean hasCustomDomain = false;

    @Builder.Default
    private Boolean hasAdvancedAnalytics = false;

    @Builder.Default
    private Boolean hasApiRateLimit = true;

    @Column(name = "sort_order")
    @Builder.Default
    private Integer sortOrder = 0;

    @Builder.Default
    private Boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
