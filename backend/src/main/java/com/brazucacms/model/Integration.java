package com.brazucacms.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Base entity for all platform integrations.
 * Stores credentials and configuration for each connected service.
 */
@Entity
@Table(name = "integrations", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"company_id", "platform"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Integration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Platform platform;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private IntegrationStatus status = IntegrationStatus.PENDING;

    @Column(name = "display_name")
    private String displayName;

    // Encrypted credentials stored as JSON
    @Column(columnDefinition = "TEXT")
    private String credentials;

    // Platform-specific configuration as JSON
    @Column(columnDefinition = "TEXT")
    private String configuration;

    // OAuth tokens
    @Column(name = "access_token", columnDefinition = "TEXT")
    private String accessToken;

    @Column(name = "refresh_token", columnDefinition = "TEXT")
    private String refreshToken;

    @Column(name = "token_expires_at")
    private LocalDateTime tokenExpiresAt;

    // Webhook configuration
    @Column(name = "webhook_url")
    private String webhookUrl;

    @Column(name = "webhook_secret")
    private String webhookSecret;

    // Sync status
    @Column(name = "last_sync_at")
    private LocalDateTime lastSyncAt;

    @Column(name = "last_sync_status")
    private String lastSyncStatus;

    @Column(name = "sync_error")
    private String syncError;

    // Connected by user
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "connected_by_user_id")
    private User connectedBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /**
     * Available integration platforms
     */
    public enum Platform {
        // SaaS Integrations
        GITHUB("GitHub", Category.SAAS, "Code repository and version control"),
        OPENAPI("OpenAPI", Category.SAAS, "API documentation generator"),
        STRIPE("Stripe", Category.SAAS, "Payment processing"),
        AUTH0("Auth0", Category.SAAS, "Authentication provider"),
        
        // E-commerce Integrations
        SHOPIFY("Shopify", Category.ECOMMERCE, "E-commerce platform"),
        WOOCOMMERCE("WooCommerce", Category.ECOMMERCE, "WordPress e-commerce"),
        KLAVIYO("Klaviyo", Category.ECOMMERCE, "Email marketing automation"),
        
        // Social Media (existing)
        INSTAGRAM("Instagram", Category.SOCIAL, "Photo sharing platform"),
        FACEBOOK("Facebook", Category.SOCIAL, "Social networking"),
        
        // Communication
        SLACK("Slack", Category.COMMUNICATION, "Team messaging"),
        DISCORD("Discord", Category.COMMUNICATION, "Community platform"),
        WEBHOOK("Webhook", Category.COMMUNICATION, "Custom webhook endpoint");

        private final String displayName;
        private final Category category;
        private final String description;

        Platform(String displayName, Category category, String description) {
            this.displayName = displayName;
            this.category = category;
            this.description = description;
        }

        public String getDisplayName() { return displayName; }
        public Category getCategory() { return category; }
        public String getDescription() { return description; }
    }

    public enum Category {
        SAAS("SaaS"),
        ECOMMERCE("E-commerce"),
        SOCIAL("Social Media"),
        COMMUNICATION("Communication");

        private final String displayName;

        Category(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() { return displayName; }
    }

    public enum IntegrationStatus {
        PENDING,      // Awaiting configuration
        CONNECTING,   // OAuth in progress
        ACTIVE,       // Connected and working
        ERROR,        // Connection error
        DISABLED,     // Manually disabled
        EXPIRED       // Token expired
    }

    // Helper methods
    public boolean isActive() {
        return status == IntegrationStatus.ACTIVE;
    }

    public boolean needsTokenRefresh() {
        return tokenExpiresAt != null && 
               tokenExpiresAt.isBefore(LocalDateTime.now().plusHours(1));
    }
}
