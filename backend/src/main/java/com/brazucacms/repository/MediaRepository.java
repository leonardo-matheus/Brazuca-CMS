package com.brazucacms.repository;

import com.brazucacms.model.Media;
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
public interface MediaRepository extends JpaRepository<Media, Long> {

    Optional<Media> findByFilename(String filename);
    
    Page<Media> findByWorkspace(Workspace workspace, Pageable pageable);
    
    Page<Media> findByWorkspaceId(Long workspaceId, Pageable pageable);
    
    Page<Media> findByWorkspaceAndFolder(Workspace workspace, String folder, Pageable pageable);
    
    Page<Media> findByWorkspaceIdAndFolder(Long workspaceId, String folder, Pageable pageable);

    Page<Media> findByType(Media.MediaType type, Pageable pageable);
    
    Page<Media> findByWorkspaceAndType(Workspace workspace, Media.MediaType type, Pageable pageable);
    
    Page<Media> findByWorkspaceIdAndType(Long workspaceId, Media.MediaType type, Pageable pageable);

    Page<Media> findByUploadedById(Long userId, Pageable pageable);

    @Query("SELECT m FROM Media m WHERE m.workspace.id = :workspaceId AND " +
           "(LOWER(m.originalFilename) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(m.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(m.altText) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(m.caption) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Media> searchByWorkspaceAndFilenameOrAltText(@Param("workspaceId") Long workspaceId, @Param("search") String search, Pageable pageable);

    @Query("SELECT m FROM Media m WHERE " +
           "LOWER(m.originalFilename) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(m.altText) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(m.caption) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Media> searchByFilenameOrAltText(@Param("search") String search, Pageable pageable);

    @Query("SELECT m FROM Media m WHERE m.type = :type AND " +
           "(LOWER(m.originalFilename) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(m.altText) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Media> searchByFilenameOrAltTextAndType(@Param("search") String search, 
                                                   @Param("type") Media.MediaType type, 
                                                   Pageable pageable);

    long countByType(Media.MediaType type);
    
    long countByWorkspaceId(Long workspaceId);
    
    @Query("SELECT COUNT(m) FROM Media m WHERE m.workspace.id = :workspaceId")
    long countByWorkspace(@Param("workspaceId") Long workspaceId);
    
    @Query("SELECT COALESCE(SUM(m.fileSize), 0) FROM Media m WHERE m.workspace.id = :workspaceId")
    long getTotalStorageUsed(@Param("workspaceId") Long workspaceId);
    
    @Query("SELECT COALESCE(SUM(m.fileSize), 0) FROM Media m WHERE m.workspace.id = :workspaceId")
    Long getTotalStorageUsedByWorkspace(@Param("workspaceId") Long workspaceId);
    
    @Query("SELECT COUNT(m) FROM Media m WHERE m.workspace.id = :workspaceId AND m.createdAt >= :startDate")
    long countByWorkspaceAndUploadedAfter(@Param("workspaceId") Long workspaceId, @Param("startDate") LocalDateTime startDate);
    
    List<Media> findByWorkspaceAndFolderIsNull(Workspace workspace);
}
