package com.brazucacms.controller;

import com.brazucacms.dto.apikey.ApiKeyRequest;
import com.brazucacms.dto.apikey.ApiKeyResponse;
import com.brazucacms.dto.common.ApiResponse;
import com.brazucacms.model.User;
import com.brazucacms.service.ApiKeyService;
import com.brazucacms.service.UserService;
import com.brazucacms.service.WorkspaceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/workspaces/{workspaceId}/api-keys")
@RequiredArgsConstructor
@Tag(name = "API Keys", description = "API key management endpoints")
public class ApiKeyController {

    private final ApiKeyService apiKeyService;
    private final UserService userService;
    private final WorkspaceService workspaceService;

    @GetMapping
    @Operation(summary = "Get all API keys for workspace")
    public ResponseEntity<ApiResponse<List<ApiKeyResponse>>> getApiKeys(
            @PathVariable Long workspaceId,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        validateWorkspaceAdminAccess(workspaceId, userDetails);
        List<ApiKeyResponse> response = apiKeyService.getApiKeysByWorkspace(workspaceId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get API key by ID")
    public ResponseEntity<ApiResponse<ApiKeyResponse>> getApiKeyById(
            @PathVariable Long workspaceId,
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        validateWorkspaceAdminAccess(workspaceId, userDetails);
        ApiKeyResponse response = apiKeyService.getApiKeyById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping
    @Operation(summary = "Create a new API key")
    public ResponseEntity<ApiResponse<ApiKeyResponse>> createApiKey(
            @PathVariable Long workspaceId,
            @Valid @RequestBody ApiKeyRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        validateWorkspaceAdminAccess(workspaceId, userDetails);
        User user = getUserFromDetails(userDetails);
        ApiKeyResponse response = apiKeyService.createApiKey(workspaceId, request, user);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("API key created successfully. Please save the key, it won't be shown again.", response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an API key")
    public ResponseEntity<ApiResponse<ApiKeyResponse>> updateApiKey(
            @PathVariable Long workspaceId,
            @PathVariable Long id,
            @Valid @RequestBody ApiKeyRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        validateWorkspaceAdminAccess(workspaceId, userDetails);
        ApiKeyResponse response = apiKeyService.updateApiKey(id, request);
        return ResponseEntity.ok(ApiResponse.success("API key updated successfully", response));
    }

    @PostMapping("/{id}/revoke")
    @Operation(summary = "Revoke an API key")
    public ResponseEntity<ApiResponse<Void>> revokeApiKey(
            @PathVariable Long workspaceId,
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        validateWorkspaceAdminAccess(workspaceId, userDetails);
        apiKeyService.revokeApiKey(id);
        return ResponseEntity.ok(ApiResponse.success("API key revoked successfully", null));
    }

    @PostMapping("/{id}/regenerate")
    @Operation(summary = "Regenerate an API key")
    public ResponseEntity<ApiResponse<ApiKeyResponse>> regenerateApiKey(
            @PathVariable Long workspaceId,
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        validateWorkspaceAdminAccess(workspaceId, userDetails);
        ApiKeyResponse response = apiKeyService.regenerateApiKey(id);
        return ResponseEntity.ok(ApiResponse.success("API key regenerated successfully. Please save the new key.", response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete an API key")
    public ResponseEntity<ApiResponse<Void>> deleteApiKey(
            @PathVariable Long workspaceId,
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        validateWorkspaceAdminAccess(workspaceId, userDetails);
        apiKeyService.deleteApiKey(id);
        return ResponseEntity.ok(ApiResponse.success("API key deleted successfully", null));
    }

    private void validateWorkspaceAdminAccess(Long workspaceId, UserDetails userDetails) {
        User user = getUserFromDetails(userDetails);
        if (!workspaceService.isWorkspaceAdmin(workspaceId, user.getId())) {
            throw new RuntimeException("Only workspace admins can manage API keys");
        }
    }

    private User getUserFromDetails(UserDetails userDetails) {
        return userService.findByEmail(userDetails.getUsername());
    }
}
