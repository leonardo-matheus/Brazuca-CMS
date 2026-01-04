package com.brazucacms.service.integration;

import com.brazucacms.exception.IntegrationException;
import com.brazucacms.model.*;
import com.brazucacms.repository.*;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.CompletableFuture;

/**
 * Automation Engine Service
 * Orchestrates workflows that chain multiple integrations together.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class AutomationEngineService {

    private final AutomationWorkflowRepository workflowRepository;
    private final AutomationLogRepository logRepository;
    private final IntegrationRepository integrationRepository;
    private final EntryRepository entryRepository;
    private final ObjectMapper objectMapper;
    
    // Integration services
    private final GitHubIntegrationService gitHubService;
    private final OpenAPIIntegrationService openAPIService;

    // ============ Workflow Execution ============

    /**
     * Execute a workflow manually
     */
    @Transactional
    public Map<String, Object> executeWorkflow(Long workflowId, Map<String, Object> triggerData) {
        AutomationWorkflow workflow = workflowRepository.findById(workflowId)
                .orElseThrow(() -> new IntegrationException("AUTOMATION", "NOT_FOUND", "Workflow not found"));
        
        if (workflow.getStatus() != AutomationWorkflow.WorkflowStatus.ACTIVE &&
            workflow.getStatus() != AutomationWorkflow.WorkflowStatus.DRAFT) {
            throw new IntegrationException("AUTOMATION", "NOT_ACTIVE", "Workflow is not active");
        }
        
        return executeWorkflowInternal(workflow, triggerData);
    }

    /**
     * Execute workflow triggered by an integration event
     */
    @Async
    public CompletableFuture<Map<String, Object>> executeWorkflowAsync(Long workflowId, Map<String, Object> triggerData) {
        return CompletableFuture.supplyAsync(() -> executeWorkflow(workflowId, triggerData));
    }

    /**
     * Process incoming webhook and trigger relevant workflows
     */
    @Transactional
    public List<Map<String, Object>> processWebhookTrigger(Long integrationId, String event, Map<String, Object> payload) {
        List<AutomationWorkflow> workflows = workflowRepository
                .findActiveByIntegrationAndEvent(integrationId, event);
        
        List<Map<String, Object>> results = new ArrayList<>();
        
        for (AutomationWorkflow workflow : workflows) {
            try {
                // Check filter conditions
                if (matchesFilter(workflow.getTriggerFilter(), payload)) {
                    Map<String, Object> result = executeWorkflowInternal(workflow, payload);
                    results.add(result);
                }
            } catch (Exception e) {
                log.error("Error executing workflow {}: {}", workflow.getId(), e.getMessage());
                Map<String, Object> errorResult = new HashMap<>();
                errorResult.put("workflowId", workflow.getId());
                errorResult.put("success", false);
                errorResult.put("error", e.getMessage());
                results.add(errorResult);
            }
        }
        
        return results;
    }

    /**
     * Internal workflow execution with logging
     */
    private Map<String, Object> executeWorkflowInternal(AutomationWorkflow workflow, Map<String, Object> triggerData) {
        LocalDateTime startTime = LocalDateTime.now();
        AutomationLog logEntry = createLogEntry(workflow, triggerData);
        
        Map<String, Object> result = new HashMap<>();
        result.put("workflowId", workflow.getId());
        result.put("workflowName", workflow.getName());
        result.put("startTime", startTime);
        
        List<Map<String, Object>> actionResults = new ArrayList<>();
        Map<String, Object> context = new HashMap<>(triggerData);
        
        try {
            // Parse actions from workflow
            List<Map<String, Object>> actions = objectMapper.readValue(
                    workflow.getActions(),
                    new TypeReference<List<Map<String, Object>>>() {}
            );
            
            // Execute each action in sequence
            for (int i = 0; i < actions.size(); i++) {
                Map<String, Object> action = actions.get(i);
                String actionType = (String) action.get("type");
                
                log.info("Executing action {} of {}: {}", i + 1, actions.size(), actionType);
                
                Map<String, Object> actionResult = executeAction(workflow, action, context);
                actionResults.add(actionResult);
                
                // Update context with action output
                if (actionResult.containsKey("output")) {
                    context.put("step" + (i + 1), actionResult.get("output"));
                    context.put("lastOutput", actionResult.get("output"));
                }
                
                // Check if action failed and should stop
                if (actionResult.containsKey("success") && !(Boolean) actionResult.get("success")) {
                    Boolean continueOnError = (Boolean) action.getOrDefault("continueOnError", false);
                    if (!continueOnError) {
                        throw new IntegrationException("AUTOMATION", "ACTION_FAILED", "Action failed: " + actionType);
                    }
                }
            }
            
            // Success
            LocalDateTime endTime = LocalDateTime.now();
            long durationMs = ChronoUnit.MILLIS.between(startTime, endTime);
            
            result.put("success", true);
            result.put("actionResults", actionResults);
            result.put("endTime", endTime);
            result.put("durationMs", durationMs);
            
            // Update log
            logEntry.setStatus(AutomationLog.ExecutionStatus.COMPLETED);
            logEntry.setActionsLog(objectMapper.writeValueAsString(actionResults));
            logEntry.setDurationMs(durationMs);
            logEntry.setCompletedAt(endTime);
            
            // Update workflow stats
            workflow.setTotalRuns(workflow.getTotalRuns() + 1);
            workflow.setSuccessfulRuns(workflow.getSuccessfulRuns() + 1);
            workflow.setLastRunAt(LocalDateTime.now());
            workflowRepository.save(workflow);
            
        } catch (Exception e) {
            log.error("Workflow execution failed: {}", e.getMessage(), e);
            
            result.put("success", false);
            result.put("error", e.getMessage());
            result.put("actionResults", actionResults);
            
            // Update log
            logEntry.setStatus(AutomationLog.ExecutionStatus.FAILED);
            logEntry.setErrorMessage(e.getMessage());
            logEntry.setCompletedAt(LocalDateTime.now());
            
            // Update workflow stats
            workflow.setTotalRuns(workflow.getTotalRuns() + 1);
            workflow.setFailedRuns(workflow.getFailedRuns() + 1);
            workflow.setLastRunAt(LocalDateTime.now());
            workflowRepository.save(workflow);
        }
        
        logRepository.save(logEntry);
        return result;
    }

    /**
     * Execute a single action
     */
    private Map<String, Object> executeAction(AutomationWorkflow workflow, Map<String, Object> action, Map<String, Object> context) {
        String actionType = (String) action.get("type");
        
        @SuppressWarnings("unchecked")
        Map<String, Object> config = (Map<String, Object>) action.getOrDefault("config", new HashMap<>());
        
        // Resolve template variables in config
        Map<String, Object> resolvedConfig = resolveTemplates(config, context);
        
        Map<String, Object> result = new HashMap<>();
        result.put("actionType", actionType);
        result.put("startTime", LocalDateTime.now());
        
        try {
            switch (actionType) {
                case "LOG":
                    result.put("output", executeLogAction(resolvedConfig, context));
                    break;
                    
                case "WAIT":
                    result.put("output", executeWaitAction(resolvedConfig));
                    break;
                    
                case "TRANSFORM":
                    result.put("output", executeTransformAction(resolvedConfig, context));
                    break;
                    
                case "CREATE_ENTRY":
                    result.put("output", Map.of("status", "NOT_IMPLEMENTED"));
                    break;
                    
                case "UPDATE_ENTRY":
                    result.put("output", Map.of("status", "NOT_IMPLEMENTED"));
                    break;
                    
                case "SYNC_OPENAPI":
                    result.put("output", executeSyncOpenAPIAction(resolvedConfig));
                    break;
                    
                case "HTTP_REQUEST":
                    result.put("output", executeHttpRequestAction(resolvedConfig));
                    break;
                    
                default:
                    throw new IntegrationException("AUTOMATION", "UNKNOWN_ACTION", "Unknown action type: " + actionType);
            }
            
            result.put("success", true);
            
        } catch (Exception e) {
            log.error("Action {} failed: {}", actionType, e.getMessage());
            result.put("success", false);
            result.put("error", e.getMessage());
        }
        
        result.put("endTime", LocalDateTime.now());
        return result;
    }

    // ============ Action Implementations ============

    private Map<String, Object> executeLogAction(Map<String, Object> config, Map<String, Object> context) {
        String message = (String) config.getOrDefault("message", "Automation log");
        String level = (String) config.getOrDefault("level", "INFO");
        
        switch (level.toUpperCase()) {
            case "DEBUG":
                log.debug("[Automation] {}", message);
                break;
            case "WARN":
                log.warn("[Automation] {}", message);
                break;
            case "ERROR":
                log.error("[Automation] {}", message);
                break;
            default:
                log.info("[Automation] {}", message);
        }
        
        return Map.of("message", message, "level", level);
    }

    private Map<String, Object> executeWaitAction(Map<String, Object> config) throws InterruptedException {
        int seconds = ((Number) config.getOrDefault("seconds", 1)).intValue();
        Thread.sleep(seconds * 1000L);
        return Map.of("waited", seconds);
    }

    private Map<String, Object> executeTransformAction(Map<String, Object> config, Map<String, Object> context) {
        @SuppressWarnings("unchecked")
        Map<String, String> mappings = (Map<String, String>) config.getOrDefault("mappings", new HashMap<>());
        
        Map<String, Object> transformed = new HashMap<>();
        for (Map.Entry<String, String> mapping : mappings.entrySet()) {
            Object value = resolveTemplate(mapping.getValue(), context);
            transformed.put(mapping.getKey(), value);
        }
        
        return transformed;
    }

    private Map<String, Object> executeSyncOpenAPIAction(Map<String, Object> config) {
        Long integrationId = ((Number) config.get("integrationId")).longValue();
        return openAPIService.syncSpec(integrationId);
    }

    private Map<String, Object> executeHttpRequestAction(Map<String, Object> config) {
        // Simplified HTTP request action
        String url = (String) config.get("url");
        String method = (String) config.getOrDefault("method", "GET");
        
        return Map.of(
                "url", url,
                "method", method,
                "status", "NOT_IMPLEMENTED"
        );
    }

    // ============ Helper Methods ============

    private AutomationLog createLogEntry(AutomationWorkflow workflow, Map<String, Object> triggerData) {
        AutomationLog logEntry = AutomationLog.builder()
                .workflow(workflow)
                .executionId(UUID.randomUUID().toString())
                .status(AutomationLog.ExecutionStatus.RUNNING)
                .startedAt(LocalDateTime.now())
                .build();
        
        try {
            logEntry.setTriggerData(objectMapper.writeValueAsString(triggerData));
        } catch (Exception e) {
            logEntry.setTriggerData("{}");
        }
        
        return logRepository.save(logEntry);
    }

    private boolean matchesFilter(String filterJson, Map<String, Object> data) {
        if (filterJson == null || filterJson.isEmpty() || filterJson.equals("null") || filterJson.equals("{}")) {
            return true;
        }
        
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> filter = objectMapper.readValue(filterJson, Map.class);
            
            for (Map.Entry<String, Object> entry : filter.entrySet()) {
                Object dataValue = getNestedValue(data, entry.getKey());
                if (!Objects.equals(dataValue, entry.getValue())) {
                    return false;
                }
            }
            
            return true;
        } catch (Exception e) {
            log.warn("Error parsing filter: {}", e.getMessage());
            return true;
        }
    }

    private Object getNestedValue(Map<String, Object> data, String path) {
        String[] parts = path.split("\\.");
        Object current = data;
        
        for (String part : parts) {
            if (current instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> map = (Map<String, Object>) current;
                current = map.get(part);
            } else {
                return null;
            }
        }
        
        return current;
    }

    private Map<String, Object> resolveTemplates(Map<String, Object> config, Map<String, Object> context) {
        Map<String, Object> resolved = new HashMap<>();
        
        for (Map.Entry<String, Object> entry : config.entrySet()) {
            Object value = entry.getValue();
            
            if (value instanceof String) {
                resolved.put(entry.getKey(), resolveTemplate((String) value, context));
            } else if (value instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> nested = (Map<String, Object>) value;
                resolved.put(entry.getKey(), resolveTemplates(nested, context));
            } else {
                resolved.put(entry.getKey(), value);
            }
        }
        
        return resolved;
    }

    private Object resolveTemplate(String template, Map<String, Object> context) {
        if (template == null || !template.contains("{{")) {
            return template;
        }
        
        String result = template;
        
        // Simple template resolution: {{variable.path}}
        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("\\{\\{([^}]+)\\}\\}");
        java.util.regex.Matcher matcher = pattern.matcher(template);
        
        while (matcher.find()) {
            String path = matcher.group(1).trim();
            Object value = getNestedValue(context, path);
            if (value != null) {
                result = result.replace("{{" + matcher.group(1) + "}}", String.valueOf(value));
            }
        }
        
        return result;
    }
}
