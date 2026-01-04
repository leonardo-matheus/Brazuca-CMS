package com.brazucacms.repository;

import com.brazucacms.model.AutomationLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AutomationLogRepository extends JpaRepository<AutomationLog, Long> {

    Page<AutomationLog> findByWorkflowIdOrderByCreatedAtDesc(Long workflowId, Pageable pageable);

    Optional<AutomationLog> findByExecutionId(String executionId);

    List<AutomationLog> findByWorkflowIdAndStatus(Long workflowId, AutomationLog.ExecutionStatus status);

    @Query("SELECT COUNT(l) FROM AutomationLog l WHERE l.workflow.company.id = :companyId AND l.createdAt >= :since")
    long countByCompanyIdSince(Long companyId, LocalDateTime since);

    @Query("SELECT COUNT(l) FROM AutomationLog l WHERE l.workflow.company.id = :companyId AND l.status = 'COMPLETED' AND l.createdAt >= :since")
    long countSuccessfulByCompanyIdSince(Long companyId, LocalDateTime since);

    @Query("SELECT l FROM AutomationLog l WHERE l.status = 'RUNNING' AND l.startedAt < :timeout")
    List<AutomationLog> findTimedOutExecutions(LocalDateTime timeout);

    void deleteByWorkflowId(Long workflowId);
}
