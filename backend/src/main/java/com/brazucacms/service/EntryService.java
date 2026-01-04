package com.brazucacms.service;

import com.brazucacms.dto.entry.EntryRequest;
import com.brazucacms.dto.entry.EntryResponse;
import com.brazucacms.dto.common.PageResponse;
import com.brazucacms.exception.ResourceNotFoundException;
import com.brazucacms.exception.DuplicateResourceException;
import com.brazucacms.model.ContentType;
import com.brazucacms.model.Entry;
import com.brazucacms.model.User;
import com.brazucacms.model.Workspace;
import com.brazucacms.repository.EntryRepository;
import com.brazucacms.repository.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EntryService {

    private final EntryRepository entryRepository;
    private final ContentTypeService contentTypeService;
    private final WorkspaceRepository workspaceRepository;

    // Workspace-scoped methods
    public PageResponse<EntryResponse> getEntriesByWorkspace(Long workspaceId, Pageable pageable) {
        Page<Entry> page = entryRepository.findByWorkspaceId(workspaceId, pageable);
        Page<EntryResponse> responsePage = page.map(EntryResponse::fromEntity);
        return PageResponse.from(responsePage);
    }

    public PageResponse<EntryResponse> getEntriesByWorkspaceAndContentType(Long workspaceId, Long contentTypeId, Pageable pageable) {
        Page<Entry> page = entryRepository.findByWorkspaceIdAndContentTypeId(workspaceId, contentTypeId, pageable);
        Page<EntryResponse> responsePage = page.map(EntryResponse::fromEntity);
        return PageResponse.from(responsePage);
    }

    public PageResponse<EntryResponse> getEntriesByWorkspaceAndContentTypeSlug(Long workspaceId, String contentTypeSlug, Pageable pageable) {
        Page<Entry> page = entryRepository.findByWorkspaceIdAndContentTypeSlug(workspaceId, contentTypeSlug, pageable);
        Page<EntryResponse> responsePage = page.map(EntryResponse::fromEntity);
        return PageResponse.from(responsePage);
    }

    public PageResponse<EntryResponse> getEntriesByWorkspaceAndStatus(Long workspaceId, String status, Pageable pageable) {
        Entry.Status entryStatus = Entry.Status.valueOf(status.toUpperCase());
        Page<Entry> page = entryRepository.findByWorkspaceIdAndStatus(workspaceId, entryStatus, pageable);
        Page<EntryResponse> responsePage = page.map(EntryResponse::fromEntity);
        return PageResponse.from(responsePage);
    }

    public PageResponse<EntryResponse> getEntriesByWorkspaceContentTypeAndStatus(Long workspaceId, Long contentTypeId, String status, Pageable pageable) {
        Entry.Status entryStatus = Entry.Status.valueOf(status.toUpperCase());
        Page<Entry> page = entryRepository.findByWorkspaceIdAndContentTypeIdAndStatus(workspaceId, contentTypeId, entryStatus, pageable);
        Page<EntryResponse> responsePage = page.map(EntryResponse::fromEntity);
        return PageResponse.from(responsePage);
    }

    public EntryResponse getEntryByWorkspaceAndSlug(Long workspaceId, String slug) {
        Entry entry = entryRepository.findByWorkspaceIdAndSlug(workspaceId, slug)
                .orElseThrow(() -> new ResourceNotFoundException("Entry not found with slug: " + slug));
        return EntryResponse.fromEntity(entry);
    }

    public List<EntryResponse> getRecentEntriesByWorkspace(Long workspaceId) {
        Pageable pageable = PageRequest.of(0, 10, Sort.by("createdAt").descending());
        return entryRepository.findByWorkspaceId(workspaceId, pageable).stream()
                .map(EntryResponse::fromEntitySimple)
                .collect(Collectors.toList());
    }

    public PageResponse<EntryResponse> searchEntriesInWorkspace(Long workspaceId, String search, Pageable pageable) {
        Page<Entry> page = entryRepository.searchByWorkspaceAndTitleOrContent(workspaceId, search, pageable);
        Page<EntryResponse> responsePage = page.map(EntryResponse::fromEntity);
        return PageResponse.from(responsePage);
    }

    public PageResponse<EntryResponse> searchEntriesInWorkspaceAndContentType(Long workspaceId, Long contentTypeId, String search, Pageable pageable) {
        Page<Entry> page = entryRepository.searchByWorkspaceAndContentTypeAndTitleOrContent(workspaceId, contentTypeId, search, pageable);
        Page<EntryResponse> responsePage = page.map(EntryResponse::fromEntity);
        return PageResponse.from(responsePage);
    }

    @Transactional
    public EntryResponse createEntry(Long workspaceId, EntryRequest request, User createdBy) {
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found with id: " + workspaceId));
        
        ContentType contentType = contentTypeService.findById(request.getContentTypeId());

        String slug = generateSlug(request.getTitle(), request.getSlug());
        if (entryRepository.existsByWorkspaceIdAndSlug(workspaceId, slug)) {
            slug = slug + "-" + System.currentTimeMillis();
        }

        Entry.Status status = Entry.Status.DRAFT;
        if (request.getStatus() != null) {
            status = Entry.Status.valueOf(request.getStatus().toUpperCase());
        }

        Entry entry = Entry.builder()
                .title(request.getTitle())
                .slug(slug)
                .content(request.getContent())
                .status(status)
                .contentType(contentType)
                .workspace(workspace)
                .createdBy(createdBy)
                .version(1)
                .build();

        if (status == Entry.Status.PUBLISHED) {
            entry.setPublishedAt(LocalDateTime.now());
        }

        Entry savedEntry = entryRepository.save(entry);
        return EntryResponse.fromEntity(savedEntry);
    }

    public long countEntriesByWorkspace(Long workspaceId) {
        return entryRepository.countByWorkspaceId(workspaceId);
    }

    public long countEntriesByWorkspaceAndStatus(Long workspaceId, String status) {
        return entryRepository.countByWorkspaceIdAndStatus(workspaceId, Entry.Status.valueOf(status.toUpperCase()));
    }

    // Legacy methods (keeping for backward compatibility)
    public PageResponse<EntryResponse> getAllEntries(Pageable pageable) {
        Page<Entry> page = entryRepository.findAll(pageable);
        Page<EntryResponse> responsePage = page.map(EntryResponse::fromEntity);
        return PageResponse.from(responsePage);
    }

    public PageResponse<EntryResponse> getEntriesByContentType(Long contentTypeId, Pageable pageable) {
        Page<Entry> page = entryRepository.findByContentTypeId(contentTypeId, pageable);
        Page<EntryResponse> responsePage = page.map(EntryResponse::fromEntity);
        return PageResponse.from(responsePage);
    }

    public PageResponse<EntryResponse> getEntriesByContentTypeSlug(String slug, Pageable pageable) {
        Page<Entry> page = entryRepository.findByContentTypeSlug(slug, pageable);
        Page<EntryResponse> responsePage = page.map(EntryResponse::fromEntity);
        return PageResponse.from(responsePage);
    }

    public PageResponse<EntryResponse> getEntriesByStatus(String status, Pageable pageable) {
        Entry.Status entryStatus = Entry.Status.valueOf(status.toUpperCase());
        Page<Entry> page = entryRepository.findByStatus(entryStatus, pageable);
        Page<EntryResponse> responsePage = page.map(EntryResponse::fromEntity);
        return PageResponse.from(responsePage);
    }

    public EntryResponse getEntryById(Long id) {
        Entry entry = entryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Entry not found with id: " + id));
        return EntryResponse.fromEntity(entry);
    }

    public EntryResponse getEntryBySlug(String slug) {
        Entry entry = entryRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Entry not found with slug: " + slug));
        return EntryResponse.fromEntity(entry);
    }

    @Transactional
    public EntryResponse createEntry(EntryRequest request, User createdBy) {
        ContentType contentType = contentTypeService.findById(request.getContentTypeId());

        String slug = generateSlug(request.getTitle(), request.getSlug());
        if (entryRepository.existsBySlug(slug)) {
            slug = slug + "-" + System.currentTimeMillis();
        }

        Entry.Status status = Entry.Status.DRAFT;
        if (request.getStatus() != null) {
            status = Entry.Status.valueOf(request.getStatus().toUpperCase());
        }

        Entry entry = Entry.builder()
                .title(request.getTitle())
                .slug(slug)
                .content(request.getContent())
                .status(status)
                .contentType(contentType)
                .createdBy(createdBy)
                .version(1)
                .build();

        if (status == Entry.Status.PUBLISHED) {
            entry.setPublishedAt(LocalDateTime.now());
        }

        Entry savedEntry = entryRepository.save(entry);
        return EntryResponse.fromEntity(savedEntry);
    }

    @Transactional
    public EntryResponse updateEntry(Long id, EntryRequest request, User updatedBy) {
        Entry entry = entryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Entry not found with id: " + id));

        if (request.getTitle() != null) {
            entry.setTitle(request.getTitle());
        }

        if (request.getSlug() != null && !request.getSlug().equals(entry.getSlug())) {
            String newSlug = generateSlug(request.getTitle(), request.getSlug());
            Long workspaceId = entry.getWorkspace() != null ? entry.getWorkspace().getId() : null;
            
            if (workspaceId != null && entryRepository.existsByWorkspaceIdAndSlug(workspaceId, newSlug)) {
                throw new DuplicateResourceException("Entry with slug '" + newSlug + "' already exists in this workspace");
            } else if (entryRepository.existsBySlug(newSlug)) {
                throw new DuplicateResourceException("Entry with slug '" + newSlug + "' already exists");
            }
            entry.setSlug(newSlug);
        }

        if (request.getContent() != null) {
            entry.setContent(request.getContent());
        }

        if (request.getStatus() != null) {
            Entry.Status newStatus = Entry.Status.valueOf(request.getStatus().toUpperCase());
            if (newStatus == Entry.Status.PUBLISHED && entry.getStatus() != Entry.Status.PUBLISHED) {
                entry.setPublishedAt(LocalDateTime.now());
            }
            entry.setStatus(newStatus);
        }

        if (request.getContentTypeId() != null && !request.getContentTypeId().equals(entry.getContentType().getId())) {
            ContentType contentType = contentTypeService.findById(request.getContentTypeId());
            entry.setContentType(contentType);
        }

        entry.setUpdatedBy(updatedBy);
        entry.setVersion(entry.getVersion() + 1);

        Entry savedEntry = entryRepository.save(entry);
        return EntryResponse.fromEntity(savedEntry);
    }

    @Transactional
    public EntryResponse publishEntry(Long id, User updatedBy) {
        Entry entry = entryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Entry not found with id: " + id));

        entry.setStatus(Entry.Status.PUBLISHED);
        entry.setPublishedAt(LocalDateTime.now());
        entry.setUpdatedBy(updatedBy);

        Entry savedEntry = entryRepository.save(entry);
        return EntryResponse.fromEntity(savedEntry);
    }

    @Transactional
    public EntryResponse unpublishEntry(Long id, User updatedBy) {
        Entry entry = entryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Entry not found with id: " + id));

        entry.setStatus(Entry.Status.DRAFT);
        entry.setUpdatedBy(updatedBy);

        Entry savedEntry = entryRepository.save(entry);
        return EntryResponse.fromEntity(savedEntry);
    }

    @Transactional
    public void deleteEntry(Long id) {
        if (!entryRepository.existsById(id)) {
            throw new ResourceNotFoundException("Entry not found with id: " + id);
        }
        entryRepository.deleteById(id);
    }

    public PageResponse<EntryResponse> searchEntries(String search, Pageable pageable) {
        Page<Entry> page = entryRepository.searchByTitleOrContent(search, pageable);
        Page<EntryResponse> responsePage = page.map(EntryResponse::fromEntity);
        return PageResponse.from(responsePage);
    }

    public PageResponse<EntryResponse> searchEntriesInContentType(Long contentTypeId, String search, Pageable pageable) {
        Page<Entry> page = entryRepository.searchByTitleOrContentInContentType(contentTypeId, search, pageable);
        Page<EntryResponse> responsePage = page.map(EntryResponse::fromEntity);
        return PageResponse.from(responsePage);
    }

    public long countEntries() {
        return entryRepository.count();
    }

    public long countEntriesByStatus(String status) {
        return entryRepository.countByStatus(Entry.Status.valueOf(status.toUpperCase()));
    }

    public List<EntryResponse> getRecentEntries() {
        return entryRepository.findTop10ByOrderByCreatedAtDesc().stream()
                .map(EntryResponse::fromEntitySimple)
                .collect(Collectors.toList());
    }

    public Entry findById(Long id) {
        return entryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Entry not found with id: " + id));
    }

    // Public API methods
    public PageResponse<EntryResponse> getPublishedEntriesByContentType(String contentTypeSlug, Pageable pageable) {
        Page<Entry> page = entryRepository.findPublishedByContentTypeSlug(contentTypeSlug, pageable);
        Page<EntryResponse> responsePage = page.map(EntryResponse::fromEntitySimple);
        return PageResponse.from(responsePage);
    }

    public EntryResponse getPublishedEntryBySlug(String slug) {
        Entry entry = entryRepository.findPublishedBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Published entry not found with slug: " + slug));
        return EntryResponse.fromEntitySimple(entry);
    }

    public PageResponse<EntryResponse> getPublishedEntriesByWorkspaceAndContentType(Long workspaceId, String contentTypeSlug, Pageable pageable) {
        Page<Entry> page = entryRepository.findPublishedByWorkspaceIdAndContentTypeSlug(workspaceId, contentTypeSlug, pageable);
        Page<EntryResponse> responsePage = page.map(EntryResponse::fromEntitySimple);
        return PageResponse.from(responsePage);
    }

    public EntryResponse getPublishedEntryByWorkspaceAndSlug(Long workspaceId, String slug) {
        Entry entry = entryRepository.findPublishedByWorkspaceIdAndSlug(workspaceId, slug)
                .orElseThrow(() -> new ResourceNotFoundException("Published entry not found with slug: " + slug));
        return EntryResponse.fromEntitySimple(entry);
    }

    private String generateSlug(String title, String customSlug) {
        if (customSlug != null && !customSlug.isBlank()) {
            return customSlug.toLowerCase()
                    .replaceAll("[^a-z0-9\\s-]", "")
                    .replaceAll("\\s+", "-")
                    .replaceAll("-+", "-")
                    .replaceAll("^-|-$", "");
        }

        return title.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
    }
}
