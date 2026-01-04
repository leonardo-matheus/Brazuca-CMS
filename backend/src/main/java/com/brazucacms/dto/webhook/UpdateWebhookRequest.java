package com.brazucacms.dto.webhook;

import com.brazucacms.model.Webhook;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.validator.constraints.URL;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateWebhookRequest {
    
    @URL(message = "Invalid URL format")
    private String url;
    
    private List<String> events;
    
    private Webhook.WebhookStatus status;
    
    private String description;
}
