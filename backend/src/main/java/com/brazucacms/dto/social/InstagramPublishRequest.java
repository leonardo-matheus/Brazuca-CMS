package com.brazucacms.dto.social;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Request to publish content to Instagram
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InstagramPublishRequest {
    
    @NotNull(message = "Social account ID is required")
    private Long socialAccountId;
    
    /**
     * Caption for the post (max 2200 characters)
     */
    @NotBlank(message = "Caption is required")
    private String caption;
    
    /**
     * Public URL of the image/video to post
     * Must be accessible by Instagram servers
     */
    @NotBlank(message = "Media URL is required")
    private String mediaUrl;
    
    /**
     * Media type: IMAGE, VIDEO, CAROUSEL, REELS
     */
    private String mediaType;
    
    /**
     * Optional: Link entry to this post
     */
    private Long entryId;
    
    /**
     * Optional: Schedule post for later
     */
    private LocalDateTime scheduledAt;
    
    /**
     * For carousel posts: additional media URLs
     */
    private String[] additionalMediaUrls;
}
