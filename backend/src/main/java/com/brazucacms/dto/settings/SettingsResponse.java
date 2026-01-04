package com.brazucacms.dto.settings;

import com.brazucacms.model.Settings;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SettingsResponse {

    private Long id;
    private String key;
    private String value;
    private String type;
    private String description;
    private String group;
    private Boolean isPublic;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static SettingsResponse fromEntity(Settings settings) {
        return SettingsResponse.builder()
                .id(settings.getId())
                .key(settings.getKey())
                .value(settings.getValue())
                .type(settings.getType())
                .description(settings.getDescription())
                .group(settings.getGroup())
                .isPublic(settings.getIsPublic())
                .createdAt(settings.getCreatedAt())
                .updatedAt(settings.getUpdatedAt())
                .build();
    }
}
