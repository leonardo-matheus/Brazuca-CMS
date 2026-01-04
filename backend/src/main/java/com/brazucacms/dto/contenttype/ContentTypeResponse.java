package com.brazucacms.dto.contenttype;

import com.brazucacms.model.ContentType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContentTypeResponse {

    private Long id;
    private Long workspaceId;
    private String name;
    private String displayName;
    private String slug;
    private String description;
    private String icon;
    private String fields;
    private ContentType.ContentTypeStatus status;
    private Boolean active;
    private Integer fieldCount;
    private Long entryCount;
    private Long createdById;
    private String createdByName;
    private LocalDateTime publishedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ContentTypeResponse fromEntity(ContentType contentType) {
        return ContentTypeResponse.builder()
                .id(contentType.getId())
                .workspaceId(contentType.getWorkspace() != null ? contentType.getWorkspace().getId() : null)
                .name(contentType.getName())
                .displayName(contentType.getDisplayName())
                .slug(contentType.getSlug())
                .description(contentType.getDescription())
                .icon(contentType.getIcon())
                .fields(contentType.getFields())
                .status(contentType.getStatus())
                .active(contentType.getActive())
                .fieldCount(contentType.getFieldCount())
                .entryCount((long) contentType.getEntries().size())
                .createdById(contentType.getCreatedBy() != null ? contentType.getCreatedBy().getId() : null)
                .createdByName(contentType.getCreatedBy() != null ? contentType.getCreatedBy().getName() : null)
                .publishedAt(contentType.getPublishedAt())
                .createdAt(contentType.getCreatedAt())
                .updatedAt(contentType.getUpdatedAt())
                .build();
    }

    public static ContentTypeResponse fromEntitySimple(ContentType contentType, Long entriesCount) {
        return ContentTypeResponse.builder()
                .id(contentType.getId())
                .workspaceId(contentType.getWorkspace() != null ? contentType.getWorkspace().getId() : null)
                .name(contentType.getName())
                .displayName(contentType.getDisplayName())
                .slug(contentType.getSlug())
                .description(contentType.getDescription())
                .icon(contentType.getIcon())
                .fields(contentType.getFields())
                .status(contentType.getStatus())
                .active(contentType.getActive())
                .fieldCount(contentType.getFieldCount())
                .entryCount(entriesCount)
                .createdById(contentType.getCreatedBy() != null ? contentType.getCreatedBy().getId() : null)
                .publishedAt(contentType.getPublishedAt())
                .createdAt(contentType.getCreatedAt())
                .updatedAt(contentType.getUpdatedAt())
                .build();
    }
}
