package com.brazucacms.dto.social;

import com.brazucacms.model.SocialMediaPost;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SocialMediaPostResponse {
    private Long id;
    private Long socialAccountId;
    private String platform;
    private String accountUsername;
    private Long entryId;
    private String entryTitle;
    private String platformPostId;
    private String status;
    private String caption;
    private String mediaUrl;
    private String mediaType;
    private String permalink;
    private String errorMessage;
    private LocalDateTime scheduledAt;
    private LocalDateTime publishedAt;
    private LocalDateTime createdAt;

    public static SocialMediaPostResponse fromEntity(SocialMediaPost post) {
        return SocialMediaPostResponse.builder()
                .id(post.getId())
                .socialAccountId(post.getSocialAccount().getId())
                .platform(post.getSocialAccount().getPlatform().name())
                .accountUsername(post.getSocialAccount().getAccountUsername())
                .entryId(post.getEntry() != null ? post.getEntry().getId() : null)
                .entryTitle(post.getEntry() != null ? post.getEntry().getTitle() : null)
                .platformPostId(post.getPlatformPostId())
                .status(post.getStatus().name())
                .caption(post.getCaption())
                .mediaUrl(post.getMediaUrl())
                .mediaType(post.getMediaType() != null ? post.getMediaType().name() : null)
                .permalink(post.getPermalink())
                .errorMessage(post.getErrorMessage())
                .scheduledAt(post.getScheduledAt())
                .publishedAt(post.getPublishedAt())
                .createdAt(post.getCreatedAt())
                .build();
    }
}
