package com.brazucacms.dto.integration;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowCreateRequest {
    
    @NotBlank(message = "Name is required")
    private String name;
    
    private String description;
    
    @NotNull(message = "Trigger is required")
    private TriggerConfig trigger;
    
    @NotNull(message = "At least one action is required")
    private List<ActionConfig> actions;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TriggerConfig {
        @NotBlank(message = "Trigger type is required")
        private String type; // WEBHOOK, SCHEDULE, MANUAL, INTEGRATION, CMS_EVENT
        
        private Long integrationId;
        private String event;
        private Map<String, Object> filter;
        private String schedule; // Cron expression for SCHEDULE type
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ActionConfig {
        @NotBlank(message = "Action type is required")
        private String type; // INTEGRATION, CMS, HTTP, EMAIL, DELAY
        
        private Long integrationId;
        private String action;
        private Map<String, Object> config;
        private ConditionConfig condition;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ConditionConfig {
        private String field;
        private String operator; // equals, contains, gt, lt, etc.
        private Object value;
    }
}
