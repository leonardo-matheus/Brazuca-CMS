package com.brazucacms.dto.workspace;

import com.brazucacms.model.WorkspaceMember;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateMemberRoleRequest {
    
    @NotNull(message = "Role is required")
    private WorkspaceMember.MemberRole role;
}
