package com.brazucacms.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UsageStatsDTO {
    private String period;
    private EntriesStats entries;
    private MediaStats media;
    private ApiCallsStats apiCalls;
    private PeriodInfo periodInfo;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EntriesStats {
        private Long created;
        private Long published;
        private Long deleted;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MediaStats {
        private Long uploaded;
        private Long deleted;
        private Long storageUsed;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ApiCallsStats {
        private Long total;
        private Map<String, Long> byEndpoint;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PeriodInfo {
        private LocalDate startDate;
        private LocalDate endDate;
    }
}
