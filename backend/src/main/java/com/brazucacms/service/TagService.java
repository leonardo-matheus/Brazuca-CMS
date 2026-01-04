package com.brazucacms.service;

import com.brazucacms.dto.common.PageResponse;
import com.brazucacms.dto.tag.TagRequest;
import com.brazucacms.dto.tag.TagResponse;
import com.brazucacms.exception.ResourceNotFoundException;
import com.brazucacms.model.Tag;
import com.brazucacms.model.Workspace;
import com.brazucacms.repository.TagRepository;
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
public class TagService {

    private final TagRepository tagRepository;
    private final WorkspaceRepository workspaceRepository;

    public List<TagResponse> getTagsByWorkspace(Long workspaceId) {
        return tagRepository.findByWorkspaceId(workspaceId).stream()
                .map(TagResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public PageResponse<TagResponse> getTagsByWorkspace(Long workspaceId, Pageable pageable) {
        Page<Tag> page = tagRepository.findByWorkspaceId(workspaceId, pageable);
        return PageResponse.from(page.map(TagResponse::fromEntity));
    }

    public TagResponse getTagById(Long workspaceId, Long id) {
        Tag tag = tagRepository.findByIdAndWorkspaceId(id, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Tag not found with id: " + id));
        return TagResponse.fromEntity(tag);
    }

    public TagResponse getTagBySlug(Long workspaceId, String slug) {
        Tag tag = tagRepository.findByWorkspaceIdAndSlug(workspaceId, slug)
                .orElseThrow(() -> new ResourceNotFoundException("Tag not found with slug: " + slug));
        return TagResponse.fromEntity(tag);
    }

    @Transactional
    public TagResponse createTag(Long workspaceId, TagRequest request) {
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found with id: " + workspaceId));

        String slug = request.getSlug();
        if (slug == null || slug.isBlank()) {
            slug = generateSlug(request.getName());
        }

        // Ensure unique slug within workspace
        String baseSlug = slug;
        int counter = 1;
        while (tagRepository.existsByWorkspaceIdAndSlug(workspaceId, slug)) {
            slug = baseSlug + "-" + counter++;
        }

        Tag tag = Tag.builder()
                .name(request.getName())
                .slug(slug)
                .description(request.getDescription())
                .color(request.getColor())
                .workspace(workspace)
                .usageCount(0)
                .build();

        tag = tagRepository.save(tag);
        return TagResponse.fromEntity(tag);
    }

    @Transactional
    public TagResponse updateTag(Long workspaceId, Long id, TagRequest request) {
        Tag tag = tagRepository.findByIdAndWorkspaceId(id, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Tag not found with id: " + id));

        tag.setName(request.getName());
        
        if (request.getSlug() != null && !request.getSlug().isBlank()) {
            // Check if slug is unique (excluding current tag)
            tagRepository.findByWorkspaceIdAndSlug(workspaceId, request.getSlug())
                    .ifPresent(existing -> {
                        if (!existing.getId().equals(id)) {
                            throw new IllegalArgumentException("Slug already exists for this workspace");
                        }
                    });
            tag.setSlug(request.getSlug());
        }

        tag.setDescription(request.getDescription());
        tag.setColor(request.getColor());

        tag = tagRepository.save(tag);
        return TagResponse.fromEntity(tag);
    }

    @Transactional
    public void deleteTag(Long workspaceId, Long id) {
        Tag tag = tagRepository.findByIdAndWorkspaceId(id, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Tag not found with id: " + id));
        tagRepository.delete(tag);
    }

    public PageResponse<TagResponse> searchTags(Long workspaceId, String query, Pageable pageable) {
        Page<Tag> page = tagRepository.searchByWorkspaceId(workspaceId, query, pageable);
        return PageResponse.from(page.map(TagResponse::fromEntity));
    }

    public List<TagResponse> searchTagsList(Long workspaceId, String query) {
        return tagRepository.searchByWorkspaceIdList(workspaceId, query).stream()
                .map(TagResponse::fromEntity)
                .collect(Collectors.toList());
    }

    private String generateSlug(String name) {
        return name.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
    }
}
