package com.brazucacms.controller;

import com.brazucacms.dto.common.ApiResponse;
import com.brazucacms.dto.common.PageResponse;
import com.brazucacms.dto.contenttype.ContentTypeResponse;
import com.brazucacms.dto.entry.EntryResponse;
import com.brazucacms.model.ApiKey;
import com.brazucacms.model.Workspace;
import com.brazucacms.repository.WorkspaceRepository;
import com.brazucacms.service.ApiKeyService;
import com.brazucacms.service.ContentTypeService;
import com.brazucacms.service.EntryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Tag(name = "Public API", description = "Public API endpoints for content delivery (requires API key)")
public class PublicApiController {

    private final ContentTypeService contentTypeService;
    private final EntryService entryService;
    private final ApiKeyService apiKeyService;
    private final WorkspaceRepository workspaceRepository;

    // Legacy endpoints without workspace scope
    @GetMapping("/content-types")
    @Operation(summary = "Get all content types")
    public ResponseEntity<ApiResponse<List<ContentTypeResponse>>> getContentTypes() {
        List<ContentTypeResponse> response = contentTypeService.getAllContentTypesList();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/content-types/{slug}")
    @Operation(summary = "Get content type by slug")
    public ResponseEntity<ApiResponse<ContentTypeResponse>> getContentTypeBySlug(@PathVariable String slug) {
        ContentTypeResponse response = contentTypeService.getContentTypeBySlug(slug);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{contentTypeSlug}")
    @Operation(summary = "Get published entries by content type slug")
    public ResponseEntity<ApiResponse<PageResponse<EntryResponse>>> getEntries(
            @PathVariable String contentTypeSlug,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "publishedAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        
        Sort sort = sortDir.equalsIgnoreCase("desc") ? 
                Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        PageResponse<EntryResponse> response = entryService.getPublishedEntriesByContentType(contentTypeSlug, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{contentTypeSlug}/{slug}")
    @Operation(summary = "Get published entry by slug")
    public ResponseEntity<ApiResponse<EntryResponse>> getEntryBySlug(
            @PathVariable String contentTypeSlug,
            @PathVariable String slug) {
        
        EntryResponse response = entryService.getPublishedEntryBySlug(slug);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // Workspace-scoped public API endpoints
    @GetMapping("/public/{workspaceSlug}/{contentTypeSlug}")
    @Operation(summary = "Get published entries by content type (workspace-scoped, requires API key)")
    public ResponseEntity<ApiResponse<PageResponse<EntryResponse>>> getPublishedEntries(
            @PathVariable String workspaceSlug,
            @PathVariable String contentTypeSlug,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "publishedAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestHeader(value = "X-API-Key", required = false) String apiKey) {

        // Validate API key
        if (apiKey == null || apiKey.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("API key is required"));
        }

        ApiKey validatedKey = apiKeyService.validateApiKey(apiKey);
        if (validatedKey == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Invalid or expired API key"));
        }

        // Find workspace by slug
        Workspace workspace = workspaceRepository.findBySlug(workspaceSlug)
                .orElse(null);
        
        if (workspace == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Workspace not found"));
        }

        // Verify API key belongs to this workspace
        if (validatedKey.getWorkspace() != null && 
            !validatedKey.getWorkspace().getId().equals(workspace.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("API key does not have access to this workspace"));
        }

        Sort sort = sortDir.equalsIgnoreCase("desc") ?
                Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        PageResponse<EntryResponse> response = entryService.getPublishedEntriesByWorkspaceAndContentType(
                workspace.getId(), contentTypeSlug, pageable);
        
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/public/{workspaceSlug}/{contentTypeSlug}/{entrySlug}")
    @Operation(summary = "Get single published entry by slug (workspace-scoped, requires API key)")
    public ResponseEntity<ApiResponse<EntryResponse>> getPublishedEntry(
            @PathVariable String workspaceSlug,
            @PathVariable String contentTypeSlug,
            @PathVariable String entrySlug,
            @RequestHeader(value = "X-API-Key", required = false) String apiKey) {

        // Validate API key
        if (apiKey == null || apiKey.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("API key is required"));
        }

        ApiKey validatedKey = apiKeyService.validateApiKey(apiKey);
        if (validatedKey == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Invalid or expired API key"));
        }

        // Find workspace by slug
        Workspace workspace = workspaceRepository.findBySlug(workspaceSlug)
                .orElse(null);
        
        if (workspace == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Workspace not found"));
        }

        // Verify API key belongs to this workspace
        if (validatedKey.getWorkspace() != null && 
            !validatedKey.getWorkspace().getId().equals(workspace.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("API key does not have access to this workspace"));
        }

        try {
            EntryResponse response = entryService.getPublishedEntryByWorkspaceAndSlug(workspace.getId(), entrySlug);
            return ResponseEntity.ok(ApiResponse.success(response));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Entry not found"));
        }
    }
}
