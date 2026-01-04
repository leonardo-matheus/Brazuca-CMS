package com.brazucacms.controller;

import com.brazucacms.dto.common.ApiResponse;
import com.brazucacms.dto.common.PageResponse;
import com.brazucacms.dto.tag.TagRequest;
import com.brazucacms.dto.tag.TagResponse;
import com.brazucacms.model.User;
import com.brazucacms.service.TagService;
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
@RequestMapping("/api/workspaces/{workspaceId}/tags")
@RequiredArgsConstructor
@Tag(name = "Tags", description = "Tag management endpoints")
public class TagController {

    private final TagService tagService;
    private final UserService userService;
    private final WorkspaceService workspaceService;

    @GetMapping
    @Operation(summary = "Get all tags for a workspace")
    public ResponseEntity<ApiResponse<List<TagResponse>>> getAllTags(
            @PathVariable Long workspaceId,
            @RequestParam(required = false) String sort,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        validateWorkspaceAccess(workspaceId, userDetails);
        List<TagResponse> tags = tagService.getTagsByWorkspace(workspaceId);
        
        // Apply sorting if requested
        if (sort != null && sort.equals("-usageCount")) {
            tags.sort((a, b) -> b.getUsageCount().compareTo(a.getUsageCount()));
        } else if (sort != null && sort.equals("usageCount")) {
            tags.sort((a, b) -> a.getUsageCount().compareTo(b.getUsageCount()));
        }
        
        return ResponseEntity.ok(ApiResponse.success(tags));
    }

    @GetMapping("/paginated")
    @Operation(summary = "Get all tags with pagination")
    public ResponseEntity<ApiResponse<PageResponse<TagResponse>>> getAllTagsPaginated(
            @PathVariable Long workspaceId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        validateWorkspaceAccess(workspaceId, userDetails);
        
        Sort sortObj = sortDir.equalsIgnoreCase("desc") ? 
                Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sortObj);
        
        PageResponse<TagResponse> response = tagService.getTagsByWorkspace(workspaceId, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get tag by ID")
    public ResponseEntity<ApiResponse<TagResponse>> getTagById(
            @PathVariable Long workspaceId,
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        validateWorkspaceAccess(workspaceId, userDetails);
        TagResponse response = tagService.getTagById(workspaceId, id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping
    @Operation(summary = "Create a new tag")
    public ResponseEntity<ApiResponse<TagResponse>> createTag(
            @PathVariable Long workspaceId,
            @Valid @RequestBody TagRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        validateWorkspaceAccess(workspaceId, userDetails);
        TagResponse response = tagService.createTag(workspaceId, request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tag created successfully", response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a tag")
    public ResponseEntity<ApiResponse<TagResponse>> updateTag(
            @PathVariable Long workspaceId,
            @PathVariable Long id,
            @Valid @RequestBody TagRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        validateWorkspaceAccess(workspaceId, userDetails);
        TagResponse response = tagService.updateTag(workspaceId, id, request);
        return ResponseEntity.ok(ApiResponse.success("Tag updated successfully", response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a tag")
    public ResponseEntity<ApiResponse<Void>> deleteTag(
            @PathVariable Long workspaceId,
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        validateWorkspaceAccess(workspaceId, userDetails);
        tagService.deleteTag(workspaceId, id);
        return ResponseEntity.ok(ApiResponse.success("Tag deleted successfully", null));
    }

    @GetMapping("/search")
    @Operation(summary = "Search tags")
    public ResponseEntity<ApiResponse<List<TagResponse>>> searchTags(
            @PathVariable Long workspaceId,
            @RequestParam String q,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        validateWorkspaceAccess(workspaceId, userDetails);
        List<TagResponse> response = tagService.searchTagsList(workspaceId, q);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    private void validateWorkspaceAccess(Long workspaceId, UserDetails userDetails) {
        User user = userService.findByEmail(userDetails.getUsername());
        if (!workspaceService.isWorkspaceMember(workspaceId, user.getId())) {
            throw new RuntimeException("User is not a member of this workspace");
        }
    }
}
