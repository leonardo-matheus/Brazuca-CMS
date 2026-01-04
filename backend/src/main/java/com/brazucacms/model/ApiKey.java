package com.brazucacms.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "api_keys")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiKey {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workspace_id", nullable = false)
    private Workspace workspace;

    @Column(nullable = false)
    private String name;

    private String description;

    @Column(name = "api_key", nullable = false, unique = true)
    private String key;

    @Column(name = "key_prefix", nullable = false)
    private String keyPrefix;

    @Column(columnDefinition = "TEXT")
    private String permissions; // JSON array: ["read:entries", "read:media", "write:entries"]

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ApiKeyStatus status = ApiKeyStatus.ACTIVE;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ApiKeyType type = ApiKeyType.READ_ONLY;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    @Column(name = "last_used_at")
    private LocalDateTime lastUsedAt;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(name = "request_count")
    @Builder.Default
    private Long requestCount = 0L;

    @Column(name = "last_month_requests")
    @Builder.Default
    private Long lastMonthRequests = 0L;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public enum ApiKeyType {
        READ_ONLY,
        READ_WRITE,
        FULL_ACCESS
    }

    public enum ApiKeyStatus {
        ACTIVE, REVOKED
    }
}
