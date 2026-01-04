package com.brazucacms.dto.webhook;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WebhookTestResponse {
    private Integer statusCode;
    private Long responseTime;
    private String message;
    private Object payload;
}
