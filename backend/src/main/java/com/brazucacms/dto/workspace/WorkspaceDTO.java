package com.brazucacms.dto.workspace;

import com.brazucacms.model.Workspace;
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
public class WorkspaceDTO {
    private Long id;
    private String name;
    private String slug;
    private String description;
    private String customUrl;
    private String timezone;
    private Workspace.Plan plan;
    private Long ownerId;
    private String ownerName;
    private String ownerEmail;
    private Integer memberCount;
    private StorageInfo storage;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StorageInfo {
        private Long used;
        private Long limit;
        private String unit;
        private Integer percentage;
    }
}
