package com.brazucacms.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Entidade que representa um Workspace (projeto) no sistema.
 * 
 * Workspaces são os espaços de trabalho onde o conteúdo é gerenciado.
 * Cada workspace pertence a uma empresa e contém:
 * - Content Types (estruturas de conteúdo)
 * - Entries (entradas de conteúdo)
 * - Media (arquivos de mídia)
 * - API Keys (chaves de acesso à API)
 * 
 * @author Brazuca CMS
 * @version 1.0.0
 */
@Entity
@Table(name = "workspaces", indexes = {
    @Index(name = "idx_workspace_slug", columnList = "slug"),
    @Index(name = "idx_workspace_company", columnList = "company_id"),
    @Index(name = "idx_workspace_owner", columnList = "owner_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Workspace {

    /**
     * Identificador único do workspace
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Nome do workspace
     */
    @Column(nullable = false)
    private String name;

    /**
     * Slug único para identificação em URLs
     */
    @Column(unique = true, nullable = false)
    private String slug;

    /**
     * Descrição do workspace
     */
    @Column(columnDefinition = "TEXT")
    private String description;

    /**
     * URL customizada para acesso à API
     */
    @Column(name = "custom_url")
    private String customUrl;

    /**
     * Timezone do workspace
     */
    private String timezone;

    /**
     * Plano do workspace (herdado da empresa ou específico)
     */
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Plan plan = Plan.FREE;

    /**
     * Status do workspace
     */
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private WorkspaceStatus status = WorkspaceStatus.ACTIVE;

    /**
     * Armazenamento utilizado em MB
     */
    @Column(name = "storage_used")
    @Builder.Default
    private Long storageUsed = 0L;

    /**
     * Limite de armazenamento em MB
     */
    @Column(name = "storage_limit")
    @Builder.Default
    private Long storageLimit = 1000L; // 1GB default in MB

    /**
     * Empresa à qual o workspace pertence
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id")
    private Company company;

    /**
     * Usuário dono/criador do workspace
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    /**
     * Membros do workspace
     */
    @OneToMany(mappedBy = "workspace", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<WorkspaceMember> members = new ArrayList<>();

    /**
     * Data de criação
     */
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    /**
     * Data da última atualização
     */
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /**
     * Configurações customizadas em JSON
     */
    @Column(columnDefinition = "TEXT")
    private String settings;

    /**
     * Callback executado antes de persistir
     */
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (slug == null && name != null) {
            slug = generateSlug(name);
        }
        if (customUrl == null && slug != null) {
            customUrl = "https://api.brazucacms.com/ws/" + slug;
        }
    }

    /**
     * Callback executado antes de atualizar
     */
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
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
     * Planos disponíveis para workspaces
     */
    public enum Plan {
        /** Plano gratuito */
        FREE, 
        /** Plano profissional */
        PRO, 
        /** Plano enterprise */
        ENTERPRISE
    }

    /**
     * Status possíveis de um workspace
     */
    public enum WorkspaceStatus {
        /** Workspace ativo */
        ACTIVE, 
        /** Workspace inativo */
        INACTIVE, 
        /** Workspace suspenso */
        SUSPENDED
    }
}
