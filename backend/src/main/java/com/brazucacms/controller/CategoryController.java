package com.brazucacms.controller;

import com.brazucacms.dto.category.CategoryRequest;
import com.brazucacms.dto.category.CategoryResponse;
import com.brazucacms.dto.common.ApiResponse;
import com.brazucacms.dto.common.PageResponse;
import com.brazucacms.model.User;
import com.brazucacms.service.CategoryService;
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
@RequestMapping("/api/workspaces/{workspaceId}/content-types/{contentTypeId}/categories")
@RequiredArgsConstructor
@Tag(name = "Categories", description = "Category management endpoints")
public class CategoryController {

    private final CategoryService categoryService;
    private final UserService userService;
    private final WorkspaceService workspaceService;

    @GetMapping
    @Operation(summary = "Get all categories for a content type")
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getAllCategories(
            @PathVariable Long workspaceId,
            @PathVariable Long contentTypeId,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        validateWorkspaceAccess(workspaceId, userDetails);
        List<CategoryResponse> categories = categoryService.getCategoriesByContentType(contentTypeId);
        return ResponseEntity.ok(ApiResponse.success(categories));
    }

    @GetMapping("/paginated")
    @Operation(summary = "Get all categories with pagination")
    public ResponseEntity<ApiResponse<PageResponse<CategoryResponse>>> getAllCategoriesPaginated(
            @PathVariable Long workspaceId,
            @PathVariable Long contentTypeId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        validateWorkspaceAccess(workspaceId, userDetails);
        
        Sort sort = sortDir.equalsIgnoreCase("desc") ? 
                Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        PageResponse<CategoryResponse> response = categoryService.getCategoriesByContentType(contentTypeId, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get category by ID")
    public ResponseEntity<ApiResponse<CategoryResponse>> getCategoryById(
            @PathVariable Long workspaceId,
            @PathVariable Long contentTypeId,
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        validateWorkspaceAccess(workspaceId, userDetails);
        CategoryResponse response = categoryService.getCategoryById(contentTypeId, id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping
    @Operation(summary = "Create a new category")
    public ResponseEntity<ApiResponse<CategoryResponse>> createCategory(
            @PathVariable Long workspaceId,
            @PathVariable Long contentTypeId,
            @Valid @RequestBody CategoryRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        validateWorkspaceAccess(workspaceId, userDetails);
        CategoryResponse response = categoryService.createCategory(contentTypeId, request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Category created successfully", response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a category")
    public ResponseEntity<ApiResponse<CategoryResponse>> updateCategory(
            @PathVariable Long workspaceId,
            @PathVariable Long contentTypeId,
            @PathVariable Long id,
            @Valid @RequestBody CategoryRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        validateWorkspaceAccess(workspaceId, userDetails);
        CategoryResponse response = categoryService.updateCategory(contentTypeId, id, request);
        return ResponseEntity.ok(ApiResponse.success("Category updated successfully", response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a category")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(
            @PathVariable Long workspaceId,
            @PathVariable Long contentTypeId,
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        validateWorkspaceAccess(workspaceId, userDetails);
        categoryService.deleteCategory(contentTypeId, id);
        return ResponseEntity.ok(ApiResponse.success("Category deleted successfully", null));
    }

    @GetMapping("/search")
    @Operation(summary = "Search categories")
    public ResponseEntity<ApiResponse<PageResponse<CategoryResponse>>> searchCategories(
            @PathVariable Long workspaceId,
            @PathVariable Long contentTypeId,
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        validateWorkspaceAccess(workspaceId, userDetails);
        Pageable pageable = PageRequest.of(page, size);
        PageResponse<CategoryResponse> response = categoryService.searchCategories(contentTypeId, q, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    private void validateWorkspaceAccess(Long workspaceId, UserDetails userDetails) {
        User user = userService.findByEmail(userDetails.getUsername());
        if (!workspaceService.isWorkspaceMember(workspaceId, user.getId())) {
            throw new RuntimeException("User is not a member of this workspace");
        }
    }
}
