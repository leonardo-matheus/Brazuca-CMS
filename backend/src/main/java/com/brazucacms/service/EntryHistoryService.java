package com.brazucacms.service;

import com.brazucacms.dto.entry.EntryHistoryDTO;
import com.brazucacms.dto.entry.EntryResponse;
import com.brazucacms.exception.ResourceNotFoundException;
import com.brazucacms.model.Entry;
import com.brazucacms.model.EntryHistory;
import com.brazucacms.model.User;
import com.brazucacms.repository.EntryHistoryRepository;
import com.brazucacms.repository.EntryRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class EntryHistoryService {

    private final EntryHistoryRepository historyRepository;
    private final EntryRepository entryRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public void createHistoryEntry(Entry entry, String changes, User changedBy) {
        Integer currentVersion = historyRepository.findMaxVersionByEntryId(entry.getId()).orElse(0);
        
        Map<String, Object> snapshot = new HashMap<>();
        snapshot.put("title", entry.getTitle());
        snapshot.put("slug", entry.getSlug());
        snapshot.put("content", entry.getContent());
        snapshot.put("status", entry.getStatus().name());
        
        String snapshotJson;
        try {
            snapshotJson = objectMapper.writeValueAsString(snapshot);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize entry snapshot", e);
            snapshotJson = "{}";
        }

        EntryHistory history = EntryHistory.builder()
                .entry(entry)
                .version(currentVersion + 1)
                .changes(changes)
                .snapshot(snapshotJson)
                .changedBy(changedBy)
                .changedAt(LocalDateTime.now())
                .build();

        historyRepository.save(history);

        // Update entry version
        entry.setVersion(currentVersion + 1);
        entryRepository.save(entry);
    }

    public List<EntryHistoryDTO> getEntryHistory(Long entryId) {
        Entry entry = entryRepository.findById(entryId)
                .orElseThrow(() -> new ResourceNotFoundException("Entry not found"));

        return historyRepository.findByEntryOrderByVersionDesc(entry).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public Page<EntryHistoryDTO> getEntryHistory(Long entryId, Pageable pageable) {
        Entry entry = entryRepository.findById(entryId)
                .orElseThrow(() -> new ResourceNotFoundException("Entry not found"));

        return historyRepository.findByEntryOrderByVersionDesc(entry, pageable)
                .map(this::toDTO);
    }

    public EntryHistoryDTO getHistoryVersion(Long entryId, Integer version) {
        Entry entry = entryRepository.findById(entryId)
                .orElseThrow(() -> new ResourceNotFoundException("Entry not found"));

        EntryHistory history = historyRepository.findByEntryAndVersion(entry, version)
                .orElseThrow(() -> new ResourceNotFoundException("History version not found"));

        return toDTO(history);
    }

    public EntryHistoryDTO getEntryVersion(Long entryId, Integer version) {
        return getHistoryVersion(entryId, version);
    }

    @Transactional
    public EntryResponse restoreVersion(Long entryId, Integer version, User user) {
        Entry entry = entryRepository.findById(entryId)
                .orElseThrow(() -> new ResourceNotFoundException("Entry not found"));

        EntryHistory history = historyRepository.findByEntryAndVersion(entry, version)
                .orElseThrow(() -> new ResourceNotFoundException("History version not found"));

        // Parse snapshot
        try {
            Map<String, Object> snapshot = objectMapper.readValue(history.getSnapshot(), Map.class);
            
            entry.setTitle((String) snapshot.get("title"));
            entry.setSlug((String) snapshot.get("slug"));
            entry.setContent((String) snapshot.get("content"));
            // Don't restore status to allow review before publishing
            
            entry.setUpdatedBy(user);
            entry = entryRepository.save(entry);

            // Create new history entry for the restore
            createHistoryEntry(entry, "Restored from version " + version, user);

            return EntryResponse.fromEntity(entry);
        } catch (JsonProcessingException e) {
            log.error("Failed to parse history snapshot", e);
            throw new RuntimeException("Failed to restore entry version");
        }
    }

    private EntryHistoryDTO toDTO(EntryHistory history) {
        Object snapshot = null;
        if (history.getSnapshot() != null) {
            try {
                snapshot = objectMapper.readValue(history.getSnapshot(), Object.class);
            } catch (JsonProcessingException e) {
                snapshot = history.getSnapshot();
            }
        }

        return EntryHistoryDTO.builder()
                .id(history.getId())
                .version(history.getVersion())
                .changes(history.getChanges())
                .changedById(history.getChangedBy() != null ? history.getChangedBy().getId() : null)
                .changedByName(history.getChangedBy() != null ? history.getChangedBy().getName() : null)
                .changedAt(history.getChangedAt())
                .snapshot(snapshot)
                .build();
    }
}
