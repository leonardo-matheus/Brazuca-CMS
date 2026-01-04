package com.brazucacms.repository;

import com.brazucacms.model.Entry;
import com.brazucacms.model.Workspace;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface EntryRepository extends JpaRepository<Entry, Long> {

    Optional<Entry> findBySlug(String slug);
    
    Optional<Entry> findByWorkspaceAndSlug(Workspace workspace, String slug);
    
    Optional<Entry> findByWorkspaceIdAndSlug(Long workspaceId, String slug);

    boolean existsBySlug(String slug);
    
    boolean existsByWorkspaceAndSlug(Workspace workspace, String slug);
    
    boolean existsByWorkspaceIdAndSlug(Long workspaceId, String slug);
    
    Page<Entry> findByWorkspace(Workspace workspace, Pageable pageable);
    
    Page<Entry> findByWorkspaceId(@Param("workspaceId") Long workspaceId, Pageable pageable);
    
    Page<Entry> findByWorkspaceAndStatus(Workspace workspace, Entry.Status status, Pageable pageable);
    
    Page<Entry> findByWorkspaceIdAndStatus(Long workspaceId, Entry.Status status, Pageable pageable);

    Page<Entry> findByContentTypeId(Long contentTypeId, Pageable pageable);
    
    Page<Entry> findByWorkspaceIdAndContentTypeId(Long workspaceId, Long contentTypeId, Pageable pageable);
    
    Page<Entry> findByWorkspaceIdAndContentTypeSlug(Long workspaceId, String contentTypeSlug, Pageable pageable);

    Page<Entry> findByContentTypeSlug(String contentTypeSlug, Pageable pageable);

    Page<Entry> findByStatus(Entry.Status status, Pageable pageable);

    Page<Entry> findByContentTypeIdAndStatus(Long contentTypeId, Entry.Status status, Pageable pageable);
    
    Page<Entry> findByWorkspaceIdAndContentTypeIdAndStatus(Long workspaceId, Long contentTypeId, Entry.Status status, Pageable pageable);

    @Query("SELECT e FROM Entry e WHERE e.workspace.id = :workspaceId AND " +
           "(LOWER(e.title) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(e.content) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Entry> searchByWorkspaceAndTitleOrContent(@Param("workspaceId") Long workspaceId, @Param("search") String search, Pageable pageable);

    @Query("SELECT e FROM Entry e WHERE " +
           "(LOWER(e.title) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(e.content) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Entry> searchByTitleOrContent(@Param("search") String search, Pageable pageable);

    @Query("SELECT e FROM Entry e WHERE e.workspace.id = :workspaceId AND e.contentType.id = :contentTypeId AND " +
           "(LOWER(e.title) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(e.content) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Entry> searchByWorkspaceAndContentTypeAndTitleOrContent(@Param("workspaceId") Long workspaceId,
                                                                  @Param("contentTypeId") Long contentTypeId,
                                                                  @Param("search") String search,
                                                                  Pageable pageable);

    @Query("SELECT e FROM Entry e WHERE e.contentType.id = :contentTypeId AND " +
           "(LOWER(e.title) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(e.content) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Entry> searchByTitleOrContentInContentType(@Param("contentTypeId") Long contentTypeId,
                                                     @Param("search") String search,
                                                     Pageable pageable);

    long countByStatus(Entry.Status status);

    long countByContentTypeId(Long contentTypeId);
    
    long countByWorkspaceId(Long workspaceId);
    
    long countByWorkspaceIdAndStatus(Long workspaceId, Entry.Status status);
    
    @Query("SELECT COUNT(e) FROM Entry e WHERE e.workspace.id = :workspaceId")
    long countByWorkspace(@Param("workspaceId") Long workspaceId);
    
    @Query("SELECT COUNT(e) FROM Entry e WHERE e.workspace.id = :workspaceId AND e.status = :status")
    long countByWorkspaceAndStatus(@Param("workspaceId") Long workspaceId, @Param("status") Entry.Status status);

    @Query("SELECT COUNT(e) FROM Entry e WHERE e.createdAt >= :startDate")
    long countEntriesCreatedAfter(@Param("startDate") LocalDateTime startDate);
    
    @Query("SELECT COUNT(e) FROM Entry e WHERE e.workspace.id = :workspaceId AND e.createdAt >= :startDate")
    long countByWorkspaceAndCreatedAfter(@Param("workspaceId") Long workspaceId, @Param("startDate") LocalDateTime startDate);
    
    @Query("SELECT COUNT(e) FROM Entry e WHERE e.workspace.id = :workspaceId AND e.status = 'PUBLISHED' AND e.publishedAt >= :startDate")
    long countByWorkspaceAndPublishedAfter(@Param("workspaceId") Long workspaceId, @Param("startDate") LocalDateTime startDate);

    @Query("SELECT FUNCTION('MONTH', e.createdAt) as month, COUNT(e) FROM Entry e " +
           "WHERE e.createdAt >= :startDate GROUP BY FUNCTION('MONTH', e.createdAt)")
    List<Object[]> countEntriesByMonth(@Param("startDate") LocalDateTime startDate);

    List<Entry> findTop10ByOrderByCreatedAtDesc();
    
    List<Entry> findTop10ByWorkspaceOrderByCreatedAtDesc(Workspace workspace);
    
    List<Entry> findTop10ByWorkspaceIdOrderByCreatedAtDesc(Long workspaceId);

    // For public API
    @Query("SELECT e FROM Entry e WHERE e.workspace.id = :workspaceId AND e.status = 'PUBLISHED' AND e.contentType.slug = :contentTypeSlug")
    Page<Entry> findPublishedByWorkspaceAndContentTypeSlug(@Param("workspaceId") Long workspaceId, @Param("contentTypeSlug") String contentTypeSlug, Pageable pageable);
    
    @Query("SELECT e FROM Entry e WHERE e.workspace.id = :workspaceId AND e.status = 'PUBLISHED' AND e.contentType.slug = :contentTypeSlug")
    Page<Entry> findPublishedByWorkspaceIdAndContentTypeSlug(@Param("workspaceId") Long workspaceId, @Param("contentTypeSlug") String contentTypeSlug, Pageable pageable);

    @Query("SELECT e FROM Entry e WHERE e.status = 'PUBLISHED' AND e.contentType.slug = :contentTypeSlug")
    Page<Entry> findPublishedByContentTypeSlug(@Param("contentTypeSlug") String contentTypeSlug, Pageable pageable);

    @Query("SELECT e FROM Entry e WHERE e.workspace.id = :workspaceId AND e.status = 'PUBLISHED' AND e.slug = :slug")
    Optional<Entry> findPublishedByWorkspaceAndSlug(@Param("workspaceId") Long workspaceId, @Param("slug") String slug);
    
    @Query("SELECT e FROM Entry e WHERE e.workspace.id = :workspaceId AND e.status = 'PUBLISHED' AND e.slug = :slug")
    Optional<Entry> findPublishedByWorkspaceIdAndSlug(@Param("workspaceId") Long workspaceId, @Param("slug") String slug);

    @Query("SELECT e FROM Entry e WHERE e.status = 'PUBLISHED' AND e.slug = :slug")
    Optional<Entry> findPublishedBySlug(@Param("slug") String slug);
}
