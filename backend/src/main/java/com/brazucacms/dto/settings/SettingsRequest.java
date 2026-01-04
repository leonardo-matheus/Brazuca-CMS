package com.brazucacms.dto.settings;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SettingsRequest {

    @NotBlank(message = "Key is required")
    private String key;

    private String value;

    private String type; // string, number, boolean, json

    private String description;

    private String group;

    private Boolean isPublic;
}
