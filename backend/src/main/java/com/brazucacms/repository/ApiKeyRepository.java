package com.brazucacms.repository;

import com.brazucacms.model.ApiKey;
import com.brazucacms.model.Workspace;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApiKeyRepository extends JpaRepository<ApiKey, Long> {

    @Query("SELECT a FROM ApiKey a WHERE a.key = :key AND a.active = true")
    Optional<ApiKey> findByKeyAndActiveTrue(@Param("key") String key);

    Optional<ApiKey> findByKey(String key);

    List<ApiKey> findByOwnerId(Long ownerId);

    List<ApiKey> findByOwnerIdAndActiveTrue(Long ownerId);
    
    List<ApiKey> findByWorkspace(Workspace workspace);
    
    List<ApiKey> findByWorkspaceId(Long workspaceId);
    
    List<ApiKey> findByWorkspaceAndActiveTrue(Workspace workspace);
    
    List<ApiKey> findByWorkspaceIdAndActiveTrue(Long workspaceId);
    
    List<ApiKey> findByWorkspaceAndStatus(Workspace workspace, ApiKey.ApiKeyStatus status);

    boolean existsByKey(String key);

    long countByOwnerId(Long ownerId);

    long countByActiveTrue();
    
    long countByWorkspaceIdAndActiveTrue(Long workspaceId);
    
    @Query("SELECT COUNT(a) FROM ApiKey a WHERE a.workspace.id = :workspaceId")
    long countByWorkspace(@Param("workspaceId") Long workspaceId);
    
    @Query("SELECT SUM(a.requestCount) FROM ApiKey a WHERE a.workspace.id = :workspaceId")
    Long getTotalRequestsByWorkspace(@Param("workspaceId") Long workspaceId);
}
