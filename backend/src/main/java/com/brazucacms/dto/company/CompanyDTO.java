package com.brazucacms.dto.company;

import com.brazucacms.model.Company;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO para representação de dados de uma empresa.
 * 
 * @author Brazuca CMS
 * @version 1.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompanyDTO {
    
    private Long id;
    private String name;
    private String slug;
    private String description;
    private String cnpj;
    private String contactEmail;
    private String contactPhone;
    private String logoUrl;
    private String websiteUrl;
    private String address;
    private String city;
    private String state;
    private String country;
    private String zipCode;
    private Company.CompanyPlan plan;
    private Company.CompanyStatus status;
    private Integer maxUsers;
    private Integer maxWorkspaces;
    private Long storageLimitMb;
    private Long storageUsedMb;
    private LocalDateTime planExpiresAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Contadores
    private Integer usersCount;
    private Integer workspacesCount;
    
    /**
     * Converte entidade Company para DTO
     * 
     * @param company Entidade Company
     * @return CompanyDTO
     */
    public static CompanyDTO fromEntity(Company company) {
        if (company == null) return null;
        
        return CompanyDTO.builder()
                .id(company.getId())
                .name(company.getName())
                .slug(company.getSlug())
                .description(company.getDescription())
                .cnpj(company.getCnpj())
                .contactEmail(company.getContactEmail())
                .contactPhone(company.getContactPhone())
                .logoUrl(company.getLogoUrl())
                .websiteUrl(company.getWebsiteUrl())
                .address(company.getAddress())
                .city(company.getCity())
                .state(company.getState())
                .country(company.getCountry())
                .zipCode(company.getZipCode())
                .plan(company.getPlan())
                .status(company.getStatus())
                .maxUsers(company.getMaxUsers())
                .maxWorkspaces(company.getMaxWorkspaces())
                .storageLimitMb(company.getStorageLimitMb())
                .storageUsedMb(company.getStorageUsedMb())
                .planExpiresAt(company.getPlanExpiresAt())
                .createdAt(company.getCreatedAt())
                .updatedAt(company.getUpdatedAt())
                .usersCount(company.getUsers() != null ? company.getUsers().size() : 0)
                .workspacesCount(company.getWorkspaces() != null ? company.getWorkspaces().size() : 0)
                .build();
    }
}
