package com.brazucacms.repository;

import com.brazucacms.model.Webhook;
import com.brazucacms.model.Workspace;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WebhookRepository extends JpaRepository<Webhook, Long> {
    
    List<Webhook> findByWorkspace(Workspace workspace);
    
    Page<Webhook> findByWorkspace(Workspace workspace, Pageable pageable);
    
    List<Webhook> findByWorkspaceAndStatus(Workspace workspace, Webhook.WebhookStatus status);
    
    @Query("SELECT w FROM Webhook w WHERE w.workspace.id = :workspaceId AND w.status = 'ACTIVE' AND w.events LIKE %:event%")
    List<Webhook> findActiveWebhooksForEvent(@Param("workspaceId") Long workspaceId, @Param("event") String event);
    
    @Query("SELECT COUNT(w) FROM Webhook w WHERE w.workspace.id = :workspaceId")
    Integer countByWorkspace(@Param("workspaceId") Long workspaceId);
}
