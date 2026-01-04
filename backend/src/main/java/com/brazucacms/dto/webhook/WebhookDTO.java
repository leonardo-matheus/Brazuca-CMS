package com.brazucacms.dto.webhook;

import com.brazucacms.model.Webhook;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WebhookDTO {
    private Long id;
    private String url;
    private String description;
    private List<String> events;
    private Webhook.WebhookStatus status;
    private Integer failureCount;
    private LocalDateTime lastFailedAt;
    private LocalDateTime lastSuccessAt;
    private LocalDateTime createdAt;
    private String testUrl;
}
