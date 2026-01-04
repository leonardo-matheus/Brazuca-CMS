package com.brazucacms.controller;

import com.brazucacms.dto.common.ApiResponse;
import com.brazucacms.dto.common.PageResponse;
import com.brazucacms.dto.contenttype.ContentTypeRequest;
import com.brazucacms.dto.contenttype.ContentTypeResponse;
import com.brazucacms.model.User;
import com.brazucacms.service.ContentTypeService;
import com.brazucacms.service.UserService;
import com.brazucacms.service.WorkspaceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/workspaces/{workspaceId}/content-types")
@RequiredArgsConstructor
@Tag(name = "Content Types", description = "Content type management endpoints")
public class ContentTypeController {

    private final ContentTypeService contentTypeService;
    private final UserService userService;
    private final WorkspaceService workspaceService;

    @GetMapping
    @Operation(summary = "Get all content types with pagination")
    public ResponseEntity<ApiResponse<PageResponse<ContentTypeResponse>>> getAllContentTypes(
            @PathVariable Long workspaceId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        validateWorkspaceAccess(workspaceId, userDetails);
        
        Sort sort = sortDir.equalsIgnoreCase("desc") ? 
                Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        PageResponse<ContentTypeResponse> response = contentTypeService.getContentTypesByWorkspace(workspaceId, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/list")
    @Operation(summary = "Get all content types as a list")
    public ResponseEntity<ApiResponse<List<ContentTypeResponse>>> getAllContentTypesList(
            @PathVariable Long workspaceId,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        validateWorkspaceAccess(workspaceId, userDetails);
        List<ContentTypeResponse> response = contentTypeService.getContentTypesListByWorkspace(workspaceId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get content type by ID")
    public ResponseEntity<ApiResponse<ContentTypeResponse>> getContentTypeById(
            @PathVariable Long workspaceId,
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        validateWorkspaceAccess(workspaceId, userDetails);
        ContentTypeResponse response = contentTypeService.getContentTypeById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/slug/{slug}")
    @Operation(summary = "Get content type by slug")
    public ResponseEntity<ApiResponse<ContentTypeResponse>> getContentTypeBySlug(
            @PathVariable Long workspaceId,
            @PathVariable String slug,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        validateWorkspaceAccess(workspaceId, userDetails);
        ContentTypeResponse response = contentTypeService.getContentTypeByWorkspaceAndSlug(workspaceId, slug);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping
    @Operation(summary = "Create a new content type")
    public ResponseEntity<ApiResponse<ContentTypeResponse>> createContentType(
            @PathVariable Long workspaceId,
            @Valid @RequestBody ContentTypeRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        validateWorkspaceAccess(workspaceId, userDetails);
        User user = getUserFromDetails(userDetails);
        ContentTypeResponse response = contentTypeService.createContentType(workspaceId, request, user);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Content type created successfully", response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a content type")
    public ResponseEntity<ApiResponse<ContentTypeResponse>> updateContentType(
            @PathVariable Long workspaceId,
            @PathVariable Long id,
            @Valid @RequestBody ContentTypeRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        validateWorkspaceAccess(workspaceId, userDetails);
        ContentTypeResponse response = contentTypeService.updateContentType(id, request);
        return ResponseEntity.ok(ApiResponse.success("Content type updated successfully", response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a content type (soft delete)")
    public ResponseEntity<ApiResponse<Void>> deleteContentType(
            @PathVariable Long workspaceId,
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        validateWorkspaceAccess(workspaceId, userDetails);
        contentTypeService.deleteContentType(id);
        return ResponseEntity.ok(ApiResponse.success("Content type deleted successfully", null));
    }

    @GetMapping("/search")
    @Operation(summary = "Search content types")
    public ResponseEntity<ApiResponse<PageResponse<ContentTypeResponse>>> searchContentTypes(
            @PathVariable Long workspaceId,
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        validateWorkspaceAccess(workspaceId, userDetails);
        Pageable pageable = PageRequest.of(page, size);
        PageResponse<ContentTypeResponse> response = contentTypeService.searchContentTypesByWorkspace(workspaceId, q, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    private void validateWorkspaceAccess(Long workspaceId, UserDetails userDetails) {
        User user = getUserFromDetails(userDetails);
        if (!workspaceService.isWorkspaceMember(workspaceId, user.getId())) {
            throw new RuntimeException("User is not a member of this workspace");
        }
    }

    private User getUserFromDetails(UserDetails userDetails) {
        return userService.findByEmail(userDetails.getUsername());
    }
}
