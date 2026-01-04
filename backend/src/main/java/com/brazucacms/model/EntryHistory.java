package com.brazucacms.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "entry_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EntryHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entry_id", nullable = false)
    private Entry entry;

    @Column(nullable = false)
    private Integer version;

    @Column(columnDefinition = "TEXT")
    private String changes; // Description of what changed

    @Column(columnDefinition = "TEXT", nullable = false)
    private String snapshot; // JSON snapshot of the entry at this version

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "changed_by")
    private User changedBy;

    @Column(name = "changed_at", nullable = false)
    private LocalDateTime changedAt;

    @PrePersist
    protected void onCreate() {
        if (changedAt == null) {
            changedAt = LocalDateTime.now();
        }
    }
}
