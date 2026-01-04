package com.brazucacms.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "webhooks")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Webhook {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workspace_id", nullable = false)
    private Workspace workspace;

    @Column(nullable = false)
    private String url;

    private String description;

    @Column(columnDefinition = "TEXT")
    private String events; // JSON array of events: ["entry.created", "entry.published"]

    @Column(columnDefinition = "TEXT")
    private String headers; // JSON object for custom headers

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private WebhookStatus status = WebhookStatus.ACTIVE;

    @Column(name = "failure_count")
    @Builder.Default
    private Integer failureCount = 0;

    @Column(name = "last_failed_at")
    private LocalDateTime lastFailedAt;

    @Column(name = "last_success_at")
    private LocalDateTime lastSuccessAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "webhook", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<WebhookLog> logs = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum WebhookStatus {
        ACTIVE, INACTIVE, FAILED
    }

    // Webhook Events
    public static final String EVENT_ENTRY_CREATED = "entry.created";
    public static final String EVENT_ENTRY_UPDATED = "entry.updated";
    public static final String EVENT_ENTRY_PUBLISHED = "entry.published";
    public static final String EVENT_ENTRY_UNPUBLISHED = "entry.unpublished";
    public static final String EVENT_ENTRY_DELETED = "entry.deleted";
    public static final String EVENT_MEDIA_UPLOADED = "media.uploaded";
    public static final String EVENT_MEDIA_DELETED = "media.deleted";
    public static final String EVENT_CONTENT_TYPE_CREATED = "content_type.created";
    public static final String EVENT_CONTENT_TYPE_UPDATED = "content_type.updated";
    public static final String EVENT_CONTENT_TYPE_DELETED = "content_type.deleted";
}
