package com.brazucacms.service;

import com.brazucacms.dto.company.*;
import com.brazucacms.exception.BadRequestException;
import com.brazucacms.exception.ResourceNotFoundException;
import com.brazucacms.model.Company;
import com.brazucacms.model.Company.CompanyPlan;
import com.brazucacms.model.Company.CompanyStatus;
import com.brazucacms.model.User;
import com.brazucacms.model.Workspace;
import com.brazucacms.repository.CompanyRepository;
import com.brazucacms.repository.UserRepository;
import com.brazucacms.repository.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Serviço para gerenciamento de empresas.
 * 
 * Fornece operações CRUD completas e funcionalidades específicas:
 * - Criação de empresas com ou sem usuário owner
 * - Vinculação de usuários a empresas
 * - Gerenciamento de planos e limites
 * - Estatísticas e relatórios
 * 
 * IMPORTANTE: Apenas SUPER_ADMIN pode acessar estes métodos.
 * 
 * @author Brazuca CMS
 * @version 1.0.0
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CompanyService {

    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final WorkspaceRepository workspaceRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Lista todas as empresas com paginação.
     * 
     * @param pageable Configuração de paginação
     * @return Página de empresas
     */
    @Transactional(readOnly = true)
    public Page<CompanyDTO> findAll(Pageable pageable) {
        log.debug("Listando todas as empresas");
        return companyRepository.findAll(pageable).map(CompanyDTO::fromEntity);
    }

    /**
     * Lista empresas ativas com paginação.
     * 
     * @param pageable Configuração de paginação
     * @return Página de empresas ativas
     */
    @Transactional(readOnly = true)
    public Page<CompanyDTO> findAllActive(Pageable pageable) {
        log.debug("Listando empresas ativas");
        return companyRepository.findAllActive(pageable).map(CompanyDTO::fromEntity);
    }

    /**
     * Busca empresa por ID.
     * 
     * @param id ID da empresa
     * @return DTO da empresa
     * @throws ResourceNotFoundException se não encontrar
     */
    @Transactional(readOnly = true)
    public CompanyDTO findById(Long id) {
        log.debug("Buscando empresa por ID: {}", id);
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Empresa não encontrada: " + id));
        return CompanyDTO.fromEntity(company);
    }

    /**
     * Busca empresa por slug.
     * 
     * @param slug Slug da empresa
     * @return DTO da empresa
     * @throws ResourceNotFoundException se não encontrar
     */
    @Transactional(readOnly = true)
    public CompanyDTO findBySlug(String slug) {
        log.debug("Buscando empresa por slug: {}", slug);
        Company company = companyRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Empresa não encontrada: " + slug));
        return CompanyDTO.fromEntity(company);
    }

    /**
     * Pesquisa empresas por termo.
     * 
     * @param searchTerm Termo de busca
     * @param pageable Paginação
     * @return Página de empresas
     */
    @Transactional(readOnly = true)
    public Page<CompanyDTO> search(String searchTerm, Pageable pageable) {
        log.debug("Pesquisando empresas: {}", searchTerm);
        return companyRepository.search(searchTerm, pageable).map(CompanyDTO::fromEntity);
    }

    /**
     * Cria uma nova empresa.
     * Opcionalmente cria um usuário COMPANY_OWNER junto.
     * 
     * @param request Dados da empresa
     * @return DTO da empresa criada
     */
    @Transactional
    public CompanyDTO create(CreateCompanyRequest request) {
        log.info("Criando nova empresa: {}", request.getName());
        
        // Valida slug único
        if (request.getSlug() != null && companyRepository.existsBySlug(request.getSlug())) {
            throw new BadRequestException("Slug já está em uso: " + request.getSlug());
        }
        
        // Valida CNPJ único
        if (request.getCnpj() != null && companyRepository.existsByCnpj(request.getCnpj())) {
            throw new BadRequestException("CNPJ já cadastrado: " + request.getCnpj());
        }
        
        // Define limites baseado no plano
        CompanyPlan plan = request.getPlan() != null ? request.getPlan() : CompanyPlan.FREE;
        int maxUsers = request.getMaxUsers() != null ? request.getMaxUsers() : getDefaultMaxUsers(plan);
        int maxWorkspaces = request.getMaxWorkspaces() != null ? request.getMaxWorkspaces() : getDefaultMaxWorkspaces(plan);
        long storageLimit = request.getStorageLimitMb() != null ? request.getStorageLimitMb() : getDefaultStorageLimit(plan);
        
        Company company = Company.builder()
                .name(request.getName())
                .slug(request.getSlug())
                .description(request.getDescription())
                .cnpj(request.getCnpj())
                .contactEmail(request.getContactEmail())
                .contactPhone(request.getContactPhone())
                .logoUrl(request.getLogoUrl())
                .websiteUrl(request.getWebsiteUrl())
                .address(request.getAddress())
                .city(request.getCity())
                .state(request.getState())
                .country(request.getCountry() != null ? request.getCountry() : "Brasil")
                .zipCode(request.getZipCode())
                .plan(plan)
                .status(CompanyStatus.ACTIVE)
                .maxUsers(maxUsers)
                .maxWorkspaces(maxWorkspaces)
                .storageLimitMb(storageLimit)
                .planExpiresAt(request.getPlanExpiresAt())
                .build();
        
        company = companyRepository.save(company);
        log.info("Empresa criada com sucesso: {} (ID: {})", company.getName(), company.getId());
        
        // Cria usuário owner se dados fornecidos
        if (request.getOwnerEmail() != null && request.getOwnerPassword() != null) {
            createCompanyOwner(company, request);
        }
        
        return CompanyDTO.fromEntity(company);
    }

    /**
     * Atualiza uma empresa existente.
     * 
     * @param id ID da empresa
     * @param request Dados para atualização
     * @return DTO da empresa atualizada
     */
    @Transactional
    public CompanyDTO update(Long id, UpdateCompanyRequest request) {
        log.info("Atualizando empresa ID: {}", id);
        
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Empresa não encontrada: " + id));
        
        // Valida CNPJ único se alterado
        if (request.getCnpj() != null && !request.getCnpj().equals(company.getCnpj())) {
            if (companyRepository.existsByCnpj(request.getCnpj())) {
                throw new BadRequestException("CNPJ já cadastrado: " + request.getCnpj());
            }
        }
        
        // Atualiza campos se fornecidos
        if (request.getName() != null) company.setName(request.getName());
        if (request.getDescription() != null) company.setDescription(request.getDescription());
        if (request.getCnpj() != null) company.setCnpj(request.getCnpj());
        if (request.getContactEmail() != null) company.setContactEmail(request.getContactEmail());
        if (request.getContactPhone() != null) company.setContactPhone(request.getContactPhone());
        if (request.getLogoUrl() != null) company.setLogoUrl(request.getLogoUrl());
        if (request.getWebsiteUrl() != null) company.setWebsiteUrl(request.getWebsiteUrl());
        if (request.getAddress() != null) company.setAddress(request.getAddress());
        if (request.getCity() != null) company.setCity(request.getCity());
        if (request.getState() != null) company.setState(request.getState());
        if (request.getCountry() != null) company.setCountry(request.getCountry());
        if (request.getZipCode() != null) company.setZipCode(request.getZipCode());
        if (request.getPlan() != null) company.setPlan(request.getPlan());
        if (request.getStatus() != null) company.setStatus(request.getStatus());
        if (request.getMaxUsers() != null) company.setMaxUsers(request.getMaxUsers());
        if (request.getMaxWorkspaces() != null) company.setMaxWorkspaces(request.getMaxWorkspaces());
        if (request.getStorageLimitMb() != null) company.setStorageLimitMb(request.getStorageLimitMb());
        if (request.getPlanExpiresAt() != null) company.setPlanExpiresAt(request.getPlanExpiresAt());
        if (request.getSettings() != null) company.setSettings(request.getSettings());
        
        company = companyRepository.save(company);
        log.info("Empresa atualizada: {}", company.getName());
        
        return CompanyDTO.fromEntity(company);
    }

    /**
     * Remove uma empresa.
     * CUIDADO: Remove todos os dados relacionados!
     * 
     * @param id ID da empresa
     */
    @Transactional
    public void delete(Long id) {
        log.warn("Removendo empresa ID: {}", id);
        
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Empresa não encontrada: " + id));
        
        // Verifica se tem dados vinculados
        if (!company.getUsers().isEmpty() || !company.getWorkspaces().isEmpty()) {
            log.warn("Empresa {} tem {} usuários e {} workspaces que serão removidos",
                    company.getName(), company.getUsers().size(), company.getWorkspaces().size());
        }
        
        companyRepository.delete(company);
        log.info("Empresa removida: {}", company.getName());
    }

    /**
     * Suspende uma empresa (bloqueia acesso).
     * 
     * @param id ID da empresa
     * @return DTO da empresa suspensa
     */
    @Transactional
    public CompanyDTO suspend(Long id) {
        log.warn("Suspendendo empresa ID: {}", id);
        
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Empresa não encontrada: " + id));
        
        company.setStatus(CompanyStatus.SUSPENDED);
        company = companyRepository.save(company);
        
        log.info("Empresa suspensa: {}", company.getName());
        return CompanyDTO.fromEntity(company);
    }

    /**
     * Ativa uma empresa.
     * 
     * @param id ID da empresa
     * @return DTO da empresa ativada
     */
    @Transactional
    public CompanyDTO activate(Long id) {
        log.info("Ativando empresa ID: {}", id);
        
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Empresa não encontrada: " + id));
        
        company.setStatus(CompanyStatus.ACTIVE);
        company = companyRepository.save(company);
        
        log.info("Empresa ativada: {}", company.getName());
        return CompanyDTO.fromEntity(company);
    }

    /**
     * Vincula um usuário a uma empresa.
     * 
     * @param companyId ID da empresa
     * @param userId ID do usuário
     */
    @Transactional
    public void addUser(Long companyId, Long userId) {
        log.info("Vinculando usuário {} à empresa {}", userId, companyId);
        
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Empresa não encontrada: " + companyId));
        
        if (!company.canAddUser()) {
            throw new BadRequestException("Empresa atingiu o limite de usuários: " + company.getMaxUsers());
        }
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado: " + userId));
        
        if (user.getCompany() != null) {
            throw new BadRequestException("Usuário já pertence a uma empresa");
        }
        
        user.setCompany(company);
        userRepository.save(user);
        
        log.info("Usuário {} vinculado à empresa {}", user.getEmail(), company.getName());
    }

    /**
     * Remove vínculo de usuário com empresa.
     * 
     * @param companyId ID da empresa
     * @param userId ID do usuário
     */
    @Transactional
    public void removeUser(Long companyId, Long userId) {
        log.info("Removendo usuário {} da empresa {}", userId, companyId);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado: " + userId));
        
        if (user.getCompany() == null || !user.getCompany().getId().equals(companyId)) {
            throw new BadRequestException("Usuário não pertence a esta empresa");
        }
        
        // Não permite remover COMPANY_OWNER
        if (user.getRole() == User.Role.COMPANY_OWNER) {
            throw new BadRequestException("Não é possível remover o owner da empresa");
        }
        
        user.setCompany(null);
        userRepository.save(user);
        
        log.info("Usuário {} removido da empresa", user.getEmail());
    }

    /**
     * Lista usuários de uma empresa.
     * 
     * @param companyId ID da empresa
     * @param pageable Paginação
     * @return Página de usuários
     */
    @Transactional(readOnly = true)
    public Page<User> getCompanyUsers(Long companyId, Pageable pageable) {
        log.debug("Listando usuários da empresa {}", companyId);
        
        if (!companyRepository.existsById(companyId)) {
            throw new ResourceNotFoundException("Empresa não encontrada: " + companyId);
        }
        
        return userRepository.findByCompanyId(companyId, pageable);
    }

    /**
     * Lista workspaces de uma empresa.
     * 
     * @param companyId ID da empresa
     * @param pageable Paginação
     * @return Página de workspaces
     */
    @Transactional(readOnly = true)
    public Page<Workspace> getCompanyWorkspaces(Long companyId, Pageable pageable) {
        log.debug("Listando workspaces da empresa {}", companyId);
        
        if (!companyRepository.existsById(companyId)) {
            throw new ResourceNotFoundException("Empresa não encontrada: " + companyId);
        }
        
        return workspaceRepository.findByCompanyId(companyId, pageable);
    }

    /**
     * Obtém estatísticas gerais das empresas.
     * 
     * @return DTO com estatísticas
     */
    @Transactional(readOnly = true)
    public CompanyStatsDTO getStats() {
        log.debug("Obtendo estatísticas de empresas");
        
        return CompanyStatsDTO.builder()
                .totalCompanies(companyRepository.count())
                .activeCompanies(companyRepository.countByStatus(CompanyStatus.ACTIVE))
                .inactiveCompanies(companyRepository.countByStatus(CompanyStatus.INACTIVE))
                .suspendedCompanies(companyRepository.countByStatus(CompanyStatus.SUSPENDED))
                .trialCompanies(companyRepository.countByStatus(CompanyStatus.TRIAL))
                .freeCompanies(companyRepository.countByPlan(CompanyPlan.FREE))
                .starterCompanies(companyRepository.countByPlan(CompanyPlan.STARTER))
                .professionalCompanies(companyRepository.countByPlan(CompanyPlan.PROFESSIONAL))
                .enterpriseCompanies(companyRepository.countByPlan(CompanyPlan.ENTERPRISE))
                .totalUsers(userRepository.count())
                .totalWorkspaces(workspaceRepository.count())
                .totalStorageUsedMb(companyRepository.getTotalStorageUsed())
                .build();
    }

    /**
     * Atualiza o plano de uma empresa.
     * 
     * @param id ID da empresa
     * @param plan Novo plano
     * @param expiresAt Data de expiração (null = sem expiração)
     * @return DTO da empresa atualizada
     */
    @Transactional
    public CompanyDTO updatePlan(Long id, CompanyPlan plan, LocalDateTime expiresAt) {
        log.info("Atualizando plano da empresa {} para {}", id, plan);
        
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Empresa não encontrada: " + id));
        
        company.setPlan(plan);
        company.setPlanExpiresAt(expiresAt);
        company.setMaxUsers(getDefaultMaxUsers(plan));
        company.setMaxWorkspaces(getDefaultMaxWorkspaces(plan));
        company.setStorageLimitMb(getDefaultStorageLimit(plan));
        
        company = companyRepository.save(company);
        log.info("Plano atualizado para empresa {}: {}", company.getName(), plan);
        
        return CompanyDTO.fromEntity(company);
    }

    // ========== Métodos privados auxiliares ==========

    /**
     * Cria usuário COMPANY_OWNER para a empresa.
     */
    private void createCompanyOwner(Company company, CreateCompanyRequest request) {
        log.info("Criando owner para empresa {}", company.getName());
        
        if (userRepository.existsByEmail(request.getOwnerEmail())) {
            throw new BadRequestException("Email já cadastrado: " + request.getOwnerEmail());
        }
        
        User owner = User.builder()
                .name(request.getOwnerName() != null ? request.getOwnerName() : "Administrador")
                .email(request.getOwnerEmail())
                .password(passwordEncoder.encode(request.getOwnerPassword()))
                .role(User.Role.COMPANY_OWNER)
                .company(company)
                .active(true)
                .emailVerified(true)
                .build();
        
        userRepository.save(owner);
        log.info("Owner criado: {}", owner.getEmail());
    }

    /**
     * Retorna limite de usuários padrão por plano.
     */
    private int getDefaultMaxUsers(CompanyPlan plan) {
        return switch (plan) {
            case FREE -> 5;
            case STARTER -> 10;
            case PROFESSIONAL -> 50;
            case ENTERPRISE -> -1; // Ilimitado
        };
    }

    /**
     * Retorna limite de workspaces padrão por plano.
     */
    private int getDefaultMaxWorkspaces(CompanyPlan plan) {
        return switch (plan) {
            case FREE -> 3;
            case STARTER -> 10;
            case PROFESSIONAL -> 50;
            case ENTERPRISE -> -1; // Ilimitado
        };
    }

    /**
     * Retorna limite de storage padrão por plano (em MB).
     */
    private long getDefaultStorageLimit(CompanyPlan plan) {
        return switch (plan) {
            case FREE -> 1024L;        // 1 GB
            case STARTER -> 5120L;      // 5 GB
            case PROFESSIONAL -> 51200L; // 50 GB
            case ENTERPRISE -> -1L;     // Ilimitado
        };
    }
}
