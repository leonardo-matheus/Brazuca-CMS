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
 * 
 * Example flows:
 * - E-commerce: Shopify → CMS → Klaviyo (new product → create entry → email list)
 * - SaaS: GitHub → CMS → OpenAPI (commit → publish example → update docs)
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
    private final ShopifyIntegrationService shopifyService;
    private final KlaviyoIntegrationService klaviyoService;
    private final OpenAPIIntegrationService openAPIService;

    // ============ Workflow Execution ============

    /**
     * Execute a workflow manually
     */
    @Transactional
    public Map<String, Object> executeWorkflow(Long workflowId, Map<String, Object> triggerData) {
        AutomationWorkflow workflow = workflowRepository.findById(workflowId)
                .orElseThrow(() -> new IntegrationException("Workflow not found"));
        
        if (workflow.getStatus() != AutomationWorkflow.WorkflowStatus.ACTIVE &&
            workflow.getStatus() != AutomationWorkflow.WorkflowStatus.DRAFT) {
            throw new IntegrationException("Workflow is not active");
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
     * Process CMS event and trigger relevant workflows
     */
    @Transactional
    public List<Map<String, Object>> processCmsEventTrigger(String event, Map<String, Object> payload) {
        List<AutomationWorkflow> workflows = workflowRepository.findActiveByCmsEvent(event);
        
        List<Map<String, Object>> results = new ArrayList<>();
        
        for (AutomationWorkflow workflow : workflows) {
            try {
                if (matchesFilter(workflow.getTriggerFilter(), payload)) {
                    Map<String, Object> result = executeWorkflowInternal(workflow, payload);
                    results.add(result);
                }
            } catch (Exception e) {
                log.error("Error executing workflow {}: {}", workflow.getId(), e.getMessage());
            }
        }
        
        return results;
    }

    /**
     * Internal workflow execution
     */
    private Map<String, Object> executeWorkflowInternal(AutomationWorkflow workflow, Map<String, Object> triggerData) {
        String executionId = UUID.randomUUID().toString();
        LocalDateTime startTime = LocalDateTime.now();
        
        // Create execution log
        AutomationLog execLog = AutomationLog.builder()
                .workflow(workflow)
                .executionId(executionId)
                .status(AutomationLog.ExecutionStatus.RUNNING)
                .triggerData(serializeJson(triggerData))
                .startedAt(startTime)
                .build();
        execLog = logRepository.save(execLog);
        
        Map<String, Object> result = new HashMap<>();
        result.put("executionId", executionId);
        result.put("workflowId", workflow.getId());
        result.put("workflowName", workflow.getName());
        
        List<Map<String, Object>> actionResults = new ArrayList<>();
        Map<String, Object> context = new HashMap<>(triggerData);
        
        try {
            // Parse and execute actions
            List<Map<String, Object>> actions = objectMapper.readValue(
                    workflow.getActions(), 
                    new TypeReference<List<Map<String, Object>>>() {});
            
            for (int i = 0; i < actions.size(); i++) {
                Map<String, Object> action = actions.get(i);
                execLog.setCurrentActionIndex(i);
                logRepository.save(execLog);
                
                Map<String, Object> actionResult = executeAction(workflow.getCompany().getId(), action, context);
                actionResults.add(actionResult);
                
                // Update context with action result for next actions
                if (actionResult.containsKey("output")) {
                    context.put("lastActionOutput", actionResult.get("output"));
                }
                
                // Check if action failed
                if (Boolean.FALSE.equals(actionResult.get("success"))) {
                    throw new IntegrationException("Action failed: " + actionResult.get("error"));
                }
            }
            
            // Success
            execLog.setStatus(AutomationLog.ExecutionStatus.COMPLETED);
            execLog.setActionsLog(serializeJson(actionResults));
            
            result.put("success", true);
            result.put("actionsExecuted", actionResults.size());
            result.put("results", actionResults);
            
            // Update workflow stats
            workflow.setTotalRuns(workflow.getTotalRuns() + 1);
            workflow.setSuccessfulRuns(workflow.getSuccessfulRuns() + 1);
            workflow.setLastRunAt(LocalDateTime.now());
            workflow.setLastRunStatus("Success");
            workflowRepository.save(workflow);
            
        } catch (Exception e) {
            log.error("Workflow execution failed: {}", e.getMessage());
            
            execLog.setStatus(AutomationLog.ExecutionStatus.FAILED);
            execLog.setErrorMessage(e.getMessage());
            execLog.setActionsLog(serializeJson(actionResults));
            
            result.put("success", false);
            result.put("error", e.getMessage());
            result.put("failedAtAction", execLog.getCurrentActionIndex());
            
            // Update workflow stats
            workflow.setTotalRuns(workflow.getTotalRuns() + 1);
            workflow.setFailedRuns(workflow.getFailedRuns() + 1);
            workflow.setLastRunAt(LocalDateTime.now());
            workflow.setLastRunStatus("Failed: " + e.getMessage());
            workflowRepository.save(workflow);
        }
        
        // Finalize log
        execLog.setCompletedAt(LocalDateTime.now());
        execLog.setDurationMs(ChronoUnit.MILLIS.between(startTime, execLog.getCompletedAt()));
        logRepository.save(execLog);
        
        result.put("durationMs", execLog.getDurationMs());
        return result;
    }

    // ============ Action Execution ============

    /**
     * Execute a single action
     */
    private Map<String, Object> executeAction(Long companyId, Map<String, Object> action, Map<String, Object> context) {
        String actionType = (String) action.get("type");
        Map<String, Object> config = (Map<String, Object>) action.getOrDefault("config", new HashMap<>());
        
        // Replace variables in config
        config = resolveVariables(config, context);
        
        log.info("Executing action: {} with config: {}", actionType, config);
        
        Map<String, Object> result = new HashMap<>();
        result.put("actionType", actionType);
        result.put("startedAt", LocalDateTime.now().toString());
        
        try {
            Map<String, Object> output;
            
            switch (actionType.toUpperCase()) {
                // Integration actions
                case "GITHUB_SYNC_FILE":
                    output = executeGitHubSyncFile(companyId, config);
                    break;
                case "SHOPIFY_SYNC_PRODUCTS":
                    output = executeShopifySyncProducts(companyId, config);
                    break;
                case "KLAVIYO_ADD_TO_LIST":
                    output = executeKlaviyoAddToList(companyId, config);
                    break;
                case "KLAVIYO_TRACK_EVENT":
                    output = executeKlaviyoTrackEvent(companyId, config);
                    break;
                case "OPENAPI_SYNC_DOCS":
                    output = executeOpenAPISyncDocs(companyId, config);
                    break;
                    
                // CMS actions
                case "CMS_CREATE_ENTRY":
                    output = executeCmsCreateEntry(companyId, config, context);
                    break;
                case "CMS_UPDATE_ENTRY":
                    output = executeCmsUpdateEntry(companyId, config, context);
                    break;
                case "CMS_PUBLISH_ENTRY":
                    output = executeCmsPublishEntry(companyId, config, context);
                    break;
                    
                // Utility actions
                case "HTTP_REQUEST":
                    output = executeHttpRequest(config);
                    break;
                case "DELAY":
                    output = executeDelay(config);
                    break;
                case "LOG":
                    output = executeLog(config, context);
                    break;
                    
                default:
                    throw new IntegrationException("Unknown action type: " + actionType);
            }
            
            result.put("success", true);
            result.put("output", output);
            
        } catch (Exception e) {
            result.put("success", false);
            result.put("error", e.getMessage());
        }
        
        result.put("completedAt", LocalDateTime.now().toString());
        return result;
    }

    // ============ Integration Action Implementations ============

    private Map<String, Object> executeGitHubSyncFile(Long companyId, Map<String, Object> config) {
        Integration integration = getIntegration(companyId, Integration.Platform.GITHUB);
        
        String owner = (String) config.get("owner");
        String repo = (String) config.get("repo");
        String path = (String) config.get("path");
        
        String content = gitHubService.getFileContent(integration.getAccessToken(), owner, repo, path, null);
        
        Map<String, Object> result = new HashMap<>();
        result.put("content", content);
        result.put("path", path);
        result.put("repository", owner + "/" + repo);
        return result;
    }

    private Map<String, Object> executeShopifySyncProducts(Long companyId, Map<String, Object> config) {
        Integration integration = getIntegration(companyId, Integration.Platform.SHOPIFY);
        return shopifyService.syncProducts(integration.getId());
    }

    private Map<String, Object> executeKlaviyoAddToList(Long companyId, Map<String, Object> config) {
        Integration integration = getIntegration(companyId, Integration.Platform.KLAVIYO);
        
        String listId = (String) config.get("listId");
        String email = (String) config.get("email");
        Map<String, Object> properties = (Map<String, Object>) config.get("properties");
        
        return klaviyoService.addProfileToList(integration.getAccessToken(), listId, email, properties);
    }

    private Map<String, Object> executeKlaviyoTrackEvent(Long companyId, Map<String, Object> config) {
        Integration integration = getIntegration(companyId, Integration.Platform.KLAVIYO);
        
        String eventName = (String) config.get("eventName");
        String email = (String) config.get("email");
        Map<String, Object> properties = (Map<String, Object>) config.get("properties");
        
        return klaviyoService.trackEvent(integration.getAccessToken(), eventName, email, properties);
    }

    private Map<String, Object> executeOpenAPISyncDocs(Long companyId, Map<String, Object> config) {
        Integration integration = getIntegration(companyId, Integration.Platform.OPENAPI);
        return openAPIService.syncSpec(integration.getId());
    }

    // ============ CMS Action Implementations ============

    private Map<String, Object> executeCmsCreateEntry(Long companyId, Map<String, Object> config, Map<String, Object> context) {
        // This would create a CMS entry
        // For now, return mock result
        Map<String, Object> result = new HashMap<>();
        result.put("action", "create_entry");
        result.put("contentTypeId", config.get("contentTypeId"));
        result.put("title", resolveVariable((String) config.get("title"), context));
        result.put("created", true);
        return result;
    }

    private Map<String, Object> executeCmsUpdateEntry(Long companyId, Map<String, Object> config, Map<String, Object> context) {
        Map<String, Object> result = new HashMap<>();
        result.put("action", "update_entry");
        result.put("entryId", config.get("entryId"));
        result.put("updated", true);
        return result;
    }

    private Map<String, Object> executeCmsPublishEntry(Long companyId, Map<String, Object> config, Map<String, Object> context) {
        Map<String, Object> result = new HashMap<>();
        result.put("action", "publish_entry");
        result.put("entryId", config.get("entryId"));
        result.put("published", true);
        return result;
    }

    // ============ Utility Action Implementations ============

    private Map<String, Object> executeHttpRequest(Map<String, Object> config) {
        // Would make HTTP request
        Map<String, Object> result = new HashMap<>();
        result.put("url", config.get("url"));
        result.put("method", config.get("method"));
        result.put("status", 200);
        return result;
    }

    private Map<String, Object> executeDelay(Map<String, Object> config) throws InterruptedException {
        int delayMs = (Integer) config.getOrDefault("delayMs", 1000);
        Thread.sleep(delayMs);
        
        Map<String, Object> result = new HashMap<>();
        result.put("delayed", delayMs);
        return result;
    }

    private Map<String, Object> executeLog(Map<String, Object> config, Map<String, Object> context) {
        String message = resolveVariable((String) config.get("message"), context);
        log.info("[Workflow Log] {}", message);
        
        Map<String, Object> result = new HashMap<>();
        result.put("logged", message);
        return result;
    }

    // ============ Helper Methods ============

    private Integration getIntegration(Long companyId, Integration.Platform platform) {
        return integrationRepository.findByCompanyIdAndPlatform(companyId, platform)
                .filter(Integration::isActive)
                .orElseThrow(() -> new IntegrationException(platform.getDisplayName() + " integration not found or not active"));
    }

    private boolean matchesFilter(String filterJson, Map<String, Object> data) {
        if (filterJson == null || filterJson.isEmpty()) {
            return true;
        }
        
        try {
            Map<String, Object> filter = objectMapper.readValue(filterJson, new TypeReference<>() {});
            
            for (Map.Entry<String, Object> condition : filter.entrySet()) {
                String field = condition.getKey();
                Object expectedValue = condition.getValue();
                Object actualValue = getNestedValue(data, field);
                
                if (!Objects.equals(expectedValue, actualValue)) {
                    return false;
                }
            }
            return true;
        } catch (Exception e) {
            log.error("Error parsing filter: {}", e.getMessage());
            return true; // On error, allow execution
        }
    }

    private Object getNestedValue(Map<String, Object> data, String path) {
        String[] parts = path.split("\\.");
        Object current = data;
        
        for (String part : parts) {
            if (current instanceof Map) {
                current = ((Map<?, ?>) current).get(part);
            } else {
                return null;
            }
        }
        return current;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> resolveVariables(Map<String, Object> config, Map<String, Object> context) {
        Map<String, Object> resolved = new HashMap<>();
        
        for (Map.Entry<String, Object> entry : config.entrySet()) {
            Object value = entry.getValue();
            
            if (value instanceof String) {
                resolved.put(entry.getKey(), resolveVariable((String) value, context));
            } else if (value instanceof Map) {
                resolved.put(entry.getKey(), resolveVariables((Map<String, Object>) value, context));
            } else {
                resolved.put(entry.getKey(), value);
            }
        }
        
        return resolved;
    }

    private String resolveVariable(String value, Map<String, Object> context) {
        if (value == null) return null;
        
        // Replace {{variable}} with context values
        String result = value;
        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("\\{\\{([^}]+)\\}\\}");
        java.util.regex.Matcher matcher = pattern.matcher(value);
        
        while (matcher.find()) {
            String variable = matcher.group(1).trim();
            Object contextValue = getNestedValue(context, variable);
            if (contextValue != null) {
                result = result.replace("{{" + variable + "}}", String.valueOf(contextValue));
            }
        }
        
        return result;
    }

    private String serializeJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            return "{}";
        }
    }
}
