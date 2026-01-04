package com.brazucacms.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Entity representing a connected social media account.
 * Supports Instagram, Facebook, Twitter, LinkedIn, etc.
 */
@Entity
@Table(name = "social_media_accounts", indexes = {
    @Index(name = "idx_social_company", columnList = "company_id"),
    @Index(name = "idx_social_platform", columnList = "platform")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SocialMediaAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Platform type (INSTAGRAM, FACEBOOK, TWITTER, LINKEDIN)
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Platform platform;

    /**
     * Account username/handle on the platform
     */
    @Column(name = "account_username")
    private String accountUsername;

    /**
     * Account ID on the platform (e.g., Instagram User ID)
     */
    @Column(name = "platform_account_id")
    private String platformAccountId;

    /**
     * For Instagram: the connected Facebook Page ID
     */
    @Column(name = "facebook_page_id")
    private String facebookPageId;

    /**
     * Access token for the platform API
     */
    @Column(name = "access_token", columnDefinition = "TEXT")
    private String accessToken;

    /**
     * Refresh token (if applicable)
     */
    @Column(name = "refresh_token", columnDefinition = "TEXT")
    private String refreshToken;

    /**
     * Token expiration time
     */
    @Column(name = "token_expires_at")
    private LocalDateTime tokenExpiresAt;

    /**
     * Account status
     */
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private AccountStatus status = AccountStatus.ACTIVE;

    /**
     * Profile picture URL from the platform
     */
    @Column(name = "profile_picture_url")
    private String profilePictureUrl;

    /**
     * Number of followers (cached)
     */
    @Column(name = "followers_count")
    private Long followersCount;

    /**
     * Company that owns this account
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    /**
     * User who connected this account
     */
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
     * Last time a post was made to this account
     */
    @Column(name = "last_post_at")
    private LocalDateTime lastPostAt;

    /**
     * Total posts made through the CMS
     */
    @Column(name = "total_posts")
    @Builder.Default
    private Integer totalPosts = 0;

    public enum Platform {
        INSTAGRAM,
        FACEBOOK,
        TWITTER,
        LINKEDIN,
        PINTEREST
    }

    public enum AccountStatus {
        ACTIVE,
        TOKEN_EXPIRED,
        DISCONNECTED,
        ERROR
    }

    /**
     * Check if token is expired or about to expire (within 1 hour)
     */
    public boolean isTokenExpiringSoon() {
        if (tokenExpiresAt == null) return false;
        return tokenExpiresAt.isBefore(LocalDateTime.now().plusHours(1));
    }

    /**
     * Check if token is valid
     */
    public boolean hasValidToken() {
        return accessToken != null && 
               !accessToken.isEmpty() && 
               (tokenExpiresAt == null || tokenExpiresAt.isAfter(LocalDateTime.now()));
    }
}
