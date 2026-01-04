package com.brazucacms.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Entity to track posts made to social media platforms.
 */
@Entity
@Table(name = "social_media_posts", indexes = {
    @Index(name = "idx_social_post_account", columnList = "social_account_id"),
    @Index(name = "idx_social_post_entry", columnList = "entry_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SocialMediaPost {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * The social media account used for posting
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "social_account_id", nullable = false)
    private SocialMediaAccount socialAccount;

    /**
     * The entry that was posted (optional - can be standalone post)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entry_id")
    private Entry entry;

    /**
     * The post ID returned by the platform
     */
    @Column(name = "platform_post_id")
    private String platformPostId;

    /**
     * Post status
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private PostStatus status = PostStatus.PENDING;

    /**
     * The caption/text content of the post
     */
    @Column(columnDefinition = "TEXT")
    private String caption;

    /**
     * Media URL that was posted
     */
    @Column(name = "media_url")
    private String mediaUrl;

    /**
     * Media type (IMAGE, VIDEO, CAROUSEL)
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "media_type")
    private MediaType mediaType;

    /**
     * Permalink to the post on the platform
     */
    private String permalink;

    /**
     * Error message if post failed
     */
    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    /**
     * Scheduled time for the post
     */
    @Column(name = "scheduled_at")
    private LocalDateTime scheduledAt;

    /**
     * Time when post was actually published
     */
    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    /**
     * User who created this post
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_user_id")
    private User createdBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public enum PostStatus {
        PENDING,
        PUBLISHING,
        PUBLISHED,
        SCHEDULED,
        FAILED,
        DELETED
    }

    public enum MediaType {
        IMAGE,
        VIDEO,
        CAROUSEL,
        REELS
    }
}
