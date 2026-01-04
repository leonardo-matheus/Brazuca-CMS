package com.brazucacms.controller;

import com.brazucacms.dto.common.ApiResponse;
import com.brazucacms.dto.common.PageResponse;
import com.brazucacms.dto.media.MediaResponse;
import com.brazucacms.dto.media.MediaUpdateRequest;
import com.brazucacms.model.User;
import com.brazucacms.service.MediaService;
import com.brazucacms.service.UserService;
import com.brazucacms.service.WorkspaceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/workspaces/{workspaceId}/media")
@RequiredArgsConstructor
@Tag(name = "Media", description = "Media management endpoints")
public class MediaController {

    private final MediaService mediaService;
    private final UserService userService;
    private final WorkspaceService workspaceService;

    @GetMapping
    @Operation(summary = "Get all media with pagination")
    public ResponseEntity<ApiResponse<PageResponse<MediaResponse>>> getAllMedia(
            @PathVariable Long workspaceId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String folder,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        validateWorkspaceAccess(workspaceId, userDetails);
        
        Sort sort = sortDir.equalsIgnoreCase("desc") ? 
                Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        PageResponse<MediaResponse> response;
        if (folder != null && !folder.isEmpty()) {
            response = mediaService.getMediaByWorkspaceAndFolder(workspaceId, folder, pageable);
        } else if (type != null && !type.isEmpty()) {
            response = mediaService.getMediaByWorkspaceAndType(workspaceId, type, pageable);
        } else {
            response = mediaService.getMediaByWorkspace(workspaceId, pageable);
        }
        
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get media by ID")
    public ResponseEntity<ApiResponse<MediaResponse>> getMediaById(
            @PathVariable Long workspaceId,
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        validateWorkspaceAccess(workspaceId, userDetails);
        MediaResponse response = mediaService.getMediaById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload a new media file")
    public ResponseEntity<ApiResponse<MediaResponse>> uploadMedia(
            @PathVariable Long workspaceId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) String folder,
            @RequestParam(required = false) String name,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        validateWorkspaceAccess(workspaceId, userDetails);
        User user = getUserFromDetails(userDetails);
        MediaResponse response = mediaService.uploadMedia(workspaceId, file, folder, name, user);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Media uploaded successfully", response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update media metadata")
    public ResponseEntity<ApiResponse<MediaResponse>> updateMedia(
            @PathVariable Long workspaceId,
            @PathVariable Long id,
            @RequestBody MediaUpdateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        validateWorkspaceAccess(workspaceId, userDetails);
        MediaResponse response = mediaService.updateMedia(id, request);
        return ResponseEntity.ok(ApiResponse.success("Media updated successfully", response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a media file")
    public ResponseEntity<ApiResponse<Void>> deleteMedia(
            @PathVariable Long workspaceId,
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        validateWorkspaceAccess(workspaceId, userDetails);
        mediaService.deleteMedia(id);
        return ResponseEntity.ok(ApiResponse.success("Media deleted successfully", null));
    }

    @GetMapping("/search")
    @Operation(summary = "Search media")
    public ResponseEntity<ApiResponse<PageResponse<MediaResponse>>> searchMedia(
            @PathVariable Long workspaceId,
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        validateWorkspaceAccess(workspaceId, userDetails);
        Pageable pageable = PageRequest.of(page, size);
        PageResponse<MediaResponse> response = mediaService.searchMediaByWorkspace(workspaceId, q, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/file/{filename}")
    @Operation(summary = "Get media file content")
    public ResponseEntity<byte[]> getMediaFile(
            @PathVariable Long workspaceId,
            @PathVariable String filename) {
        
        byte[] fileContent = mediaService.getMediaFile(filename);
        MediaResponse media = mediaService.getMediaByWorkspace(workspaceId, PageRequest.of(0, 100)).getContent().stream()
                .filter(m -> m.getFilename().equals(filename))
                .findFirst()
                .orElse(null);

        String contentType = media != null && media.getMimeType() != null 
                ? media.getMimeType() 
                : "application/octet-stream";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, contentType)
                .body(fileContent);
    }

    @GetMapping("/storage")
    @Operation(summary = "Get storage usage for workspace")
    public ResponseEntity<ApiResponse<StorageInfo>> getStorageUsage(
            @PathVariable Long workspaceId,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        validateWorkspaceAccess(workspaceId, userDetails);
        Long usedBytes = mediaService.getStorageUsedByWorkspace(workspaceId);
        Long limitBytes = workspaceService.getStorageLimitForWorkspace(workspaceId);
        
        StorageInfo info = new StorageInfo(usedBytes, limitBytes, formatBytes(usedBytes), formatBytes(limitBytes));
        return ResponseEntity.ok(ApiResponse.success(info));
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

    private String formatBytes(Long bytes) {
        if (bytes < 1024) return bytes + " B";
        else if (bytes < 1024 * 1024) return String.format("%.2f KB", bytes / 1024.0);
        else if (bytes < 1024 * 1024 * 1024) return String.format("%.2f MB", bytes / (1024.0 * 1024));
        else return String.format("%.2f GB", bytes / (1024.0 * 1024 * 1024));
    }

    public record StorageInfo(Long usedBytes, Long limitBytes, String usedFormatted, String limitFormatted) {}
}
