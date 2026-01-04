package com.brazucacms.repository;

import com.brazucacms.model.Entry;
import com.brazucacms.model.EntryHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EntryHistoryRepository extends JpaRepository<EntryHistory, Long> {
    
    List<EntryHistory> findByEntry(Entry entry);
    
    List<EntryHistory> findByEntryOrderByVersionDesc(Entry entry);
    
    Page<EntryHistory> findByEntryOrderByVersionDesc(Entry entry, Pageable pageable);
    
    Optional<EntryHistory> findByEntryAndVersion(Entry entry, Integer version);
    
    @Query("SELECT MAX(eh.version) FROM EntryHistory eh WHERE eh.entry.id = :entryId")
    Optional<Integer> findMaxVersionByEntryId(@Param("entryId") Long entryId);
    
    @Query("SELECT eh FROM EntryHistory eh WHERE eh.entry.id = :entryId ORDER BY eh.version DESC")
    List<EntryHistory> findLatestHistory(@Param("entryId") Long entryId, Pageable pageable);
    
    void deleteByEntry(Entry entry);
}
