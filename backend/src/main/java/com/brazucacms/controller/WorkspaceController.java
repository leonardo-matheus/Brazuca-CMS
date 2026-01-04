package com.brazucacms.controller;

import com.brazucacms.dto.common.ApiResponse;
import com.brazucacms.dto.common.PageResponse;
import com.brazucacms.dto.workspace.*;
import com.brazucacms.model.User;
import com.brazucacms.service.UserService;
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
@RequestMapping("/api/workspaces")
@RequiredArgsConstructor
@Tag(name = "Workspaces", description = "Workspace management endpoints")
public class WorkspaceController {

    private final WorkspaceService workspaceService;
    private final UserService userService;

    @PostMapping
    @Operation(summary = "Create a new workspace")
    public ResponseEntity<ApiResponse<WorkspaceDTO>> createWorkspace(
            @Valid @RequestBody CreateWorkspaceRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        User user = userService.findByEmail(userDetails.getUsername());
        WorkspaceDTO workspace = workspaceService.createWorkspace(request, user);
        
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Workspace created successfully", workspace));
    }

    @GetMapping
    @Operation(summary = "List all workspaces for current user")
    public ResponseEntity<ApiResponse<PageResponse<WorkspaceDTO>>> listWorkspaces(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int limit) {
        
        User user = userService.findByEmail(userDetails.getUsername());
        Page<WorkspaceDTO> workspaces = workspaceService.getUserWorkspaces(
                user, 
                PageRequest.of(page, limit, Sort.by(Sort.Direction.DESC, "createdAt"))
        );
        
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(workspaces)));
    }

    @GetMapping("/{workspaceId}")
    @Operation(summary = "Get workspace details")
    public ResponseEntity<ApiResponse<WorkspaceDTO>> getWorkspace(
            @PathVariable Long workspaceId,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        User user = userService.findByEmail(userDetails.getUsername());
        
        // Check if user has access
        if (!workspaceService.isWorkspaceMember(workspaceId, user)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("You don't have access to this workspace"));
        }
        
        WorkspaceDTO workspace = workspaceService.getWorkspace(workspaceId);
        return ResponseEntity.ok(ApiResponse.success(workspace));
    }

    @PutMapping("/{workspaceId}")
    @Operation(summary = "Update workspace")
    public ResponseEntity<ApiResponse<WorkspaceDTO>> updateWorkspace(
            @PathVariable Long workspaceId,
            @Valid @RequestBody UpdateWorkspaceRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        User user = userService.findByEmail(userDetails.getUsername());
        WorkspaceDTO workspace = workspaceService.updateWorkspace(workspaceId, request, user);
        
        return ResponseEntity.ok(ApiResponse.success("Workspace updated successfully", workspace));
    }

    @DeleteMapping("/{workspaceId}")
    @Operation(summary = "Delete workspace")
    public ResponseEntity<Void> deleteWorkspace(
            @PathVariable Long workspaceId,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        User user = userService.findByEmail(userDetails.getUsername());
        workspaceService.deleteWorkspace(workspaceId, user);
        
        return ResponseEntity.noContent().build();
    }

    // Members endpoints
    @GetMapping("/{workspaceId}/members")
    @Operation(summary = "List workspace members")
    public ResponseEntity<ApiResponse<List<MemberDTO>>> listMembers(
            @PathVariable Long workspaceId,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        User user = userService.findByEmail(userDetails.getUsername());
        
        if (!workspaceService.isWorkspaceMember(workspaceId, user)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("You don't have access to this workspace"));
        }
        
        List<MemberDTO> members = workspaceService.getWorkspaceMembers(workspaceId);
        return ResponseEntity.ok(ApiResponse.success(members));
    }

    @PostMapping("/{workspaceId}/members/invite")
    @Operation(summary = "Invite a member to workspace")
    public ResponseEntity<ApiResponse<InviteDTO>> inviteMember(
            @PathVariable Long workspaceId,
            @Valid @RequestBody InviteMemberRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        User user = userService.findByEmail(userDetails.getUsername());
        InviteDTO invite = workspaceService.inviteMember(workspaceId, request, user);
        
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Invitation sent successfully", invite));
    }

    @PostMapping("/invites/{inviteToken}/accept")
    @Operation(summary = "Accept workspace invitation")
    public ResponseEntity<ApiResponse<MemberDTO>> acceptInvite(
            @PathVariable String inviteToken,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        User user = userService.findByEmail(userDetails.getUsername());
        MemberDTO member = workspaceService.acceptInvite(inviteToken, user);
        
        return ResponseEntity.ok(ApiResponse.success("Invitation accepted", member));
    }

    @PutMapping("/{workspaceId}/members/{memberId}")
    @Operation(summary = "Update member role")
    public ResponseEntity<ApiResponse<MemberDTO>> updateMemberRole(
            @PathVariable Long workspaceId,
            @PathVariable Long memberId,
            @Valid @RequestBody UpdateMemberRoleRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        User user = userService.findByEmail(userDetails.getUsername());
        MemberDTO member = workspaceService.updateMemberRole(workspaceId, memberId, request, user);
        
        return ResponseEntity.ok(ApiResponse.success("Member role updated", member));
    }

    @DeleteMapping("/{workspaceId}/members/{memberId}")
    @Operation(summary = "Remove member from workspace")
    public ResponseEntity<Void> removeMember(
            @PathVariable Long workspaceId,
            @PathVariable Long memberId,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        User user = userService.findByEmail(userDetails.getUsername());
        workspaceService.removeMember(workspaceId, memberId, user);
        
        return ResponseEntity.noContent().build();
    }
}
