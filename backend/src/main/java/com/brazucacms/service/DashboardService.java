package com.brazucacms.service;

import com.brazucacms.dto.dashboard.DashboardStats;
import com.brazucacms.model.Entry;
import com.brazucacms.repository.ContentTypeRepository;
import com.brazucacms.repository.EntryRepository;
import com.brazucacms.repository.MediaRepository;
import com.brazucacms.repository.ApiKeyRepository;
import com.brazucacms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardService {

    private final EntryRepository entryRepository;
    private final ContentTypeRepository contentTypeRepository;
    private final MediaRepository mediaRepository;
    private final ApiKeyRepository apiKeyRepository;
    private final UserRepository userRepository;

    public DashboardStats getDashboardStats() {
        // Basic counts
        long totalEntries = entryRepository.count();
        long publishedEntries = entryRepository.countByStatus(Entry.Status.PUBLISHED);
        long draftEntries = entryRepository.countByStatus(Entry.Status.DRAFT);
        long totalContentTypes = contentTypeRepository.count();
        long totalMedia = mediaRepository.count();
        long totalApiKeys = apiKeyRepository.countByActiveTrue();
        long totalUsers = userRepository.count();

        // Content type stats
        List<DashboardStats.ContentTypeStats> contentTypeStats = getContentTypeStats();

        // Recent activities
        List<DashboardStats.RecentActivity> recentActivities = getRecentActivities();

        // Entries by status
        Map<String, Long> entriesByStatus = new HashMap<>();
        entriesByStatus.put("DRAFT", draftEntries);
        entriesByStatus.put("PUBLISHED", publishedEntries);
        entriesByStatus.put("ARCHIVED", entryRepository.countByStatus(Entry.Status.ARCHIVED));

        // Entries by month (last 6 months)
        Map<String, Long> entriesByMonth = getEntriesByMonth();

        return DashboardStats.builder()
                .totalEntries(totalEntries)
                .publishedEntries(publishedEntries)
                .draftEntries(draftEntries)
                .totalContentTypes(totalContentTypes)
                .totalMedia(totalMedia)
                .totalApiKeys(totalApiKeys)
                .totalUsers(totalUsers)
                .contentTypeStats(contentTypeStats)
                .recentActivities(recentActivities)
                .entriesByStatus(entriesByStatus)
                .entriesByMonth(entriesByMonth)
                .build();
    }

    private List<DashboardStats.ContentTypeStats> getContentTypeStats() {
        List<Object[]> results = contentTypeRepository.findAllWithEntriesCount();
        return results.stream()
                .map(row -> DashboardStats.ContentTypeStats.builder()
                        .id((Long) row[0])
                        .name((String) row[1])
                        .slug((String) row[2])
                        .entriesCount((Long) row[3])
                        .build())
                .collect(Collectors.toList());
    }

    private List<DashboardStats.RecentActivity> getRecentActivities() {
        List<Entry> recentEntries = entryRepository.findTop10ByOrderByCreatedAtDesc();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

        return recentEntries.stream()
                .map(entry -> DashboardStats.RecentActivity.builder()
                        .type(entry.getStatus() == Entry.Status.PUBLISHED ? "ENTRY_PUBLISHED" : "ENTRY_CREATED")
                        .title(entry.getTitle())
                        .description("Entry " + (entry.getStatus() == Entry.Status.PUBLISHED ? "published" : "created"))
                        .userName(entry.getCreatedBy() != null ? entry.getCreatedBy().getName() : "System")
                        .timestamp(entry.getCreatedAt().format(formatter))
                        .build())
                .collect(Collectors.toList());
    }

    private Map<String, Long> getEntriesByMonth() {
        LocalDateTime sixMonthsAgo = LocalDateTime.now().minusMonths(6);
        List<Object[]> results = entryRepository.countEntriesByMonth(sixMonthsAgo);

        Map<String, Long> entriesByMonth = new LinkedHashMap<>();
        String[] monthNames = {"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"};

        // Initialize all months with 0
        LocalDateTime now = LocalDateTime.now();
        for (int i = 5; i >= 0; i--) {
            LocalDateTime month = now.minusMonths(i);
            entriesByMonth.put(monthNames[month.getMonthValue() - 1], 0L);
        }

        // Fill in actual counts
        for (Object[] row : results) {
            Integer monthNum = (Integer) row[0];
            Long count = (Long) row[1];
            if (monthNum != null && monthNum >= 1 && monthNum <= 12) {
                entriesByMonth.put(monthNames[monthNum - 1], count);
            }
        }

        return entriesByMonth;
    }
}
