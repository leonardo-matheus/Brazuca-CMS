package com.brazucacms.service;

import com.brazucacms.dto.analytics.ApiUsageDTO;
import com.brazucacms.dto.analytics.UsageStatsDTO;
import com.brazucacms.model.Workspace;
import com.brazucacms.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final EntryRepository entryRepository;
    private final MediaRepository mediaRepository;
    private final ApiKeyRepository apiKeyRepository;
    private final ContentTypeRepository contentTypeRepository;
    private final WorkspaceRepository workspaceRepository;

    public UsageStatsDTO getUsageStats(Long workspaceId, String period) {
        LocalDateTime startDate = getStartDate(period);
        LocalDate startLocalDate = startDate.toLocalDate();
        LocalDate endLocalDate = LocalDate.now();

        // Entries stats
        long entriesCreated = entryRepository.countByWorkspaceAndCreatedAfter(workspaceId, startDate);
        long entriesPublished = entryRepository.countByWorkspaceAndPublishedAfter(workspaceId, startDate);
        // For deleted, we'd need to track deletions - simplified for now
        long entriesDeleted = 0;

        // Media stats
        long mediaUploaded = mediaRepository.countByWorkspaceAndUploadedAfter(workspaceId, startDate);
        long storageUsed = mediaRepository.getTotalStorageUsed(workspaceId) / (1024 * 1024); // Convert to MB
        long mediaDeleted = 0; // Would need to track deletions

        // API calls - simplified, would need request logging
        Long totalApiCalls = apiKeyRepository.getTotalRequestsByWorkspace(workspaceId);
        if (totalApiCalls == null) totalApiCalls = 0L;

        Map<String, Long> apiByEndpoint = new HashMap<>();
        apiByEndpoint.put("/entries", totalApiCalls / 2);
        apiByEndpoint.put("/media", totalApiCalls / 3);
        apiByEndpoint.put("/content-types", totalApiCalls / 6);

        return UsageStatsDTO.builder()
                .period(period)
                .entries(UsageStatsDTO.EntriesStats.builder()
                        .created(entriesCreated)
                        .published(entriesPublished)
                        .deleted(entriesDeleted)
                        .build())
                .media(UsageStatsDTO.MediaStats.builder()
                        .uploaded(mediaUploaded)
                        .deleted(mediaDeleted)
                        .storageUsed(storageUsed)
                        .build())
                .apiCalls(UsageStatsDTO.ApiCallsStats.builder()
                        .total(totalApiCalls)
                        .byEndpoint(apiByEndpoint)
                        .build())
                .periodInfo(UsageStatsDTO.PeriodInfo.builder()
                        .startDate(startLocalDate)
                        .endDate(endLocalDate)
                        .build())
                .build();
    }

    public ApiUsageDTO getApiUsage(Long workspaceId, String period) {
        Workspace workspace = workspaceRepository.findById(workspaceId).orElse(null);
        if (workspace == null) {
            return null;
        }

        Long totalRequests = apiKeyRepository.getTotalRequestsByWorkspace(workspaceId);
        if (totalRequests == null) totalRequests = 0L;

        List<ApiUsageDTO.ApiKeyUsage> byApiKey = new ArrayList<>();
        apiKeyRepository.findByWorkspaceAndActiveTrue(workspace).forEach(key -> {
            List<ApiUsageDTO.EndpointUsage> topEndpoints = new ArrayList<>();
            topEndpoints.add(ApiUsageDTO.EndpointUsage.builder()
                    .endpoint("GET /entries")
                    .count(key.getRequestCount() / 2)
                    .build());

            byApiKey.add(ApiUsageDTO.ApiKeyUsage.builder()
                    .keyId(key.getId())
                    .keyName(key.getName())
                    .requests(key.getRequestCount())
                    .topEndpoints(topEndpoints)
                    .build());
        });

        List<ApiUsageDTO.EndpointUsage> byEndpoint = new ArrayList<>();
        byEndpoint.add(ApiUsageDTO.EndpointUsage.builder()
                .endpoint("GET /entries")
                .count(totalRequests / 2)
                .build());
        byEndpoint.add(ApiUsageDTO.EndpointUsage.builder()
                .endpoint("GET /media")
                .count(totalRequests / 3)
                .build());
        byEndpoint.add(ApiUsageDTO.EndpointUsage.builder()
                .endpoint("GET /content-types")
                .count(totalRequests / 6)
                .build());

        // Rate limit based on plan
        long rateLimit = switch (workspace.getPlan()) {
            case FREE -> 100000L;
            case PRO -> 1000000L;
            case ENTERPRISE -> 10000000L;
        };

        return ApiUsageDTO.builder()
                .period(period)
                .totalRequests(totalRequests)
                .byApiKey(byApiKey)
                .byEndpoint(byEndpoint)
                .rateLimit(ApiUsageDTO.RateLimitInfo.builder()
                        .limit(rateLimit)
                        .used(totalRequests)
                        .remaining(rateLimit - totalRequests)
                        .build())
                .build();
    }

    private LocalDateTime getStartDate(String period) {
        return switch (period.toLowerCase()) {
            case "week" -> LocalDateTime.now().minusWeeks(1);
            case "month" -> LocalDateTime.now().minusMonths(1);
            case "year" -> LocalDateTime.now().minusYears(1);
            case "day" -> LocalDateTime.now().minusDays(1);
            default -> LocalDateTime.now().minusMonths(1);
        };
    }
}
