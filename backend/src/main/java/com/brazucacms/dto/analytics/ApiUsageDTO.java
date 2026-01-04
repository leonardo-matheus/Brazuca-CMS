package com.brazucacms.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiUsageDTO {
    private String period;
    private Long totalRequests;
    private List<ApiKeyUsage> byApiKey;
    private List<EndpointUsage> byEndpoint;
    private RateLimitInfo rateLimit;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ApiKeyUsage {
        private Long keyId;
        private String keyName;
        private Long requests;
        private List<EndpointUsage> topEndpoints;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EndpointUsage {
        private String endpoint;
        private Long count;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RateLimitInfo {
        private Long limit;
        private Long used;
        private Long remaining;
    }
}
