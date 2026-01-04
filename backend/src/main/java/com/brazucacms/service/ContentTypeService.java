package com.brazucacms.service;

import com.brazucacms.dto.contenttype.ContentTypeRequest;
import com.brazucacms.dto.contenttype.ContentTypeResponse;
import com.brazucacms.dto.common.PageResponse;
import com.brazucacms.exception.ResourceNotFoundException;
import com.brazucacms.exception.DuplicateResourceException;
import com.brazucacms.model.ContentType;
import com.brazucacms.model.User;
import com.brazucacms.model.Workspace;
import com.brazucacms.repository.ContentTypeRepository;
import com.brazucacms.repository.EntryRepository;
import com.brazucacms.repository.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ContentTypeService {

    private final ContentTypeRepository contentTypeRepository;
    private final EntryRepository entryRepository;
    private final WorkspaceRepository workspaceRepository;

    // Workspace-scoped methods
    public PageResponse<ContentTypeResponse> getContentTypesByWorkspace(Long workspaceId, Pageable pageable) {
        Page<ContentType> page = contentTypeRepository.findByWorkspaceIdAndActiveTrue(workspaceId, pageable);
        Page<ContentTypeResponse> responsePage = page.map(ct -> {
            long entriesCount = entryRepository.countByContentTypeId(ct.getId());
            return ContentTypeResponse.fromEntitySimple(ct, entriesCount);
        });
        return PageResponse.from(responsePage);
    }

    public List<ContentTypeResponse> getContentTypesListByWorkspace(Long workspaceId) {
        return contentTypeRepository.findByWorkspaceIdAndActiveTrue(workspaceId).stream()
                .map(ct -> {
                    long entriesCount = entryRepository.countByContentTypeId(ct.getId());
                    return ContentTypeResponse.fromEntitySimple(ct, entriesCount);
                })
                .collect(Collectors.toList());
    }

    public ContentTypeResponse getContentTypeByWorkspaceAndSlug(Long workspaceId, String slug) {
        ContentType contentType = contentTypeRepository.findByWorkspaceIdAndSlug(workspaceId, slug)
                .orElseThrow(() -> new ResourceNotFoundException("Content type not found with slug: " + slug));
        long entriesCount = entryRepository.countByContentTypeId(contentType.getId());
        return ContentTypeResponse.fromEntitySimple(contentType, entriesCount);
    }

    public PageResponse<ContentTypeResponse> searchContentTypesByWorkspace(Long workspaceId, String search, Pageable pageable) {
        Page<ContentType> page = contentTypeRepository.searchByWorkspaceAndNameOrDescription(workspaceId, search, pageable);
        Page<ContentTypeResponse> responsePage = page.map(ct -> {
            long entriesCount = entryRepository.countByContentTypeId(ct.getId());
            return ContentTypeResponse.fromEntitySimple(ct, entriesCount);
        });
        return PageResponse.from(responsePage);
    }

    @Transactional
    public ContentTypeResponse createContentType(Long workspaceId, ContentTypeRequest request, User createdBy) {
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found with id: " + workspaceId));

        String slug = generateSlug(request.getName(), request.getSlug());

        if (contentTypeRepository.existsByWorkspaceIdAndSlug(workspaceId, slug)) {
            throw new DuplicateResourceException("Content type with slug '" + slug + "' already exists in this workspace");
        }

        ContentType contentType = ContentType.builder()
                .name(request.getName())
                .displayName(request.getDisplayName() != null ? request.getDisplayName() : request.getName())
                .slug(slug)
                .description(request.getDescription())
                .icon(request.getIcon())
                .fields(request.getFields())
                .workspace(workspace)
                .createdBy(createdBy)
                .build();

        ContentType savedContentType = contentTypeRepository.save(contentType);
        return ContentTypeResponse.fromEntitySimple(savedContentType, 0L);
    }

    // Legacy methods (keeping for backward compatibility)
    public PageResponse<ContentTypeResponse> getAllContentTypes(Pageable pageable) {
        Page<ContentType> page = contentTypeRepository.findByActiveTrue(pageable);
        Page<ContentTypeResponse> responsePage = page.map(ct -> {
            long entriesCount = entryRepository.countByContentTypeId(ct.getId());
            return ContentTypeResponse.fromEntitySimple(ct, entriesCount);
        });
        return PageResponse.from(responsePage);
    }

    public List<ContentTypeResponse> getAllContentTypesList() {
        return contentTypeRepository.findByActiveTrue().stream()
                .map(ct -> {
                    long entriesCount = entryRepository.countByContentTypeId(ct.getId());
                    return ContentTypeResponse.fromEntitySimple(ct, entriesCount);
                })
                .collect(Collectors.toList());
    }

    public ContentTypeResponse getContentTypeById(Long id) {
        ContentType contentType = contentTypeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Content type not found with id: " + id));
        long entriesCount = entryRepository.countByContentTypeId(id);
        return ContentTypeResponse.fromEntitySimple(contentType, entriesCount);
    }

    public ContentTypeResponse getContentTypeBySlug(String slug) {
        ContentType contentType = contentTypeRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Content type not found with slug: " + slug));
        long entriesCount = entryRepository.countByContentTypeId(contentType.getId());
        return ContentTypeResponse.fromEntitySimple(contentType, entriesCount);
    }

    @Transactional
    public ContentTypeResponse createContentType(ContentTypeRequest request, User createdBy) {
        String slug = generateSlug(request.getName(), request.getSlug());

        if (contentTypeRepository.existsBySlug(slug)) {
            throw new DuplicateResourceException("Content type with slug '" + slug + "' already exists");
        }

        ContentType contentType = ContentType.builder()
                .name(request.getName())
                .displayName(request.getDisplayName() != null ? request.getDisplayName() : request.getName())
                .slug(slug)
                .description(request.getDescription())
                .icon(request.getIcon())
                .fields(request.getFields())
                .createdBy(createdBy)
                .build();

        ContentType savedContentType = contentTypeRepository.save(contentType);
        return ContentTypeResponse.fromEntitySimple(savedContentType, 0L);
    }

    @Transactional
    public ContentTypeResponse updateContentType(Long id, ContentTypeRequest request) {
        ContentType contentType = contentTypeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Content type not found with id: " + id));

        if (request.getName() != null) {
            contentType.setName(request.getName());
        }

        if (request.getDisplayName() != null) {
            contentType.setDisplayName(request.getDisplayName());
        }

        if (request.getSlug() != null && !request.getSlug().equals(contentType.getSlug())) {
            String newSlug = generateSlug(request.getName(), request.getSlug());
            Long workspaceId = contentType.getWorkspace() != null ? contentType.getWorkspace().getId() : null;
            
            if (workspaceId != null && contentTypeRepository.existsByWorkspaceIdAndSlug(workspaceId, newSlug)) {
                throw new DuplicateResourceException("Content type with slug '" + newSlug + "' already exists in this workspace");
            } else if (contentTypeRepository.existsBySlug(newSlug)) {
                throw new DuplicateResourceException("Content type with slug '" + newSlug + "' already exists");
            }
            contentType.setSlug(newSlug);
        }

        if (request.getDescription() != null) {
            contentType.setDescription(request.getDescription());
        }

        if (request.getIcon() != null) {
            contentType.setIcon(request.getIcon());
        }

        if (request.getFields() != null) {
            contentType.setFields(request.getFields());
        }

        ContentType savedContentType = contentTypeRepository.save(contentType);
        long entriesCount = entryRepository.countByContentTypeId(id);
        return ContentTypeResponse.fromEntitySimple(savedContentType, entriesCount);
    }

    @Transactional
    public void deleteContentType(Long id) {
        ContentType contentType = contentTypeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Content type not found with id: " + id));
        
        // Soft delete
        contentType.setActive(false);
        contentTypeRepository.save(contentType);
    }

    @Transactional
    public void hardDeleteContentType(Long id) {
        if (!contentTypeRepository.existsById(id)) {
            throw new ResourceNotFoundException("Content type not found with id: " + id);
        }
        contentTypeRepository.deleteById(id);
    }

    public PageResponse<ContentTypeResponse> searchContentTypes(String search, Pageable pageable) {
        Page<ContentType> page = contentTypeRepository.searchByNameOrDescription(search, pageable);
        Page<ContentTypeResponse> responsePage = page.map(ct -> {
            long entriesCount = entryRepository.countByContentTypeId(ct.getId());
            return ContentTypeResponse.fromEntitySimple(ct, entriesCount);
        });
        return PageResponse.from(responsePage);
    }

    public ContentType findById(Long id) {
        return contentTypeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Content type not found with id: " + id));
    }

    public long countContentTypes() {
        return contentTypeRepository.count();
    }

    public long countContentTypesByWorkspace(Long workspaceId) {
        return contentTypeRepository.countByWorkspaceIdAndActiveTrue(workspaceId);
    }

    private String generateSlug(String name, String customSlug) {
        if (customSlug != null && !customSlug.isBlank()) {
            return customSlug.toLowerCase()
                    .replaceAll("[^a-z0-9\\s-]", "")
                    .replaceAll("\\s+", "-")
                    .replaceAll("-+", "-")
                    .replaceAll("^-|-$", "");
        }

        return name.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
    }
}
