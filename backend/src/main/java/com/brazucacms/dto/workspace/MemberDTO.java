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
public class MemberDTO {
    private Long id;
    private Long userId;
    private String name;
    private String email;
    private String avatarUrl;
    private WorkspaceMember.MemberRole role;
    private WorkspaceMember.InviteStatus status;
    private LocalDateTime joinedAt;
    private LocalDateTime invitedAt;
}
