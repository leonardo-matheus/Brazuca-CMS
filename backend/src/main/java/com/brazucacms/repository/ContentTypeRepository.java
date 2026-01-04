package com.brazucacms.repository;

import com.brazucacms.model.ContentType;
import com.brazucacms.model.Workspace;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ContentTypeRepository extends JpaRepository<ContentType, Long> {

    Optional<ContentType> findBySlug(String slug);
    
    Optional<ContentType> findByWorkspaceAndSlug(Workspace workspace, String slug);
    
    Optional<ContentType> findByWorkspaceIdAndSlug(Long workspaceId, String slug);

    boolean existsBySlug(String slug);
    
    boolean existsByWorkspaceAndSlug(Workspace workspace, String slug);
    
    boolean existsByWorkspaceIdAndSlug(Long workspaceId, String slug);

    Page<ContentType> findByActiveTrue(Pageable pageable);
    
    Page<ContentType> findByWorkspace(Workspace workspace, Pageable pageable);
    
    Page<ContentType> findByWorkspaceAndActiveTrue(Workspace workspace, Pageable pageable);
    
    Page<ContentType> findByWorkspaceIdAndActiveTrue(Long workspaceId, Pageable pageable);

    List<ContentType> findByActiveTrue();
    
    List<ContentType> findByWorkspace(Workspace workspace);
    
    List<ContentType> findByWorkspaceAndActiveTrue(Workspace workspace);
    
    List<ContentType> findByWorkspaceIdAndActiveTrue(Long workspaceId);

    @Query("SELECT ct FROM ContentType ct WHERE ct.workspace.id = :workspaceId AND ct.active = true AND " +
           "(LOWER(ct.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(ct.description) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<ContentType> searchByWorkspaceAndNameOrDescription(@Param("workspaceId") Long workspaceId, @Param("search") String search, Pageable pageable);

    @Query("SELECT ct FROM ContentType ct WHERE ct.active = true AND " +
           "(LOWER(ct.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(ct.description) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<ContentType> searchByNameOrDescription(String search, Pageable pageable);

    @Query("SELECT ct.id, ct.name, ct.slug, COUNT(e) FROM ContentType ct " +
           "LEFT JOIN ct.entries e WHERE ct.workspace.id = :workspaceId AND ct.active = true GROUP BY ct.id, ct.name, ct.slug")
    List<Object[]> findAllByWorkspaceWithEntriesCount(@Param("workspaceId") Long workspaceId);
    
    @Query("SELECT ct.id, ct.name, ct.slug, COUNT(e) FROM ContentType ct " +
           "LEFT JOIN ct.entries e WHERE ct.active = true GROUP BY ct.id, ct.name, ct.slug")
    List<Object[]> findAllWithEntriesCount();
    
    @Query("SELECT COUNT(ct) FROM ContentType ct WHERE ct.workspace.id = :workspaceId")
    Long countByWorkspace(@Param("workspaceId") Long workspaceId);
    
    Long countByWorkspaceIdAndActiveTrue(Long workspaceId);
    
    @Query("SELECT ct FROM ContentType ct WHERE ct.workspace.id = :workspaceId AND ct.status = :status")
    List<ContentType> findByWorkspaceAndStatus(@Param("workspaceId") Long workspaceId, @Param("status") ContentType.ContentTypeStatus status);
}
