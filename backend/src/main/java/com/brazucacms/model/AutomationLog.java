package com.brazucacms.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Log entry for each workflow execution.
 * Tracks the status and results of each action in the workflow.
 */
@Entity
@Table(name = "automation_logs", indexes = {
    @Index(name = "idx_automation_logs_workflow", columnList = "workflow_id"),
    @Index(name = "idx_automation_logs_created", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AutomationLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workflow_id", nullable = false)
    private AutomationWorkflow workflow;

    @Column(name = "execution_id", nullable = false)
    private String executionId; // UUID for this execution

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ExecutionStatus status = ExecutionStatus.RUNNING;

    // Trigger data
    @Column(name = "trigger_data", columnDefinition = "TEXT")
    private String triggerData; // JSON payload that triggered the workflow

    // Actions executed (with results)
    @Column(name = "actions_log", columnDefinition = "TEXT")
    private String actionsLog; // JSON array of action results

    // Current action being executed
    @Column(name = "current_action_index")
    @Builder.Default
    private Integer currentActionIndex = 0;

    // Error information
    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "error_action")
    private String errorAction;

    // Timing
    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "duration_ms")
    private Long durationMs;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public enum ExecutionStatus {
        PENDING,   // Queued for execution
        RUNNING,   // Currently executing
        COMPLETED, // All actions completed successfully
        FAILED,    // An action failed
        CANCELLED, // Manually cancelled
        TIMEOUT    // Execution timed out
    }
}
