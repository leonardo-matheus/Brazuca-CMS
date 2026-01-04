package com.brazucacms.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Entidade que representa uma Empresa no sistema multi-tenant.
 * 
 * O Brazuca CMS opera em um modelo multi-tenant onde:
 * - SUPER_ADMIN (dono do sistema) pode criar e gerenciar empresas
 * - Cada empresa tem seus próprios usuários, workspaces e dados
 * - Usuários são isolados por empresa (exceto SUPER_ADMIN)
 * 
 * Hierarquia de permissões:
 * - SUPER_ADMIN: Controle total do sistema, gerencia todas as empresas
 * - COMPANY_OWNER: Administrador da empresa, gerencia usuários e workspaces da empresa
 * - ADMIN: Administrador de workspace dentro da empresa
 * - USER: Usuário comum com acesso limitado
 * 
 * @author Brazuca CMS
 * @version 1.0.0
 */
@Entity
@Table(name = "companies")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Company {

    /**
     * Identificador único da empresa
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Nome da empresa (obrigatório)
     */
    @Column(nullable = false)
    private String name;

    /**
     * Slug único para identificação em URLs
     * Gerado automaticamente a partir do nome se não fornecido
     */
    @Column(unique = true, nullable = false)
    private String slug;

    /**
     * Descrição da empresa
     */
    @Column(columnDefinition = "TEXT")
    private String description;

    /**
     * CNPJ da empresa (formato: XX.XXX.XXX/XXXX-XX)
     */
    @Column(length = 18)
    private String cnpj;

    /**
     * Email de contato da empresa
     */
    @Column(name = "contact_email")
    private String contactEmail;

    /**
     * Telefone de contato
     */
    @Column(name = "contact_phone", length = 20)
    private String contactPhone;

    /**
     * URL do logo da empresa
     */
    @Column(name = "logo_url")
    private String logoUrl;

    /**
     * Website da empresa
     */
    @Column(name = "website_url")
    private String websiteUrl;

    /**
     * Endereço completo
     */
    @Column(columnDefinition = "TEXT")
    private String address;

    /**
     * Cidade
     */
    private String city;

    /**
     * Estado/UF
     */
    @Column(length = 2)
    private String state;

    /**
     * País (padrão: Brasil)
     */
    @Builder.Default
    private String country = "Brasil";

    /**
     * CEP
     */
    @Column(name = "zip_code", length = 10)
    private String zipCode;

    /**
     * Plano contratado pela empresa
     */
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private CompanyPlan plan = CompanyPlan.FREE;

    /**
     * Status atual da empresa
     */
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private CompanyStatus status = CompanyStatus.ACTIVE;

    /**
     * Número máximo de usuários permitidos
     * -1 = ilimitado
     */
    @Column(name = "max_users")
    @Builder.Default
    private Integer maxUsers = 5;

    /**
     * Número máximo de workspaces permitidos
     * -1 = ilimitado
     */
    @Column(name = "max_workspaces")
    @Builder.Default
    private Integer maxWorkspaces = 3;

    /**
     * Limite de armazenamento em MB
     * -1 = ilimitado
     */
    @Column(name = "storage_limit_mb")
    @Builder.Default
    private Long storageLimitMb = 1024L; // 1GB padrão

    /**
     * Armazenamento utilizado em MB
     */
    @Column(name = "storage_used_mb")
    @Builder.Default
    private Long storageUsedMb = 0L;

    /**
     * Data de expiração do plano (null = sem expiração)
     */
    @Column(name = "plan_expires_at")
    private LocalDateTime planExpiresAt;

    /**
     * Configurações customizadas em JSON
     */
    @Column(columnDefinition = "TEXT")
    private String settings;

    /**
     * Usuários vinculados a esta empresa
     */
    @OneToMany(mappedBy = "company", cascade = CascadeType.ALL)
    @Builder.Default
    private Set<User> users = new HashSet<>();

    /**
     * Workspaces desta empresa
     */
    @OneToMany(mappedBy = "company", cascade = CascadeType.ALL)
    @Builder.Default
    private List<Workspace> workspaces = new ArrayList<>();

    /**
     * Data de criação (preenchida automaticamente)
     */
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    /**
     * Data da última atualização (preenchida automaticamente)
     */
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /**
     * Gera slug automaticamente antes de persistir
     */
    @PrePersist
    protected void onCreate() {
        if (slug == null && name != null) {
            slug = generateSlug(name);
        }
    }

    /**
     * Gera um slug URL-friendly a partir do nome
     * 
     * @param name Nome para converter em slug
     * @return Slug gerado
     */
    private String generateSlug(String name) {
        return name.toLowerCase()
                .replaceAll("[áàãâä]", "a")
                .replaceAll("[éèêë]", "e")
                .replaceAll("[íìîï]", "i")
                .replaceAll("[óòõôö]", "o")
                .replaceAll("[úùûü]", "u")
                .replaceAll("[ç]", "c")
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
    }

    /**
     * Verifica se a empresa pode adicionar mais usuários
     * 
     * @return true se pode adicionar, false caso contrário
     */
    public boolean canAddUser() {
        if (maxUsers == -1) return true;
        return users.size() < maxUsers;
    }

    /**
     * Verifica se a empresa pode adicionar mais workspaces
     * 
     * @return true se pode adicionar, false caso contrário
     */
    public boolean canAddWorkspace() {
        if (maxWorkspaces == -1) return true;
        return workspaces.size() < maxWorkspaces;
    }

    /**
     * Verifica se a empresa tem espaço de armazenamento disponível
     * 
     * @param sizeInMb Tamanho em MB a ser verificado
     * @return true se há espaço, false caso contrário
     */
    public boolean hasStorageSpace(long sizeInMb) {
        if (storageLimitMb == -1) return true;
        return (storageUsedMb + sizeInMb) <= storageLimitMb;
    }

    /**
     * Verifica se o plano está ativo (não expirado)
     * 
     * @return true se ativo, false se expirado
     */
    public boolean isPlanActive() {
        if (planExpiresAt == null) return true;
        return LocalDateTime.now().isBefore(planExpiresAt);
    }

    /**
     * Planos disponíveis para empresas
     */
    public enum CompanyPlan {
        /** Plano gratuito: 5 usuários, 3 workspaces, 1GB */
        FREE,
        /** Plano starter: 10 usuários, 10 workspaces, 5GB */
        STARTER,
        /** Plano profissional: 50 usuários, 50 workspaces, 50GB */
        PROFESSIONAL,
        /** Plano enterprise: recursos ilimitados */
        ENTERPRISE
    }

    /**
     * Status possíveis de uma empresa
     */
    public enum CompanyStatus {
        /** Empresa ativa e operacional */
        ACTIVE,
        /** Empresa inativa (desativada pelo owner) */
        INACTIVE,
        /** Empresa suspensa (por inadimplência ou violação) */
        SUSPENDED,
        /** Conta em período de trial */
        TRIAL,
        /** Conta cancelada */
        CANCELLED
    }
}
