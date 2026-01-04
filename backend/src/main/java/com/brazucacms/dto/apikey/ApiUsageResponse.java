package com.brazucacms.dto.apikey;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiUsageResponse {
    private long totalRequests;
    private int rateLimit;
    private int rateLimitRemaining;
    private long requestsThisMonth;
    private long monthlyLimit;
}
