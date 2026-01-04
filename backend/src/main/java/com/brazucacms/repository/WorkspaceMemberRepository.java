package com.brazucacms.repository;

import com.brazucacms.model.User;
import com.brazucacms.model.Workspace;
import com.brazucacms.model.WorkspaceMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkspaceMemberRepository extends JpaRepository<WorkspaceMember, Long> {
    
    List<WorkspaceMember> findByWorkspace(Workspace workspace);
    
    @Query("SELECT m FROM WorkspaceMember m LEFT JOIN FETCH m.user WHERE m.workspace = :workspace AND m.status = :status")
    List<WorkspaceMember> findByWorkspaceAndStatus(@Param("workspace") Workspace workspace, @Param("status") WorkspaceMember.InviteStatus status);
    
    Optional<WorkspaceMember> findByWorkspaceAndUser(Workspace workspace, User user);
    
    Optional<WorkspaceMember> findByInviteToken(String inviteToken);
    
    Optional<WorkspaceMember> findByWorkspaceAndInviteEmail(Workspace workspace, String email);
    
    boolean existsByWorkspaceAndUser(Workspace workspace, User user);
    
    boolean existsByWorkspaceAndInviteEmail(Workspace workspace, String email);
    
    @Query("SELECT m FROM WorkspaceMember m WHERE m.workspace.id = :workspaceId AND m.status = 'ACTIVE'")
    List<WorkspaceMember> findActiveMembers(@Param("workspaceId") Long workspaceId);
    
    @Query("SELECT m FROM WorkspaceMember m WHERE m.workspace.id = :workspaceId AND m.status = 'PENDING'")
    List<WorkspaceMember> findPendingInvites(@Param("workspaceId") Long workspaceId);
    
    @Query("SELECT COUNT(m) FROM WorkspaceMember m WHERE m.workspace.id = :workspaceId AND m.status = 'ACTIVE'")
    Integer countActiveMembers(@Param("workspaceId") Long workspaceId);
    
    @Query("SELECT m.role FROM WorkspaceMember m WHERE m.workspace.id = :workspaceId AND m.user.id = :userId AND m.status = 'ACTIVE'")
    Optional<WorkspaceMember.MemberRole> findUserRole(@Param("workspaceId") Long workspaceId, @Param("userId") Long userId);
    
    void deleteByWorkspaceAndUser(Workspace workspace, User user);
}
