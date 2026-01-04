package com.brazucacms.dto.social;

import com.brazucacms.model.SocialMediaAccount;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SocialMediaAccountResponse {
    private Long id;
    private String platform;
    private String accountUsername;
    private String platformAccountId;
    private String profilePictureUrl;
    private Long followersCount;
    private String status;
    private boolean tokenValid;
    private LocalDateTime tokenExpiresAt;
    private LocalDateTime lastPostAt;
    private Integer totalPosts;
    private LocalDateTime createdAt;

    public static SocialMediaAccountResponse fromEntity(SocialMediaAccount account) {
        return SocialMediaAccountResponse.builder()
                .id(account.getId())
                .platform(account.getPlatform().name())
                .accountUsername(account.getAccountUsername())
                .platformAccountId(account.getPlatformAccountId())
                .profilePictureUrl(account.getProfilePictureUrl())
                .followersCount(account.getFollowersCount())
                .status(account.getStatus().name())
                .tokenValid(account.hasValidToken())
                .tokenExpiresAt(account.getTokenExpiresAt())
                .lastPostAt(account.getLastPostAt())
                .totalPosts(account.getTotalPosts())
                .createdAt(account.getCreatedAt())
                .build();
    }
}
