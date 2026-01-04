package com.brazucacms.dto.webhook;

import com.brazucacms.model.WebhookLog;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WebhookLogDTO {
    private Long id;
    private String event;
    private Integer statusCode;
    private Long responseTime;
    private Integer attempt;
    private LocalDateTime timestamp;
    private Object payload;
    private WebhookLog.LogStatus status;
}
