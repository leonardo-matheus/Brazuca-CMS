package com.brazucacms.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "content_types", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"workspace_id", "slug"})
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContentType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workspace_id", nullable = false)
    private Workspace workspace;

    @Column(nullable = false)
    private String name;

    @Column(name = "display_name")
    private String displayName;

    @Column(nullable = false)
    private String slug;

    private String description;

    @Column(name = "icon")
    private String icon;

    @Column(columnDefinition = "TEXT")
    private String fields; // JSON string with field definitions

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ContentTypeStatus status = ContentTypeStatus.DRAFT;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    @Column(name = "field_count")
    @Builder.Default
    private Integer fieldCount = 0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @OneToMany(mappedBy = "contentType", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Entry> entries = new ArrayList<>();

    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum ContentTypeStatus {
        DRAFT, ACTIVE
    }
}
