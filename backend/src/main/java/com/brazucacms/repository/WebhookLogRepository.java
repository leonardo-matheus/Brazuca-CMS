package com.brazucacms.repository;

import com.brazucacms.model.Webhook;
import com.brazucacms.model.WebhookLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface WebhookLogRepository extends JpaRepository<WebhookLog, Long> {
    
    List<WebhookLog> findByWebhook(Webhook webhook);
    
    Page<WebhookLog> findByWebhook(Webhook webhook, Pageable pageable);
    
    Page<WebhookLog> findByWebhookOrderByTimestampDesc(Webhook webhook, Pageable pageable);
    
    @Query("SELECT wl FROM WebhookLog wl WHERE wl.webhook.id = :webhookId ORDER BY wl.timestamp DESC")
    List<WebhookLog> findRecentLogs(@Param("webhookId") Long webhookId, Pageable pageable);
    
    @Query("SELECT COUNT(wl) FROM WebhookLog wl WHERE wl.webhook.id = :webhookId AND wl.status = :status")
    Long countByWebhookAndStatus(@Param("webhookId") Long webhookId, @Param("status") WebhookLog.LogStatus status);
    
    @Query("SELECT COUNT(wl) FROM WebhookLog wl WHERE wl.webhook.workspace.id = :workspaceId AND wl.timestamp > :since")
    Long countRecentLogsForWorkspace(@Param("workspaceId") Long workspaceId, @Param("since") LocalDateTime since);
}
