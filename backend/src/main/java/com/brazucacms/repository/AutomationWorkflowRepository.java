package com.brazucacms.repository;

import com.brazucacms.model.AutomationWorkflow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AutomationWorkflowRepository extends JpaRepository<AutomationWorkflow, Long> {

    List<AutomationWorkflow> findByCompanyId(Long companyId);

    List<AutomationWorkflow> findByCompanyIdAndStatus(Long companyId, AutomationWorkflow.WorkflowStatus status);

    Optional<AutomationWorkflow> findByIdAndCompanyId(Long id, Long companyId);

    @Query("SELECT w FROM AutomationWorkflow w WHERE w.status = 'ACTIVE' AND w.triggerIntegration.id = :integrationId AND w.triggerEvent = :event")
    List<AutomationWorkflow> findActiveByIntegrationAndEvent(Long integrationId, String event);

    @Query("SELECT w FROM AutomationWorkflow w WHERE w.status = 'ACTIVE' AND w.triggerType = 'CMS_EVENT' AND w.triggerEvent = :event")
    List<AutomationWorkflow> findActiveByCmsEvent(String event);

    @Query("SELECT w FROM AutomationWorkflow w WHERE w.status = 'ACTIVE' AND w.triggerType = 'SCHEDULE'")
    List<AutomationWorkflow> findActiveScheduled();

    long countByCompanyIdAndStatus(Long companyId, AutomationWorkflow.WorkflowStatus status);
}
