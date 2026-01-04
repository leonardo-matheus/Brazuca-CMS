package com.brazucacms.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Automation workflow that chains multiple integrations together.
 * Example: GitHub commit → CMS publish → OpenAPI update
 */
@Entity
@Table(name = "automation_workflows")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AutomationWorkflow {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private WorkflowStatus status = WorkflowStatus.DRAFT;

    // Trigger configuration (what starts the workflow)
    @Enumerated(EnumType.STRING)
    @Column(name = "trigger_type", nullable = false)
    private TriggerType triggerType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trigger_integration_id")
    private Integration triggerIntegration;

    @Column(name = "trigger_event")
    private String triggerEvent; // e.g., "product.created", "push", "order.placed"

    @Column(name = "trigger_filter", columnDefinition = "TEXT")
    private String triggerFilter; // JSON filter conditions

    // Actions to execute (stored as JSON array)
    @Column(columnDefinition = "TEXT", nullable = false)
    private String actions;

    // Execution stats
    @Column(name = "total_runs")
    @Builder.Default
    private Long totalRuns = 0L;

    @Column(name = "successful_runs")
    @Builder.Default
    private Long successfulRuns = 0L;

    @Column(name = "failed_runs")
    @Builder.Default
    private Long failedRuns = 0L;

    @Column(name = "last_run_at")
    private LocalDateTime lastRunAt;

    @Column(name = "last_run_status")
    private String lastRunStatus;

    // Created by user
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_user_id")
    private User createdBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum WorkflowStatus {
        DRAFT,    // Not yet active
        ACTIVE,   // Running
        PAUSED,   // Temporarily disabled
        ARCHIVED  // No longer in use
    }

    public enum TriggerType {
        WEBHOOK,      // External webhook received
        SCHEDULE,     // Cron-based schedule
        MANUAL,       // Manually triggered
        INTEGRATION,  // Integration event (e.g., Shopify product created)
        CMS_EVENT     // Internal CMS event (entry created, published, etc.)
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
