package com.brazucacms.dto.integration;

import com.brazucacms.model.AutomationWorkflow;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowResponse {
    private Long id;
    private String name;
    private String description;
    private String status;
    private TriggerInfo trigger;
    private List<ActionInfo> actions;
    private StatsInfo stats;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TriggerInfo {
        private String type;
        private Long integrationId;
        private String integrationName;
        private String platform;
        private String event;
        private String eventLabel;
        private Object filter;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ActionInfo {
        private int order;
        private String type;
        private Long integrationId;
        private String integrationName;
        private String platform;
        private String action;
        private String actionLabel;
        private Object config;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatsInfo {
        private Long totalRuns;
        private Long successfulRuns;
        private Long failedRuns;
        private Double successRate;
        private LocalDateTime lastRunAt;
        private String lastRunStatus;
    }

    public static WorkflowResponse fromEntity(AutomationWorkflow workflow, List<ActionInfo> actionsList) {
        double successRate = workflow.getTotalRuns() > 0 
            ? (double) workflow.getSuccessfulRuns() / workflow.getTotalRuns() * 100 
            : 0;

        return WorkflowResponse.builder()
                .id(workflow.getId())
                .name(workflow.getName())
                .description(workflow.getDescription())
                .status(workflow.getStatus().name())
                .stats(StatsInfo.builder()
                        .totalRuns(workflow.getTotalRuns())
                        .successfulRuns(workflow.getSuccessfulRuns())
                        .failedRuns(workflow.getFailedRuns())
                        .successRate(Math.round(successRate * 100.0) / 100.0)
                        .lastRunAt(workflow.getLastRunAt())
                        .lastRunStatus(workflow.getLastRunStatus())
                        .build())
                .actions(actionsList)
                .createdAt(workflow.getCreatedAt())
                .updatedAt(workflow.getUpdatedAt())
                .build();
    }
}
