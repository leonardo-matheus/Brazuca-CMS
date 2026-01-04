package com.brazucacms.dto.company;

import com.brazucacms.model.Company;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO para atualização de uma empresa.
 * 
 * @author Brazuca CMS
 * @version 1.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateCompanyRequest {
    
    @Size(min = 2, max = 100, message = "Nome deve ter entre 2 e 100 caracteres")
    private String name;
    
    private String description;
    
    @Size(max = 18, message = "CNPJ deve ter no máximo 18 caracteres")
    private String cnpj;
    
    @Email(message = "Email de contato inválido")
    private String contactEmail;
    
    @Size(max = 20, message = "Telefone deve ter no máximo 20 caracteres")
    private String contactPhone;
    
    private String logoUrl;
    
    private String websiteUrl;
    
    private String address;
    
    private String city;
    
    @Size(max = 2, message = "Estado deve ter 2 caracteres (UF)")
    private String state;
    
    private String country;
    
    @Size(max = 10, message = "CEP deve ter no máximo 10 caracteres")
    private String zipCode;
    
    private Company.CompanyPlan plan;
    
    private Company.CompanyStatus status;
    
    private Integer maxUsers;
    
    private Integer maxWorkspaces;
    
    private Long storageLimitMb;
    
    private LocalDateTime planExpiresAt;
    
    private String settings;
}
