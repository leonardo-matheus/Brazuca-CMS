package com.brazucacms.dto.company;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO com estatísticas das empresas.
 * 
 * @author Brazuca CMS
 * @version 1.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompanyStatsDTO {
    
    private Long totalCompanies;
    private Long activeCompanies;
    private Long inactiveCompanies;
    private Long suspendedCompanies;
    private Long trialCompanies;
    
    private Long freeCompanies;
    private Long starterCompanies;
    private Long professionalCompanies;
    private Long enterpriseCompanies;
    
    private Long totalUsers;
    private Long totalWorkspaces;
    private Long totalStorageUsedMb;
}
