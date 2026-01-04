package com.brazucacms.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStats {

    private Long totalEntries;
    private Long publishedEntries;
    private Long draftEntries;
    private Long totalContentTypes;
    private Long totalMedia;
    private Long totalApiKeys;
    private Long totalUsers;
    
    private List<ContentTypeStats> contentTypeStats;
    private List<RecentActivity> recentActivities;
    private Map<String, Long> entriesByStatus;
    private Map<String, Long> entriesByMonth;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ContentTypeStats {
        private Long id;
        private String name;
        private String slug;
        private Long entriesCount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecentActivity {
        private String type; // ENTRY_CREATED, ENTRY_UPDATED, ENTRY_PUBLISHED, MEDIA_UPLOADED
        private String title;
        private String description;
        private String userName;
        private String timestamp;
    }
}
