package com.brazucacms.repository;

import com.brazucacms.model.User;
import com.brazucacms.model.Workspace;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository para operações de persistência de workspaces.
 * 
 * @author Brazuca CMS
 * @version 1.0.0
 */
@Repository
public interface WorkspaceRepository extends JpaRepository<Workspace, Long> {
    
    Optional<Workspace> findBySlug(String slug);
    
    boolean existsBySlug(String slug);
    
    List<Workspace> findByOwner(User owner);
    
    /**
     * Busca workspaces por empresa (paginado)
     */
    Page<Workspace> findByCompanyId(Long companyId, Pageable pageable);
    
    /**
     * Lista workspaces por empresa
     */
    List<Workspace> findAllByCompanyId(Long companyId);
    
    /**
     * Conta workspaces por empresa
     */
    long countByCompanyId(Long companyId);
    
    @Query("SELECT w FROM Workspace w LEFT JOIN FETCH w.owner WHERE w.owner = :user OR EXISTS (SELECT m FROM WorkspaceMember m WHERE m.workspace = w AND m.user = :user AND m.status = 'ACTIVE')")
    List<Workspace> findAllByUser(@Param("user") User user);
    
    @Query(value = "SELECT w FROM Workspace w LEFT JOIN FETCH w.owner WHERE w.owner = :user OR EXISTS (SELECT m FROM WorkspaceMember m WHERE m.workspace = w AND m.user = :user AND m.status = 'ACTIVE') ORDER BY w.createdAt DESC",
           countQuery = "SELECT COUNT(w) FROM Workspace w WHERE w.owner = :user OR EXISTS (SELECT m FROM WorkspaceMember m WHERE m.workspace = w AND m.user = :user AND m.status = 'ACTIVE')")
    Page<Workspace> findAllByUser(@Param("user") User user, Pageable pageable);
    
    @Query("SELECT COUNT(m) FROM WorkspaceMember m WHERE m.workspace.id = :workspaceId AND m.status = 'ACTIVE'")
    Integer countActiveMembers(@Param("workspaceId") Long workspaceId);
    
    @Query("SELECT w FROM Workspace w WHERE w.name LIKE %:search% OR w.slug LIKE %:search%")
    Page<Workspace> searchWorkspaces(@Param("search") String search, Pageable pageable);
    
    /**
     * Busca workspaces de uma empresa por usuário
     */
    @Query("SELECT w FROM Workspace w WHERE w.company.id = :companyId AND (w.owner = :user OR EXISTS (SELECT m FROM WorkspaceMember m WHERE m.workspace = w AND m.user = :user AND m.status = 'ACTIVE'))")
    Page<Workspace> findByCompanyAndUser(@Param("companyId") Long companyId, @Param("user") User user, Pageable pageable);
}
