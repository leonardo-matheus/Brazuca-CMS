package com.brazucacms.service;

import com.brazucacms.dto.media.MediaResponse;
import com.brazucacms.dto.media.MediaUpdateRequest;
import com.brazucacms.dto.common.PageResponse;
import com.brazucacms.exception.ResourceNotFoundException;
import com.brazucacms.exception.FileStorageException;
import com.brazucacms.model.Media;
import com.brazucacms.model.User;
import com.brazucacms.model.Workspace;
import com.brazucacms.repository.MediaRepository;
import com.brazucacms.repository.WorkspaceRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MediaService {

    private final MediaRepository mediaRepository;
    private final WorkspaceRepository workspaceRepository;

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(Paths.get(uploadDir));
        } catch (IOException e) {
            throw new FileStorageException("Could not create upload directory", e);
        }
    }

    // Workspace-scoped methods
    public PageResponse<MediaResponse> getMediaByWorkspace(Long workspaceId, Pageable pageable) {
        Page<Media> page = mediaRepository.findByWorkspaceId(workspaceId, pageable);
        Page<MediaResponse> responsePage = page.map(MediaResponse::fromEntity);
        return PageResponse.from(responsePage);
    }

    public PageResponse<MediaResponse> getMediaByWorkspaceAndType(Long workspaceId, String type, Pageable pageable) {
        Media.MediaType mediaType = Media.MediaType.valueOf(type.toUpperCase());
        Page<Media> page = mediaRepository.findByWorkspaceIdAndType(workspaceId, mediaType, pageable);
        Page<MediaResponse> responsePage = page.map(MediaResponse::fromEntity);
        return PageResponse.from(responsePage);
    }

    public PageResponse<MediaResponse> getMediaByWorkspaceAndFolder(Long workspaceId, String folder, Pageable pageable) {
        Page<Media> page = mediaRepository.findByWorkspaceIdAndFolder(workspaceId, folder, pageable);
        Page<MediaResponse> responsePage = page.map(MediaResponse::fromEntity);
        return PageResponse.from(responsePage);
    }

    public PageResponse<MediaResponse> searchMediaByWorkspace(Long workspaceId, String search, Pageable pageable) {
        Page<Media> page = mediaRepository.searchByWorkspaceAndFilenameOrAltText(workspaceId, search, pageable);
        Page<MediaResponse> responsePage = page.map(MediaResponse::fromEntity);
        return PageResponse.from(responsePage);
    }

    @Transactional
    public MediaResponse uploadMedia(Long workspaceId, MultipartFile file, String folder, String name, User uploadedBy) {
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found with id: " + workspaceId));

        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename());
        String extension = getFileExtension(originalFilename);
        String filename = UUID.randomUUID().toString() + "." + extension;

        try {
            if (originalFilename.contains("..")) {
                throw new FileStorageException("Filename contains invalid path sequence: " + originalFilename);
            }

            // Create workspace-specific directory
            Path workspaceDir = Paths.get(uploadDir, String.valueOf(workspaceId));
            if (folder != null && !folder.isEmpty()) {
                workspaceDir = workspaceDir.resolve(folder);
            }
            Files.createDirectories(workspaceDir);

            Path targetLocation = workspaceDir.resolve(filename);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            String mimeType = file.getContentType();
            Media.MediaType mediaType = determineMediaType(mimeType);

            Integer width = null;
            Integer height = null;

            if (mediaType == Media.MediaType.IMAGE) {
                try (InputStream is = file.getInputStream()) {
                    BufferedImage image = ImageIO.read(is);
                    if (image != null) {
                        width = image.getWidth();
                        height = image.getHeight();
                    }
                }
            }

            String relativePath = folder != null && !folder.isEmpty() 
                    ? workspaceId + "/" + folder + "/" + filename 
                    : workspaceId + "/" + filename;

            Media media = Media.builder()
                    .filename(filename)
                    .originalFilename(originalFilename)
                    .name(name != null ? name : originalFilename)
                    .url("/uploads/" + relativePath)
                    .mimeType(mimeType)
                    .fileSize(file.getSize())
                    .width(width)
                    .height(height)
                    .type(mediaType)
                    .folder(folder)
                    .workspace(workspace)
                    .uploadedBy(uploadedBy)
                    .uploadedAt(LocalDateTime.now())
                    .build();

            Media savedMedia = mediaRepository.save(media);
            return MediaResponse.fromEntity(savedMedia);

        } catch (IOException e) {
            throw new FileStorageException("Could not store file " + originalFilename, e);
        }
    }

    public Long getStorageUsedByWorkspace(Long workspaceId) {
        Long totalBytes = mediaRepository.getTotalStorageUsedByWorkspace(workspaceId);
        return totalBytes != null ? totalBytes : 0L;
    }

    public long countMediaByWorkspace(Long workspaceId) {
        return mediaRepository.countByWorkspaceId(workspaceId);
    }

    // Legacy methods (keeping for backward compatibility)
    public PageResponse<MediaResponse> getAllMedia(Pageable pageable) {
        Page<Media> page = mediaRepository.findAll(pageable);
        Page<MediaResponse> responsePage = page.map(MediaResponse::fromEntity);
        return PageResponse.from(responsePage);
    }

    public PageResponse<MediaResponse> getMediaByType(String type, Pageable pageable) {
        Media.MediaType mediaType = Media.MediaType.valueOf(type.toUpperCase());
        Page<Media> page = mediaRepository.findByType(mediaType, pageable);
        Page<MediaResponse> responsePage = page.map(MediaResponse::fromEntity);
        return PageResponse.from(responsePage);
    }

    public MediaResponse getMediaById(Long id) {
        Media media = mediaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Media not found with id: " + id));
        return MediaResponse.fromEntity(media);
    }

    @Transactional
    public MediaResponse uploadMedia(MultipartFile file, User uploadedBy) {
        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename());
        String extension = getFileExtension(originalFilename);
        String filename = UUID.randomUUID().toString() + "." + extension;

        try {
            if (originalFilename.contains("..")) {
                throw new FileStorageException("Filename contains invalid path sequence: " + originalFilename);
            }

            Path targetLocation = Paths.get(uploadDir).resolve(filename);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            String mimeType = file.getContentType();
            Media.MediaType mediaType = determineMediaType(mimeType);

            Integer width = null;
            Integer height = null;

            if (mediaType == Media.MediaType.IMAGE) {
                try (InputStream is = file.getInputStream()) {
                    BufferedImage image = ImageIO.read(is);
                    if (image != null) {
                        width = image.getWidth();
                        height = image.getHeight();
                    }
                }
            }

            Media media = Media.builder()
                    .filename(filename)
                    .originalFilename(originalFilename)
                    .name(originalFilename)
                    .url("/uploads/" + filename)
                    .mimeType(mimeType)
                    .fileSize(file.getSize())
                    .width(width)
                    .height(height)
                    .type(mediaType)
                    .uploadedBy(uploadedBy)
                    .uploadedAt(LocalDateTime.now())
                    .build();

            Media savedMedia = mediaRepository.save(media);
            return MediaResponse.fromEntity(savedMedia);

        } catch (IOException e) {
            throw new FileStorageException("Could not store file " + originalFilename, e);
        }
    }

    @Transactional
    public MediaResponse updateMedia(Long id, MediaUpdateRequest request) {
        Media media = mediaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Media not found with id: " + id));

        if (request.getAltText() != null) {
            media.setAltText(request.getAltText());
        }

        if (request.getCaption() != null) {
            media.setCaption(request.getCaption());
        }

        if (request.getName() != null) {
            media.setName(request.getName());
        }

        if (request.getFolder() != null) {
            media.setFolder(request.getFolder());
        }

        Media savedMedia = mediaRepository.save(media);
        return MediaResponse.fromEntity(savedMedia);
    }

    @Transactional
    public void deleteMedia(Long id) {
        Media media = mediaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Media not found with id: " + id));

        try {
            Path filePath = Paths.get(uploadDir).resolve(media.getFilename());
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            throw new FileStorageException("Could not delete file: " + media.getFilename(), e);
        }

        mediaRepository.delete(media);
    }

    public PageResponse<MediaResponse> searchMedia(String search, Pageable pageable) {
        Page<Media> page = mediaRepository.searchByFilenameOrAltText(search, pageable);
        Page<MediaResponse> responsePage = page.map(MediaResponse::fromEntity);
        return PageResponse.from(responsePage);
    }

    public long countMedia() {
        return mediaRepository.count();
    }

    public byte[] getMediaFile(String filename) {
        try {
            Path filePath = Paths.get(uploadDir).resolve(filename);
            return Files.readAllBytes(filePath);
        } catch (IOException e) {
            throw new ResourceNotFoundException("File not found: " + filename);
        }
    }

    private String getFileExtension(String filename) {
        int dotIndex = filename.lastIndexOf('.');
        return (dotIndex == -1) ? "" : filename.substring(dotIndex + 1).toLowerCase();
    }

    private Media.MediaType determineMediaType(String mimeType) {
        if (mimeType == null) {
            return Media.MediaType.OTHER;
        }

        if (mimeType.startsWith("image/")) {
            return Media.MediaType.IMAGE;
        } else if (mimeType.startsWith("video/")) {
            return Media.MediaType.VIDEO;
        } else if (mimeType.startsWith("audio/")) {
            return Media.MediaType.AUDIO;
        } else if (mimeType.equals("application/pdf") ||
                   mimeType.startsWith("application/msword") ||
                   mimeType.startsWith("application/vnd.openxmlformats") ||
                   mimeType.startsWith("text/")) {
            return Media.MediaType.DOCUMENT;
        }

        return Media.MediaType.OTHER;
    }
}
