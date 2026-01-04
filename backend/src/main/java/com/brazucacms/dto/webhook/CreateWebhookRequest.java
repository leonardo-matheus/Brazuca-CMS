package com.brazucacms.dto.webhook;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
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
public class CreateWebhookRequest {
    
    @NotBlank(message = "URL is required")
    @URL(message = "Invalid URL format")
    private String url;
    
    @NotEmpty(message = "At least one event is required")
    private List<String> events;
    
    private String description;
}
