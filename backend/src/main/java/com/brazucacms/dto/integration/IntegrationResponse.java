package com.brazucacms.dto.integration;

import com.brazucacms.model.Integration;
import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IntegrationResponse {
    private Long id;
    private String platform;
    private String platformDisplayName;
    private String category;
    private String categoryDisplayName;
    private String description;
    private String displayName;
    private String status;
    private boolean isActive;
    private boolean needsReconnect;
    private LocalDateTime lastSyncAt;
    private String lastSyncStatus;
    private String syncError;
    private LocalDateTime tokenExpiresAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Platform-specific metadata
    private Object metadata;

    public static IntegrationResponse fromEntity(Integration integration) {
        return IntegrationResponse.builder()
                .id(integration.getId())
                .platform(integration.getPlatform().name())
                .platformDisplayName(integration.getPlatform().getDisplayName())
                .category(integration.getPlatform().getCategory().name())
                .categoryDisplayName(integration.getPlatform().getCategory().getDisplayName())
                .description(integration.getPlatform().getDescription())
                .displayName(integration.getDisplayName())
                .status(integration.getStatus().name())
                .isActive(integration.isActive())
                .needsReconnect(integration.needsTokenRefresh() || integration.getStatus() == Integration.IntegrationStatus.EXPIRED)
                .lastSyncAt(integration.getLastSyncAt())
                .lastSyncStatus(integration.getLastSyncStatus())
                .syncError(integration.getSyncError())
                .tokenExpiresAt(integration.getTokenExpiresAt())
                .createdAt(integration.getCreatedAt())
                .updatedAt(integration.getUpdatedAt())
                .build();
    }
}
