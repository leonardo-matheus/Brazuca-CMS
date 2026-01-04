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
 * Entidade que representa um Usuário no sistema.
 * 
 * Usuários podem pertencer a uma empresa (Company) e ter diferentes níveis de acesso:
 * - SUPER_ADMIN: Administrador do sistema (não vinculado a empresa específica)
 * - COMPANY_OWNER: Dono/administrador de uma empresa
 * - ADMIN: Administrador de workspace
 * - USER: Usuário comum
 * 
 * @author Brazuca CMS
 * @version 1.0.0
 */
@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_user_email", columnList = "email"),
    @Index(name = "idx_user_company", columnList = "company_id"),
    @Index(name = "idx_user_role", columnList = "role")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    /**
     * Identificador único do usuário
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Email do usuário (único no sistema)
     */
    @Column(nullable = false, unique = true)
    private String email;

    /**
     * Senha criptografada (BCrypt)
     */
    @Column(nullable = false)
    private String password;

    /**
     * Nome completo do usuário
     */
    @Column(nullable = false)
    private String name;

    /**
     * URL do avatar do usuário
     */
    @Column(name = "avatar_url")
    private String avatarUrl;

    /**
     * Role/papel do usuário no sistema
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Role role = Role.USER;

    /**
     * Status atual do usuário
     */
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private UserStatus status = UserStatus.ACTIVE;

    /**
     * Indica se o usuário está ativo
     */
    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    /**
     * Indica se o email foi verificado
     */
    @Column(name = "email_verified")
    @Builder.Default
    private Boolean emailVerified = false;

    /**
     * Token para verificação de email
     */
    @Column(name = "email_verification_token")
    private String emailVerificationToken;

    /**
     * Token para reset de senha
     */
    @Column(name = "password_reset_token")
    private String passwordResetToken;

    /**
     * Data de expiração do token de reset
     */
    @Column(name = "password_reset_expires")
    private LocalDateTime passwordResetExpires;

    /**
     * Data/hora do último login
     */
    @Column(name = "last_login")
    private LocalDateTime lastLogin;

    /**
     * Empresa à qual o usuário pertence
     * Null para SUPER_ADMIN (administradores do sistema)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id")
    private Company company;

    /**
     * Cargo/função do usuário na empresa
     */
    @Column(name = "job_title")
    private String jobTitle;

    /**
     * Departamento do usuário na empresa
     */
    private String department;

    /**
     * Telefone de contato
     */
    @Column(length = 20)
    private String phone;

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
     * API Keys do usuário
     */
    @OneToMany(mappedBy = "owner", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private Set<ApiKey> apiKeys = new HashSet<>();

    /**
     * Content Types criados pelo usuário
     */
    @OneToMany(mappedBy = "createdBy", cascade = CascadeType.ALL)
    @Builder.Default
    private Set<ContentType> contentTypes = new HashSet<>();

    /**
     * Entries criadas pelo usuário
     */
    @OneToMany(mappedBy = "createdBy", cascade = CascadeType.ALL)
    @Builder.Default
    private Set<Entry> entries = new HashSet<>();

    /**
     * Arquivos de mídia enviados pelo usuário
     */
    @OneToMany(mappedBy = "uploadedBy", cascade = CascadeType.ALL)
    @Builder.Default
    private Set<Media> mediaFiles = new HashSet<>();

    /**
     * Workspaces onde o usuário é owner
     */
    @OneToMany(mappedBy = "owner", cascade = CascadeType.ALL)
    @Builder.Default
    private List<Workspace> ownedWorkspaces = new ArrayList<>();

    /**
     * Memberships em workspaces
     */
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    @Builder.Default
    private List<WorkspaceMember> workspaceMemberships = new ArrayList<>();

    /**
     * Verifica se o usuário é Super Admin do sistema
     * 
     * @return true se for SUPER_ADMIN
     */
    public boolean isSuperAdmin() {
        return role == Role.SUPER_ADMIN;
    }

    /**
     * Verifica se o usuário é dono de empresa
     * 
     * @return true se for COMPANY_OWNER
     */
    public boolean isCompanyOwner() {
        return role == Role.COMPANY_OWNER;
    }

    /**
     * Verifica se o usuário tem acesso administrativo
     * 
     * @return true se for SUPER_ADMIN, COMPANY_OWNER ou ADMIN
     */
    public boolean hasAdminAccess() {
        return role == Role.SUPER_ADMIN || role == Role.COMPANY_OWNER || role == Role.ADMIN;
    }

    /**
     * Verifica se o usuário pertence a uma empresa específica
     * 
     * @param companyId ID da empresa
     * @return true se pertencer à empresa
     */
    public boolean belongsToCompany(Long companyId) {
        if (company == null) return false;
        return company.getId().equals(companyId);
    }

    /**
     * Roles/papéis disponíveis no sistema
     */
    public enum Role {
        /** Usuário comum com acesso limitado */
        USER,
        /** Administrador de workspace */
        ADMIN,
        /** Dono/administrador de uma empresa */
        COMPANY_OWNER,
        /** Super administrador do sistema (controle total) */
        SUPER_ADMIN
    }

    /**
     * Status possíveis de um usuário
     */
    public enum UserStatus {
        /** Usuário ativo */
        ACTIVE, 
        /** Usuário inativo (desativado) */
        INACTIVE, 
        /** Usuário banido */
        BANNED,
        /** Aguardando verificação de email */
        PENDING_VERIFICATION
    }
}
