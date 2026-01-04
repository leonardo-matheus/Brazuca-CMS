package com.brazucacms.dto.entry;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EntryHistoryDTO {
    private Long id;
    private Integer version;
    private String changes;
    private Long changedById;
    private String changedByName;
    private LocalDateTime changedAt;
    private Object snapshot;
}
