package com.brazucacms.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration for Instagram/Meta API integration
 */
@Configuration
@ConfigurationProperties(prefix = "instagram")
@Data
public class InstagramConfig {

    /**
     * Facebook/Meta App ID
     */
    private String appId;

    /**
     * Facebook/Meta App Secret
     */
    private String appSecret;

    /**
     * OAuth redirect URI
     */
    private String redirectUri;

    /**
     * Instagram Graph API version
     */
    private String apiVersion = "v18.0";

    /**
     * Base URL for Instagram Graph API
     */
    public String getGraphApiUrl() {
        return "https://graph.facebook.com/" + apiVersion;
    }

    /**
     * Instagram Basic Display API URL
     */
    public String getInstagramApiUrl() {
        return "https://api.instagram.com";
    }
}
