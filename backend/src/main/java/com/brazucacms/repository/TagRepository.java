package com.brazucacms.repository;

import com.brazucacms.model.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TagRepository extends JpaRepository<Tag, Long> {

    List<Tag> findByWorkspaceId(Long workspaceId);

    Page<Tag> findByWorkspaceId(Long workspaceId, Pageable pageable);

    Optional<Tag> findByWorkspaceIdAndSlug(Long workspaceId, String slug);

    Optional<Tag> findByIdAndWorkspaceId(Long id, Long workspaceId);

    @Query("SELECT t FROM Tag t WHERE t.workspace.id = :workspaceId AND " +
           "(LOWER(t.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(t.slug) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<Tag> searchByWorkspaceId(@Param("workspaceId") Long workspaceId, 
                                   @Param("query") String query, 
                                   Pageable pageable);

    @Query("SELECT t FROM Tag t WHERE t.workspace.id = :workspaceId AND " +
           "(LOWER(t.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(t.slug) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<Tag> searchByWorkspaceIdList(@Param("workspaceId") Long workspaceId, 
                                       @Param("query") String query);

    boolean existsByWorkspaceIdAndSlug(Long workspaceId, String slug);

    void deleteByWorkspaceId(Long workspaceId);
}
