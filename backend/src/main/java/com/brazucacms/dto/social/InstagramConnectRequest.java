package com.brazucacms.dto.social;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request to connect an Instagram account using OAuth code
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InstagramConnectRequest {
    
    @NotBlank(message = "Authorization code is required")
    private String code;
    
    @NotBlank(message = "Redirect URI is required")
    private String redirectUri;
}
