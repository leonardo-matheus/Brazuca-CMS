package com.brazucacms.controller;

import com.brazucacms.dto.common.ApiResponse;
import com.brazucacms.dto.common.PageResponse;
import com.brazucacms.dto.entry.EntryHistoryDTO;
import com.brazucacms.dto.entry.EntryRequest;
import com.brazucacms.dto.entry.EntryResponse;
import com.brazucacms.model.User;
import com.brazucacms.service.EntryHistoryService;
import com.brazucacms.service.EntryService;
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
@RequestMapping("/api/workspaces/{workspaceId}/entries")
@RequiredArgsConstructor
@Tag(name = "Entries", description = "Entry management endpoints")
public class EntryController {

    private final EntryService entryService;
    private final UserService userService;
    private final WorkspaceService workspaceService;
    private final EntryHistoryService entryHistoryService;

    @GetMapping
    @Operation(summary = "Get all entries with pagination")
    public ResponseEntity<ApiResponse<PageResponse<EntryResponse>>> getAllEntries(
            @PathVariable Long workspaceId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(required = false) Long contentTypeId,
            @RequestParam(required = false) String status,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        validateWorkspaceAccess(workspaceId, userDetails);
        
        Sort sort = sortDir.equalsIgnoreCase("desc") ? 
                Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        PageResponse<EntryResponse> response;
        
        if (contentTypeId != null && status != null) {
            response = entryService.getEntriesByWorkspaceContentTypeAndStatus(workspaceId, contentTypeId, status, pageable);
        } else if (contentTypeId != null) {
            response = entryService.getEntriesByWorkspaceAndContentType(workspaceId, contentTypeId, pageable);
        } else if (status != null) {
            response = entryService.getEntriesByWorkspaceAndStatus(workspaceId, status, pageable);
        } else {
            response = entryService.getEntriesByWorkspace(workspaceId, pageable);
        }
        
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/content-type/{contentTypeSlug}")
    @Operation(summary = "Get entries by content type slug")
    public ResponseEntity<ApiResponse<PageResponse<EntryResponse>>> getEntriesByContentTypeSlug(
            @PathVariable Long workspaceId,
            @PathVariable String contentTypeSlug,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        validateWorkspaceAccess(workspaceId, userDetails);
        
        Sort sort = sortDir.equalsIgnoreCase("desc") ? 
                Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        PageResponse<EntryResponse> response = entryService.getEntriesByWorkspaceAndContentTypeSlug(workspaceId, contentTypeSlug, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get entry by ID")
    public ResponseEntity<ApiResponse<EntryResponse>> getEntryById(
            @PathVariable Long workspaceId,
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        validateWorkspaceAccess(workspaceId, userDetails);
        EntryResponse response = entryService.getEntryById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/slug/{slug}")
    @Operation(summary = "Get entry by slug")
    public ResponseEntity<ApiResponse<EntryResponse>> getEntryBySlug(
            @PathVariable Long workspaceId,
            @PathVariable String slug,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        validateWorkspaceAccess(workspaceId, userDetails);
        EntryResponse response = entryService.getEntryByWorkspaceAndSlug(workspaceId, slug);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/recent")
    @Operation(summary = "Get recent entries")
    public ResponseEntity<ApiResponse<List<EntryResponse>>> getRecentEntries(
            @PathVariable Long workspaceId,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        validateWorkspaceAccess(workspaceId, userDetails);
        List<EntryResponse> response = entryService.getRecentEntriesByWorkspace(workspaceId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping
    @Operation(summary = "Create a new entry")
    public ResponseEntity<ApiResponse<EntryResponse>> createEntry(
            @PathVariable Long workspaceId,
            @Valid @RequestBody EntryRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        validateWorkspaceAccess(workspaceId, userDetails);
        User user = getUserFromDetails(userDetails);
        EntryResponse response = entryService.createEntry(workspaceId, request, user);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Entry created successfully", response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an entry")
    public ResponseEntity<ApiResponse<EntryResponse>> updateEntry(
            @PathVariable Long workspaceId,
            @PathVariable Long id,
            @Valid @RequestBody EntryRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        validateWorkspaceAccess(workspaceId, userDetails);
        User user = getUserFromDetails(userDetails);
        EntryResponse response = entryService.updateEntry(id, request, user);
        return ResponseEntity.ok(ApiResponse.success("Entry updated successfully", response));
    }

    @PostMapping("/{id}/publish")
    @Operation(summary = "Publish an entry")
    public ResponseEntity<ApiResponse<EntryResponse>> publishEntry(
            @PathVariable Long workspaceId,
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        validateWorkspaceAccess(workspaceId, userDetails);
        User user = getUserFromDetails(userDetails);
        EntryResponse response = entryService.publishEntry(id, user);
        return ResponseEntity.ok(ApiResponse.success("Entry published successfully", response));
    }

    @PostMapping("/{id}/unpublish")
    @Operation(summary = "Unpublish an entry")
    public ResponseEntity<ApiResponse<EntryResponse>> unpublishEntry(
            @PathVariable Long workspaceId,
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        validateWorkspaceAccess(workspaceId, userDetails);
        User user = getUserFromDetails(userDetails);
        EntryResponse response = entryService.unpublishEntry(id, user);
        return ResponseEntity.ok(ApiResponse.success("Entry unpublished successfully", response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete an entry")
    public ResponseEntity<ApiResponse<Void>> deleteEntry(
            @PathVariable Long workspaceId,
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        validateWorkspaceAccess(workspaceId, userDetails);
        entryService.deleteEntry(id);
        return ResponseEntity.ok(ApiResponse.success("Entry deleted successfully", null));
    }

    @GetMapping("/search")
    @Operation(summary = "Search entries")
    public ResponseEntity<ApiResponse<PageResponse<EntryResponse>>> searchEntries(
            @PathVariable Long workspaceId,
            @RequestParam String q,
            @RequestParam(required = false) Long contentTypeId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        validateWorkspaceAccess(workspaceId, userDetails);
        Pageable pageable = PageRequest.of(page, size);
        PageResponse<EntryResponse> response;
        
        if (contentTypeId != null) {
            response = entryService.searchEntriesInWorkspaceAndContentType(workspaceId, contentTypeId, q, pageable);
        } else {
            response = entryService.searchEntriesInWorkspace(workspaceId, q, pageable);
        }
        
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // Entry History endpoints
    @GetMapping("/{id}/history")
    @Operation(summary = "Get entry history")
    public ResponseEntity<ApiResponse<List<EntryHistoryDTO>>> getEntryHistory(
            @PathVariable Long workspaceId,
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        validateWorkspaceAccess(workspaceId, userDetails);
        List<EntryHistoryDTO> history = entryHistoryService.getEntryHistory(id);
        return ResponseEntity.ok(ApiResponse.success(history));
    }

    @GetMapping("/{id}/history/{version}")
    @Operation(summary = "Get specific version of entry")
    public ResponseEntity<ApiResponse<EntryHistoryDTO>> getEntryVersion(
            @PathVariable Long workspaceId,
            @PathVariable Long id,
            @PathVariable Integer version,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        validateWorkspaceAccess(workspaceId, userDetails);
        EntryHistoryDTO historyEntry = entryHistoryService.getEntryVersion(id, version);
        return ResponseEntity.ok(ApiResponse.success(historyEntry));
    }

    @PostMapping("/{id}/restore/{version}")
    @Operation(summary = "Restore entry to specific version")
    public ResponseEntity<ApiResponse<EntryResponse>> restoreEntryVersion(
            @PathVariable Long workspaceId,
            @PathVariable Long id,
            @PathVariable Integer version,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        validateWorkspaceAccess(workspaceId, userDetails);
        User user = getUserFromDetails(userDetails);
        EntryResponse response = entryHistoryService.restoreVersion(id, version, user);
        return ResponseEntity.ok(ApiResponse.success("Entry restored to version " + version, response));
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
