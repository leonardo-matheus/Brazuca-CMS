package com.brazucacms.service;

import com.brazucacms.dto.workspace.*;
import com.brazucacms.exception.BadRequestException;
import com.brazucacms.exception.ResourceNotFoundException;
import com.brazucacms.model.User;
import com.brazucacms.model.Workspace;
import com.brazucacms.model.WorkspaceMember;
import com.brazucacms.repository.WorkspaceMemberRepository;
import com.brazucacms.repository.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WorkspaceService {

    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository memberRepository;

    @Transactional
    public WorkspaceDTO createWorkspace(CreateWorkspaceRequest request, User owner) {
        // Generate slug from name
        String slug = generateSlug(request.getName());
        
        // Check if slug exists
        int counter = 1;
        String originalSlug = slug;
        while (workspaceRepository.existsBySlug(slug)) {
            slug = originalSlug + "-" + counter++;
        }
        
        Workspace workspace = Workspace.builder()
                .name(request.getName())
                .slug(slug)
                .description(request.getDescription())
                .timezone(request.getTimezone() != null ? request.getTimezone() : "America/Sao_Paulo")
                .owner(owner)
                .plan(Workspace.Plan.FREE)
                .status(Workspace.WorkspaceStatus.ACTIVE)
                .storageUsed(0L)
                .storageLimit(1000L) // 1GB in MB
                .build();
        
        workspace = workspaceRepository.save(workspace);
        
        // Add owner as admin member
        WorkspaceMember ownerMember = WorkspaceMember.builder()
                .workspace(workspace)
                .user(owner)
                .role(WorkspaceMember.MemberRole.ADMIN)
                .status(WorkspaceMember.InviteStatus.ACTIVE)
                .joinedAt(LocalDateTime.now())
                .build();
        memberRepository.save(ownerMember);
        
        return toDTO(workspace);
    }

    public WorkspaceDTO getWorkspace(Long workspaceId) {
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));
        return toDTO(workspace);
    }

    public WorkspaceDTO getWorkspaceBySlug(String slug) {
        Workspace workspace = workspaceRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));
        return toDTO(workspace);
    }

    public List<WorkspaceDTO> getUserWorkspaces(User user) {
        return workspaceRepository.findAllByUser(user).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public Page<WorkspaceDTO> getUserWorkspaces(User user, Pageable pageable) {
        return workspaceRepository.findAllByUser(user, pageable)
                .map(this::toDTO);
    }

    @Transactional
    public WorkspaceDTO updateWorkspace(Long workspaceId, UpdateWorkspaceRequest request, User user) {
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));
        
        // Check if user has permission
        if (!isWorkspaceAdmin(workspace, user)) {
            throw new BadRequestException("You don't have permission to update this workspace");
        }
        
        if (request.getName() != null) {
            workspace.setName(request.getName());
        }
        if (request.getDescription() != null) {
            workspace.setDescription(request.getDescription());
        }
        if (request.getTimezone() != null) {
            workspace.setTimezone(request.getTimezone());
        }
        
        workspace = workspaceRepository.save(workspace);
        return toDTO(workspace);
    }

    @Transactional
    public void deleteWorkspace(Long workspaceId, User user) {
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));
        
        // Only owner can delete workspace
        if (!workspace.getOwner().getId().equals(user.getId())) {
            throw new BadRequestException("Only the owner can delete this workspace");
        }
        
        workspaceRepository.delete(workspace);
    }

    // Member management
    public List<MemberDTO> getWorkspaceMembers(Long workspaceId) {
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));
        
        return memberRepository.findByWorkspaceAndStatus(workspace, WorkspaceMember.InviteStatus.ACTIVE)
                .stream()
                .map(this::toMemberDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public InviteDTO inviteMember(Long workspaceId, InviteMemberRequest request, User inviter) {
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));
        
        // Check if inviter has permission
        if (!isWorkspaceAdmin(workspace, inviter)) {
            throw new BadRequestException("You don't have permission to invite members");
        }
        
        // Check if already invited or member
        if (memberRepository.existsByWorkspaceAndInviteEmail(workspace, request.getEmail())) {
            throw new BadRequestException("User is already invited or a member");
        }
        
        String inviteToken = UUID.randomUUID().toString();
        
        WorkspaceMember invite = WorkspaceMember.builder()
                .workspace(workspace)
                .inviteEmail(request.getEmail())
                .role(request.getRole())
                .status(WorkspaceMember.InviteStatus.PENDING)
                .inviteToken(inviteToken)
                .invitedAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusDays(7))
                .build();
        
        invite = memberRepository.save(invite);
        
        return InviteDTO.builder()
                .id(invite.getId())
                .email(invite.getInviteEmail())
                .role(invite.getRole())
                .status(invite.getStatus())
                .inviteToken(inviteToken)
                .inviteUrl("https://cms-saas.com/invite/" + inviteToken)
                .createdAt(invite.getInvitedAt())
                .expiresAt(invite.getExpiresAt())
                .build();
    }

    @Transactional
    public MemberDTO acceptInvite(String inviteToken, User user) {
        WorkspaceMember invite = memberRepository.findByInviteToken(inviteToken)
                .orElseThrow(() -> new ResourceNotFoundException("Invite not found"));
        
        if (invite.getStatus() != WorkspaceMember.InviteStatus.PENDING) {
            throw new BadRequestException("Invite is no longer valid");
        }
        
        if (invite.getExpiresAt().isBefore(LocalDateTime.now())) {
            invite.setStatus(WorkspaceMember.InviteStatus.EXPIRED);
            memberRepository.save(invite);
            throw new BadRequestException("Invite has expired");
        }
        
        // Check if email matches
        if (!invite.getInviteEmail().equalsIgnoreCase(user.getEmail())) {
            throw new BadRequestException("This invite is for a different email address");
        }
        
        invite.setUser(user);
        invite.setStatus(WorkspaceMember.InviteStatus.ACTIVE);
        invite.setJoinedAt(LocalDateTime.now());
        invite.setInviteToken(null);
        
        invite = memberRepository.save(invite);
        return toMemberDTO(invite);
    }

    @Transactional
    public MemberDTO updateMemberRole(Long workspaceId, Long memberId, UpdateMemberRoleRequest request, User user) {
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));
        
        if (!isWorkspaceAdmin(workspace, user)) {
            throw new BadRequestException("You don't have permission to update member roles");
        }
        
        WorkspaceMember member = memberRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found"));
        
        if (!member.getWorkspace().getId().equals(workspaceId)) {
            throw new BadRequestException("Member does not belong to this workspace");
        }
        
        // Cannot change owner's role
        if (member.getUser() != null && member.getUser().getId().equals(workspace.getOwner().getId())) {
            throw new BadRequestException("Cannot change the owner's role");
        }
        
        member.setRole(request.getRole());
        member = memberRepository.save(member);
        
        return toMemberDTO(member);
    }

    @Transactional
    public void removeMember(Long workspaceId, Long memberId, User user) {
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));
        
        if (!isWorkspaceAdmin(workspace, user)) {
            throw new BadRequestException("You don't have permission to remove members");
        }
        
        WorkspaceMember member = memberRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found"));
        
        if (!member.getWorkspace().getId().equals(workspaceId)) {
            throw new BadRequestException("Member does not belong to this workspace");
        }
        
        // Cannot remove owner
        if (member.getUser() != null && member.getUser().getId().equals(workspace.getOwner().getId())) {
            throw new BadRequestException("Cannot remove the workspace owner");
        }
        
        memberRepository.delete(member);
    }

    // Helper methods
    public boolean isWorkspaceAdmin(Workspace workspace, User user) {
        if (workspace.getOwner().getId().equals(user.getId())) {
            return true;
        }
        
        return memberRepository.findUserRole(workspace.getId(), user.getId())
                .map(role -> role == WorkspaceMember.MemberRole.ADMIN)
                .orElse(false);
    }

    public boolean isWorkspaceMember(Long workspaceId, User user) {
        Workspace workspace = workspaceRepository.findById(workspaceId).orElse(null);
        if (workspace == null) return false;
        
        if (workspace.getOwner().getId().equals(user.getId())) {
            return true;
        }
        
        return memberRepository.findUserRole(workspaceId, user.getId()).isPresent();
    }

    public WorkspaceMember.MemberRole getUserRole(Long workspaceId, User user) {
        Workspace workspace = workspaceRepository.findById(workspaceId).orElse(null);
        if (workspace == null) return null;
        
        if (workspace.getOwner().getId().equals(user.getId())) {
            return WorkspaceMember.MemberRole.ADMIN;
        }
        
        return memberRepository.findUserRole(workspaceId, user.getId()).orElse(null);
    }

    public Workspace getWorkspaceEntity(Long workspaceId) {
        return workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));
    }

    // Overloaded methods for ID-based checks
    public boolean isWorkspaceMember(Long workspaceId, Long userId) {
        Workspace workspace = workspaceRepository.findById(workspaceId).orElse(null);
        if (workspace == null) return false;
        
        if (workspace.getOwner().getId().equals(userId)) {
            return true;
        }
        
        return memberRepository.findUserRole(workspaceId, userId).isPresent();
    }

    public boolean isWorkspaceAdmin(Long workspaceId, Long userId) {
        Workspace workspace = workspaceRepository.findById(workspaceId).orElse(null);
        if (workspace == null) return false;
        
        if (workspace.getOwner().getId().equals(userId)) {
            return true;
        }
        
        return memberRepository.findUserRole(workspaceId, userId)
                .map(role -> role == WorkspaceMember.MemberRole.ADMIN)
                .orElse(false);
    }

    public Long getStorageLimitForWorkspace(Long workspaceId) {
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));
        // Convert MB to bytes
        return workspace.getStorageLimit() * 1024 * 1024;
    }

    private String generateSlug(String name) {
        return name.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
    }

    private WorkspaceDTO toDTO(Workspace workspace) {
        Integer memberCount = memberRepository.countActiveMembers(workspace.getId());
        
        return WorkspaceDTO.builder()
                .id(workspace.getId())
                .name(workspace.getName())
                .slug(workspace.getSlug())
                .description(workspace.getDescription())
                .customUrl(workspace.getCustomUrl())
                .timezone(workspace.getTimezone())
                .plan(workspace.getPlan())
                .ownerId(workspace.getOwner().getId())
                .ownerName(workspace.getOwner().getName())
                .ownerEmail(workspace.getOwner().getEmail())
                .memberCount(memberCount != null ? memberCount : 1)
                .storage(WorkspaceDTO.StorageInfo.builder()
                        .used(workspace.getStorageUsed())
                        .limit(workspace.getStorageLimit())
                        .unit("MB")
                        .percentage(workspace.getStorageLimit() > 0 
                                ? (int) ((workspace.getStorageUsed() * 100) / workspace.getStorageLimit()) 
                                : 0)
                        .build())
                .createdAt(workspace.getCreatedAt())
                .updatedAt(workspace.getUpdatedAt())
                .build();
    }

    private MemberDTO toMemberDTO(WorkspaceMember member) {
        return MemberDTO.builder()
                .id(member.getId())
                .userId(member.getUser() != null ? member.getUser().getId() : null)
                .name(member.getUser() != null ? member.getUser().getName() : null)
                .email(member.getUser() != null ? member.getUser().getEmail() : member.getInviteEmail())
                .avatarUrl(member.getUser() != null ? member.getUser().getAvatarUrl() : null)
                .role(member.getRole())
                .status(member.getStatus())
                .joinedAt(member.getJoinedAt())
                .invitedAt(member.getInvitedAt())
                .build();
    }
}
