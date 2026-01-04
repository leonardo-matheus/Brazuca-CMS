package com.brazucacms.dto.integration;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IntegrationConnectRequest {
    
    @NotNull(message = "Platform is required")
    private String platform;
    
    private String displayName;
    
    // OAuth callback code
    private String code;
    private String redirectUri;
    
    // API key based authentication
    private String apiKey;
    private String apiSecret;
    
    // Additional credentials/config
    private Map<String, String> credentials;
    private Map<String, Object> configuration;
}
