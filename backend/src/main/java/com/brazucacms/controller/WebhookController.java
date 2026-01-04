package com.brazucacms.controller;

import com.brazucacms.dto.common.ApiResponse;
import com.brazucacms.dto.common.PageResponse;
import com.brazucacms.dto.webhook.*;
import com.brazucacms.model.User;
import com.brazucacms.model.Workspace;
import com.brazucacms.service.UserService;
import com.brazucacms.service.WebhookService;
import com.brazucacms.service.WorkspaceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/workspaces/{workspaceId}/webhooks")
@RequiredArgsConstructor
@Tag(name = "Webhooks", description = "Webhook management endpoints")
public class WebhookController {

    private final WebhookService webhookService;
    private final WorkspaceService workspaceService;
    private final UserService userService;

    @PostMapping
    @Operation(summary = "Create a new webhook")
    public ResponseEntity<ApiResponse<WebhookDTO>> createWebhook(
            @PathVariable Long workspaceId,
            @Valid @RequestBody CreateWebhookRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        User user = userService.findByEmail(userDetails.getUsername());
        
        if (!workspaceService.isWorkspaceAdmin(workspaceService.getWorkspaceEntity(workspaceId), user)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("Only admins can create webhooks"));
        }
        
        Workspace workspace = workspaceService.getWorkspaceEntity(workspaceId);
        WebhookDTO webhook = webhookService.createWebhook(workspaceId, request, workspace);
        
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Webhook created successfully", webhook));
    }

    @GetMapping
    @Operation(summary = "List all webhooks for workspace")
    public ResponseEntity<ApiResponse<List<WebhookDTO>>> listWebhooks(
            @PathVariable Long workspaceId,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        User user = userService.findByEmail(userDetails.getUsername());
        
        if (!workspaceService.isWorkspaceMember(workspaceId, user)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("You don't have access to this workspace"));
        }
        
        Workspace workspace = workspaceService.getWorkspaceEntity(workspaceId);
        List<WebhookDTO> webhooks = webhookService.getWorkspaceWebhooks(workspaceId, workspace);
        
        return ResponseEntity.ok(ApiResponse.success(webhooks));
    }

    @GetMapping("/{webhookId}")
    @Operation(summary = "Get webhook details")
    public ResponseEntity<ApiResponse<WebhookDTO>> getWebhook(
            @PathVariable Long workspaceId,
            @PathVariable Long webhookId,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        User user = userService.findByEmail(userDetails.getUsername());
        
        if (!workspaceService.isWorkspaceMember(workspaceId, user)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("You don't have access to this workspace"));
        }
        
        WebhookDTO webhook = webhookService.getWebhook(webhookId);
        return ResponseEntity.ok(ApiResponse.success(webhook));
    }

    @PutMapping("/{webhookId}")
    @Operation(summary = "Update webhook")
    public ResponseEntity<ApiResponse<WebhookDTO>> updateWebhook(
            @PathVariable Long workspaceId,
            @PathVariable Long webhookId,
            @Valid @RequestBody UpdateWebhookRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        User user = userService.findByEmail(userDetails.getUsername());
        
        if (!workspaceService.isWorkspaceAdmin(workspaceService.getWorkspaceEntity(workspaceId), user)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("Only admins can update webhooks"));
        }
        
        WebhookDTO webhook = webhookService.updateWebhook(webhookId, request);
        return ResponseEntity.ok(ApiResponse.success("Webhook updated successfully", webhook));
    }

    @DeleteMapping("/{webhookId}")
    @Operation(summary = "Delete webhook")
    public ResponseEntity<Void> deleteWebhook(
            @PathVariable Long workspaceId,
            @PathVariable Long webhookId,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        User user = userService.findByEmail(userDetails.getUsername());
        
        if (!workspaceService.isWorkspaceAdmin(workspaceService.getWorkspaceEntity(workspaceId), user)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        webhookService.deleteWebhook(webhookId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{webhookId}/test")
    @Operation(summary = "Test webhook")
    public ResponseEntity<ApiResponse<WebhookTestResponse>> testWebhook(
            @PathVariable Long workspaceId,
            @PathVariable Long webhookId,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        User user = userService.findByEmail(userDetails.getUsername());
        
        if (!workspaceService.isWorkspaceAdmin(workspaceService.getWorkspaceEntity(workspaceId), user)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("Only admins can test webhooks"));
        }
        
        WebhookTestResponse result = webhookService.testWebhook(webhookId);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/{webhookId}/logs")
    @Operation(summary = "Get webhook logs")
    public ResponseEntity<ApiResponse<PageResponse<WebhookLogDTO>>> getWebhookLogs(
            @PathVariable Long workspaceId,
            @PathVariable Long webhookId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int limit,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        User user = userService.findByEmail(userDetails.getUsername());
        
        if (!workspaceService.isWorkspaceMember(workspaceId, user)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("You don't have access to this workspace"));
        }
        
        Page<WebhookLogDTO> logs = webhookService.getWebhookLogs(
                webhookId,
                PageRequest.of(page, limit, Sort.by(Sort.Direction.DESC, "timestamp"))
        );
        
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(logs)));
    }
}
