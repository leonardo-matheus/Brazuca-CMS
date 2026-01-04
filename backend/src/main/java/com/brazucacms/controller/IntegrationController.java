package com.brazucacms.controller;

import com.brazucacms.dto.common.ApiResponse;
import com.brazucacms.dto.integration.*;
import com.brazucacms.model.AutomationWorkflow;
import com.brazucacms.model.Integration;
import com.brazucacms.repository.*;
import com.brazucacms.service.integration.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Controller for all platform integrations and automations.
 * Handles connection, management, and webhook endpoints.
 */
@RestController
@RequestMapping("/api/integrations")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Integrations", description = "Platform integrations and automation APIs")
public class IntegrationController {

    private final IntegrationRepository integrationRepository;
    private final AutomationWorkflowRepository workflowRepository;
    private final AutomationLogRepository logRepository;
    private final SyncedProductRepository productRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    // Integration services
    private final GitHubIntegrationService gitHubService;
    private final OpenAPIIntegrationService openAPIService;
    private final AutomationEngineService automationEngine;

    // ============ Platform Discovery ============

    @GetMapping("/platforms")
    @Operation(summary = "List available platforms", description = "Get all available integration platforms")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAvailablePlatforms() {
        List<Map<String, Object>> platforms = new ArrayList<>();
        
        for (Integration.Platform platform : Integration.Platform.values()) {
            Map<String, Object> p = new HashMap<>();
            p.put("id", platform.name());
            p.put("name", platform.getDisplayName());
            p.put("category", platform.getCategory().name());
            p.put("categoryName", platform.getCategory().getDisplayName());
            p.put("description", platform.getDescription());
            platforms.add(p);
        }
        
        return ResponseEntity.ok(ApiResponse.success(platforms));
    }

    // ============ Integration Management ============

    @GetMapping
    @Operation(summary = "List integrations", description = "Get all connected integrations for the company")
    public ResponseEntity<ApiResponse<List<IntegrationResponse>>> getIntegrations(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) String category
    ) {
        var user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        Long companyId = user.getCompany().getId();
        
        List<Integration> integrations;
        if (category != null) {
            List<Integration.Platform> platforms = Arrays.stream(Integration.Platform.values())
                    .filter(p -> p.getCategory().name().equals(category))
                    .collect(Collectors.toList());
            integrations = integrationRepository.findByCompanyIdAndPlatformIn(companyId, platforms);
        } else {
            integrations = integrationRepository.findByCompanyId(companyId);
        }
        
        List<IntegrationResponse> responses = integrations.stream()
                .map(IntegrationResponse::fromEntity)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get integration", description = "Get a specific integration by ID")
    public ResponseEntity<ApiResponse<IntegrationResponse>> getIntegration(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id
    ) {
        var user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        Long companyId = user.getCompany().getId();
        
        Integration integration = integrationRepository.findByIdAndCompanyId(id, companyId)
                .orElseThrow(() -> new RuntimeException("Integration not found"));
        
        return ResponseEntity.ok(ApiResponse.success(IntegrationResponse.fromEntity(integration)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Disconnect integration", description = "Disconnect and remove an integration")
    public ResponseEntity<ApiResponse<Void>> disconnectIntegration(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id
    ) {
        var user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        Long companyId = user.getCompany().getId();
        
        Integration integration = integrationRepository.findByIdAndCompanyId(id, companyId)
                .orElseThrow(() -> new RuntimeException("Integration not found"));
        
        integration.setStatus(Integration.IntegrationStatus.DISABLED);
        integration.setAccessToken(null);
        integration.setRefreshToken(null);
        integrationRepository.save(integration);
        
        return ResponseEntity.ok(ApiResponse.success("Integration disconnected", null));
    }

    // ============ OAuth URLs ============

    @GetMapping("/oauth/github")
    @Operation(summary = "Get GitHub OAuth URL")
    public ResponseEntity<ApiResponse<Map<String, String>>> getGitHubOAuthUrl(
            @RequestParam String redirectUri,
            @RequestParam(required = false, defaultValue = "") String state
    ) {
        String url = gitHubService.getOAuthUrl(redirectUri, state);
        return ResponseEntity.ok(ApiResponse.success(Map.of("url", url)));
    }

    // ============ Connect Integrations ============

    @PostMapping("/connect")
    @Operation(summary = "Connect integration", description = "Connect a new platform integration")
    public ResponseEntity<ApiResponse<IntegrationResponse>> connectIntegration(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody IntegrationConnectRequest request
    ) {
        var user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        Long companyId = user.getCompany().getId();
        
        Integration integration;
        Integration.Platform platform = Integration.Platform.valueOf(request.getPlatform());
        
        switch (platform) {
            case GITHUB:
                integration = gitHubService.connectWithOAuth(companyId, user.getId(), request);
                break;
            case OPENAPI:
                integration = openAPIService.connectWithUrl(companyId, user.getId(), request);
                break;
            default:
                throw new RuntimeException("Platform not yet implemented: " + platform);
        }
        
        return ResponseEntity.ok(ApiResponse.success(
                "Integration connected successfully",
                IntegrationResponse.fromEntity(integration)
        ));
    }

    // ============ Platform-Specific Actions ============

    @PostMapping("/{id}/sync")
    @Operation(summary = "Sync integration", description = "Trigger a sync for the integration")
    public ResponseEntity<ApiResponse<Map<String, Object>>> syncIntegration(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id
    ) {
        var user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        Long companyId = user.getCompany().getId();
        
        Integration integration = integrationRepository.findByIdAndCompanyId(id, companyId)
                .orElseThrow(() -> new RuntimeException("Integration not found"));
        
        Map<String, Object> result;
        
        switch (integration.getPlatform()) {
            case OPENAPI:
                result = openAPIService.syncSpec(id);
                break;
            case GITHUB:
                result = Map.of("message", "Use specific sync endpoint with repo details");
                break;
            default:
                result = Map.of("message", "Sync not supported for this platform");
        }
        
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/github/{integrationId}/repos")
    @Operation(summary = "List GitHub repos")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> listGitHubRepos(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long integrationId
    ) {
        var user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        Long companyId = user.getCompany().getId();
        
        Integration integration = integrationRepository.findByIdAndCompanyId(integrationId, companyId)
                .orElseThrow(() -> new RuntimeException("Integration not found"));
        
        List<Map<String, Object>> repos = gitHubService.listRepositories(integration.getAccessToken());
        return ResponseEntity.ok(ApiResponse.success(repos));
    }

    // ============ Automation Workflows ============

    @GetMapping("/workflows")
    @Operation(summary = "List workflows", description = "Get all automation workflows")
    public ResponseEntity<ApiResponse<List<WorkflowResponse>>> getWorkflows(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) String status
    ) {
        var user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        Long companyId = user.getCompany().getId();
        
        List<AutomationWorkflow> workflows;
        if (status != null) {
            workflows = workflowRepository.findByCompanyIdAndStatus(companyId, AutomationWorkflow.WorkflowStatus.valueOf(status));
        } else {
            workflows = workflowRepository.findByCompanyId(companyId);
        }
        
        List<WorkflowResponse> responses = workflows.stream()
                .map(w -> WorkflowResponse.fromEntity(w, List.of()))
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @PostMapping("/workflows")
    @Operation(summary = "Create workflow", description = "Create a new automation workflow")
    public ResponseEntity<ApiResponse<WorkflowResponse>> createWorkflow(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody WorkflowCreateRequest request
    ) {
        var user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        
        AutomationWorkflow workflow = new AutomationWorkflow();
        workflow.setCompany(user.getCompany());
        workflow.setCreatedBy(user);
        workflow.setName(request.getName());
        workflow.setDescription(request.getDescription());
        workflow.setStatus(AutomationWorkflow.WorkflowStatus.DRAFT);
        
        // Set trigger
        workflow.setTriggerType(AutomationWorkflow.TriggerType.valueOf(request.getTrigger().getType()));
        workflow.setTriggerEvent(request.getTrigger().getEvent());
        if (request.getTrigger().getIntegrationId() != null) {
            Integration triggerIntegration = integrationRepository.findById(request.getTrigger().getIntegrationId())
                    .orElseThrow(() -> new RuntimeException("Trigger integration not found"));
            workflow.setTriggerIntegration(triggerIntegration);
        }
        
        try {
            workflow.setTriggerFilter(objectMapper.writeValueAsString(request.getTrigger().getFilter()));
            workflow.setActions(objectMapper.writeValueAsString(request.getActions()));
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize workflow config");
        }
        
        workflow = workflowRepository.save(workflow);
        
        return ResponseEntity.ok(ApiResponse.success(
                "Workflow created successfully",
                WorkflowResponse.fromEntity(workflow, List.of())
        ));
    }

    @PostMapping("/workflows/{id}/activate")
    @Operation(summary = "Activate workflow")
    public ResponseEntity<ApiResponse<WorkflowResponse>> activateWorkflow(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id
    ) {
        var user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        Long companyId = user.getCompany().getId();
        
        AutomationWorkflow workflow = workflowRepository.findByIdAndCompanyId(id, companyId)
                .orElseThrow(() -> new RuntimeException("Workflow not found"));
        
        workflow.setStatus(AutomationWorkflow.WorkflowStatus.ACTIVE);
        workflow = workflowRepository.save(workflow);
        
        return ResponseEntity.ok(ApiResponse.success(WorkflowResponse.fromEntity(workflow, List.of())));
    }

    @PostMapping("/workflows/{id}/pause")
    @Operation(summary = "Pause workflow")
    public ResponseEntity<ApiResponse<WorkflowResponse>> pauseWorkflow(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id
    ) {
        var user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        Long companyId = user.getCompany().getId();
        
        AutomationWorkflow workflow = workflowRepository.findByIdAndCompanyId(id, companyId)
                .orElseThrow(() -> new RuntimeException("Workflow not found"));
        
        workflow.setStatus(AutomationWorkflow.WorkflowStatus.PAUSED);
        workflow = workflowRepository.save(workflow);
        
        return ResponseEntity.ok(ApiResponse.success(WorkflowResponse.fromEntity(workflow, List.of())));
    }

    @PostMapping("/workflows/{id}/execute")
    @Operation(summary = "Execute workflow manually")
    public ResponseEntity<ApiResponse<Map<String, Object>>> executeWorkflow(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> triggerData
    ) {
        var user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        Long companyId = user.getCompany().getId();
        
        AutomationWorkflow workflow = workflowRepository.findByIdAndCompanyId(id, companyId)
                .orElseThrow(() -> new RuntimeException("Workflow not found"));
        
        Map<String, Object> result = automationEngine.executeWorkflow(id, triggerData != null ? triggerData : new HashMap<>());
        
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @DeleteMapping("/workflows/{id}")
    @Operation(summary = "Delete workflow")
    public ResponseEntity<ApiResponse<Void>> deleteWorkflow(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id
    ) {
        var user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        Long companyId = user.getCompany().getId();
        
        AutomationWorkflow workflow = workflowRepository.findByIdAndCompanyId(id, companyId)
                .orElseThrow(() -> new RuntimeException("Workflow not found"));
        
        logRepository.deleteByWorkflowId(id);
        workflowRepository.delete(workflow);
        
        return ResponseEntity.ok(ApiResponse.success("Workflow deleted", null));
    }

    // ============ Webhooks ============

    @PostMapping("/webhooks/github")
    @Operation(summary = "GitHub webhook endpoint")
    public ResponseEntity<Map<String, Object>> handleGitHubWebhook(
            @RequestHeader("X-GitHub-Event") String event,
            @RequestHeader(value = "X-Hub-Signature-256", required = false) String signature,
            @RequestBody String payload
    ) {
        log.info("Received GitHub webhook: {}", event);
        Map<String, Object> result = gitHubService.processWebhook(event, signature, payload);
        return ResponseEntity.ok(result);
    }

    // ============ Stats ============

    @GetMapping("/stats")
    @Operation(summary = "Get integration stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getIntegrationStats(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        var user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        Long companyId = user.getCompany().getId();
        
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalIntegrations", integrationRepository.findByCompanyId(companyId).size());
        stats.put("activeIntegrations", integrationRepository.findByCompanyIdAndStatus(companyId, Integration.IntegrationStatus.ACTIVE).size());
        stats.put("totalWorkflows", workflowRepository.findByCompanyId(companyId).size());
        stats.put("activeWorkflows", workflowRepository.countByCompanyIdAndStatus(companyId, AutomationWorkflow.WorkflowStatus.ACTIVE));
        stats.put("totalExecutions30d", logRepository.countByCompanyIdSince(companyId, thirtyDaysAgo));
        stats.put("successfulExecutions30d", logRepository.countSuccessfulByCompanyIdSince(companyId, thirtyDaysAgo));
        stats.put("syncedProducts", productRepository.countByCompanyId(companyId));
        
        return ResponseEntity.ok(ApiResponse.success(stats));
    }
}
