package com.brazucacms.dto.workspace;

import com.brazucacms.model.WorkspaceMember;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InviteDTO {
    private Long id;
    private String email;
    private WorkspaceMember.MemberRole role;
    private WorkspaceMember.InviteStatus status;
    private String inviteToken;
    private String inviteUrl;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
}
