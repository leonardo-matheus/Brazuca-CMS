package com.brazucacms.dto.entry;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EntryRequest {

    @NotBlank(message = "Title is required")
    @Size(min = 1, max = 200, message = "Title must be between 1 and 200 characters")
    private String title;

    private String slug;

    private String content; // JSON string with field values

    @NotNull(message = "Content type ID is required")
    private Long contentTypeId;

    private String status; // DRAFT, PUBLISHED, ARCHIVED
}
