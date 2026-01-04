package com.brazucacms.dto.contenttype;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContentTypeRequest {

    @NotBlank(message = "Name is required")
    @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
    private String name;

    private String displayName;

    private String slug;

    @Size(max = 500, message = "Description must be at most 500 characters")
    private String description;

    private String icon;

    private String fields; // JSON string with field definitions
    
    private List<FieldDefinition> fieldDefinitions; // Structured field definitions
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FieldDefinition {
        private String id;
        private String name;
        private String type; // text, richtext, media, relation, array, number, boolean, date, etc
        private String displayName;
        private Boolean required;
        private Boolean unique;
        private Object validation; // JSON object with validation rules
        private String relationType; // For relation fields
        private Object items; // For array fields
    }
}
