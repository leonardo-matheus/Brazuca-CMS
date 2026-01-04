package com.brazucacms.controller;

import com.brazucacms.dto.analytics.ApiUsageDTO;
import com.brazucacms.dto.analytics.UsageStatsDTO;
import com.brazucacms.dto.common.ApiResponse;
import com.brazucacms.model.User;
import com.brazucacms.service.AnalyticsService;
import com.brazucacms.service.UserService;
import com.brazucacms.service.WorkspaceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/workspaces/{workspaceId}/analytics")
@RequiredArgsConstructor
@Tag(name = "Analytics", description = "Analytics and usage statistics endpoints")
public class AnalyticsController {

    private final AnalyticsService analyticsService;
    private final WorkspaceService workspaceService;
    private final UserService userService;

    @GetMapping("/usage")
    @Operation(summary = "Get usage statistics for workspace")
    public ResponseEntity<ApiResponse<UsageStatsDTO>> getUsageStats(
            @PathVariable Long workspaceId,
            @RequestParam(defaultValue = "month") String period,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        User user = userService.findByEmail(userDetails.getUsername());
        
        if (!workspaceService.isWorkspaceMember(workspaceId, user)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("You don't have access to this workspace"));
        }
        
        UsageStatsDTO stats = analyticsService.getUsageStats(workspaceId, period);
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @GetMapping("/api-usage")
    @Operation(summary = "Get API usage statistics for workspace")
    public ResponseEntity<ApiResponse<ApiUsageDTO>> getApiUsage(
            @PathVariable Long workspaceId,
            @RequestParam(defaultValue = "month") String period,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        User user = userService.findByEmail(userDetails.getUsername());
        
        if (!workspaceService.isWorkspaceMember(workspaceId, user)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("You don't have access to this workspace"));
        }
        
        ApiUsageDTO apiUsage = analyticsService.getApiUsage(workspaceId, period);
        return ResponseEntity.ok(ApiResponse.success(apiUsage));
    }
}
