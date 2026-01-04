package com.brazucacms.dto.entry;

import com.brazucacms.dto.contenttype.ContentTypeResponse;
import com.brazucacms.model.Entry;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EntryResponse {

    private Long id;
    private Long workspaceId;
    private Long contentTypeId;
    private String title;
    private String slug;
    private String content; // JSON data
    private String status;
    private Integer version;
    private LocalDateTime publishedAt;
    private ContentTypeResponse contentType;
    private Long createdById;
    private String createdByName;
    private Long updatedById;
    private String updatedByName;
    private List<EntryHistoryDTO> history;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static EntryResponse fromEntity(Entry entry) {
        return EntryResponse.builder()
                .id(entry.getId())
                .workspaceId(entry.getWorkspace() != null ? entry.getWorkspace().getId() : null)
                .contentTypeId(entry.getContentType() != null ? entry.getContentType().getId() : null)
                .title(entry.getTitle())
                .slug(entry.getSlug())
                .content(entry.getContent())
                .status(entry.getStatus().name())
                .version(entry.getVersion())
                .publishedAt(entry.getPublishedAt())
                .contentType(entry.getContentType() != null ?
                        ContentTypeResponse.fromEntitySimple(entry.getContentType(), null) : null)
                .createdById(entry.getCreatedBy() != null ? entry.getCreatedBy().getId() : null)
                .createdByName(entry.getCreatedBy() != null ? entry.getCreatedBy().getName() : null)
                .updatedById(entry.getUpdatedBy() != null ? entry.getUpdatedBy().getId() : null)
                .updatedByName(entry.getUpdatedBy() != null ? entry.getUpdatedBy().getName() : null)
                .createdAt(entry.getCreatedAt())
                .updatedAt(entry.getUpdatedAt())
                .build();
    }

    public static EntryResponse fromEntitySimple(Entry entry) {
        return EntryResponse.builder()
                .id(entry.getId())
                .workspaceId(entry.getWorkspace() != null ? entry.getWorkspace().getId() : null)
                .contentTypeId(entry.getContentType() != null ? entry.getContentType().getId() : null)
                .title(entry.getTitle())
                .slug(entry.getSlug())
                .content(entry.getContent())
                .status(entry.getStatus().name())
                .version(entry.getVersion())
                .publishedAt(entry.getPublishedAt())
                .createdById(entry.getCreatedBy() != null ? entry.getCreatedBy().getId() : null)
                .createdByName(entry.getCreatedBy() != null ? entry.getCreatedBy().getName() : null)
                .createdAt(entry.getCreatedAt())
                .updatedAt(entry.getUpdatedAt())
                .build();
    }
}
