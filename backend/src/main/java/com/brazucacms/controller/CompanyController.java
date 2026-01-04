package com.brazucacms.controller;

import com.brazucacms.dto.common.ApiResponse;
import com.brazucacms.dto.company.*;
import com.brazucacms.model.Company.CompanyPlan;
import com.brazucacms.model.User;
import com.brazucacms.model.Workspace;
import com.brazucacms.service.CompanyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

/**
 * Controller para gerenciamento de empresas.
 * 
 * IMPORTANTE: Todos os endpoints requerem role SUPER_ADMIN.
 * Apenas o dono do sistema pode gerenciar empresas.
 * 
 * Funcionalidades:
 * - CRUD completo de empresas
 * - Vinculação de usuários
 * - Gerenciamento de planos
 * - Estatísticas
 * 
 * @author Brazuca CMS
 * @version 1.0.0
 */
@RestController
@RequestMapping("/api/companies")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Companies", description = "Gerenciamento de empresas (SUPER_ADMIN only)")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class CompanyController {

    private final CompanyService companyService;

    /**
     * Lista todas as empresas com paginação.
     */
    @GetMapping
    @Operation(summary = "Listar empresas", description = "Lista todas as empresas cadastradas no sistema")
    @ApiResponses({
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Lista retornada com sucesso"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Acesso negado - requer SUPER_ADMIN")
    })
    public ResponseEntity<ApiResponse<Page<CompanyDTO>>> findAll(
            @PageableDefault(size = 20) Pageable pageable) {
        
        log.debug("GET /api/companies - Listando empresas");
        Page<CompanyDTO> companies = companyService.findAll(pageable);
        return ResponseEntity.ok(ApiResponse.success(companies));
    }

    /**
     * Lista apenas empresas ativas.
     */
    @GetMapping("/active")
    @Operation(summary = "Listar empresas ativas", description = "Lista apenas empresas com status ACTIVE")
    public ResponseEntity<ApiResponse<Page<CompanyDTO>>> findAllActive(
            @PageableDefault(size = 20) Pageable pageable) {
        
        log.debug("GET /api/companies/active - Listando empresas ativas");
        Page<CompanyDTO> companies = companyService.findAllActive(pageable);
        return ResponseEntity.ok(ApiResponse.success(companies));
    }

    /**
     * Busca empresa por ID.
     */
    @GetMapping("/{id}")
    @Operation(summary = "Buscar empresa por ID", description = "Retorna detalhes de uma empresa específica")
    @ApiResponses({
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Empresa encontrada"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Empresa não encontrada")
    })
    public ResponseEntity<ApiResponse<CompanyDTO>> findById(
            @Parameter(description = "ID da empresa") @PathVariable Long id) {
        
        log.debug("GET /api/companies/{} - Buscando empresa", id);
        CompanyDTO company = companyService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(company));
    }

    /**
     * Busca empresa por slug.
     */
    @GetMapping("/slug/{slug}")
    @Operation(summary = "Buscar empresa por slug", description = "Retorna empresa pelo slug único")
    public ResponseEntity<ApiResponse<CompanyDTO>> findBySlug(
            @Parameter(description = "Slug da empresa") @PathVariable String slug) {
        
        log.debug("GET /api/companies/slug/{} - Buscando empresa por slug", slug);
        CompanyDTO company = companyService.findBySlug(slug);
        return ResponseEntity.ok(ApiResponse.success(company));
    }

    /**
     * Pesquisa empresas por termo.
     */
    @GetMapping("/search")
    @Operation(summary = "Pesquisar empresas", description = "Pesquisa empresas por nome, CNPJ ou email")
    public ResponseEntity<ApiResponse<Page<CompanyDTO>>> search(
            @Parameter(description = "Termo de busca") @RequestParam String q,
            @PageableDefault(size = 20) Pageable pageable) {
        
        log.debug("GET /api/companies/search?q={} - Pesquisando empresas", q);
        Page<CompanyDTO> companies = companyService.search(q, pageable);
        return ResponseEntity.ok(ApiResponse.success(companies));
    }

    /**
     * Cria uma nova empresa.
     */
    @PostMapping
    @Operation(summary = "Criar empresa", description = "Cria uma nova empresa no sistema")
    @ApiResponses({
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Empresa criada com sucesso"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Dados inválidos")
    })
    public ResponseEntity<ApiResponse<CompanyDTO>> create(
            @Valid @RequestBody CreateCompanyRequest request) {
        
        log.info("POST /api/companies - Criando empresa: {}", request.getName());
        CompanyDTO company = companyService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Empresa criada com sucesso", company));
    }

    /**
     * Atualiza uma empresa.
     */
    @PutMapping("/{id}")
    @Operation(summary = "Atualizar empresa", description = "Atualiza dados de uma empresa existente")
    public ResponseEntity<ApiResponse<CompanyDTO>> update(
            @Parameter(description = "ID da empresa") @PathVariable Long id,
            @Valid @RequestBody UpdateCompanyRequest request) {
        
        log.info("PUT /api/companies/{} - Atualizando empresa", id);
        CompanyDTO company = companyService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Empresa atualizada", company));
    }

    /**
     * Remove uma empresa.
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "Remover empresa", description = "Remove uma empresa e todos os dados relacionados")
    @ApiResponses({
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Empresa removida"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Empresa não encontrada")
    })
    public ResponseEntity<ApiResponse<Void>> delete(
            @Parameter(description = "ID da empresa") @PathVariable Long id) {
        
        log.warn("DELETE /api/companies/{} - Removendo empresa", id);
        companyService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Empresa removida com sucesso", null));
    }

    /**
     * Suspende uma empresa.
     */
    @PostMapping("/{id}/suspend")
    @Operation(summary = "Suspender empresa", description = "Suspende uma empresa (bloqueia acesso)")
    public ResponseEntity<ApiResponse<CompanyDTO>> suspend(
            @Parameter(description = "ID da empresa") @PathVariable Long id) {
        
        log.warn("POST /api/companies/{}/suspend - Suspendendo empresa", id);
        CompanyDTO company = companyService.suspend(id);
        return ResponseEntity.ok(ApiResponse.success("Empresa suspensa", company));
    }

    /**
     * Ativa uma empresa.
     */
    @PostMapping("/{id}/activate")
    @Operation(summary = "Ativar empresa", description = "Ativa uma empresa suspensa/inativa")
    public ResponseEntity<ApiResponse<CompanyDTO>> activate(
            @Parameter(description = "ID da empresa") @PathVariable Long id) {
        
        log.info("POST /api/companies/{}/activate - Ativando empresa", id);
        CompanyDTO company = companyService.activate(id);
        return ResponseEntity.ok(ApiResponse.success("Empresa ativada", company));
    }

    /**
     * Atualiza plano da empresa.
     */
    @PutMapping("/{id}/plan")
    @Operation(summary = "Atualizar plano", description = "Atualiza o plano de uma empresa")
    public ResponseEntity<ApiResponse<CompanyDTO>> updatePlan(
            @Parameter(description = "ID da empresa") @PathVariable Long id,
            @Parameter(description = "Novo plano") @RequestParam CompanyPlan plan,
            @Parameter(description = "Data de expiração (opcional)") @RequestParam(required = false) LocalDateTime expiresAt) {
        
        log.info("PUT /api/companies/{}/plan - Atualizando plano para {}", id, plan);
        CompanyDTO company = companyService.updatePlan(id, plan, expiresAt);
        return ResponseEntity.ok(ApiResponse.success("Plano atualizado", company));
    }

    /**
     * Lista usuários de uma empresa.
     */
    @GetMapping("/{id}/users")
    @Operation(summary = "Listar usuários da empresa", description = "Lista todos os usuários vinculados à empresa")
    public ResponseEntity<ApiResponse<Page<User>>> getUsers(
            @Parameter(description = "ID da empresa") @PathVariable Long id,
            @PageableDefault(size = 20) Pageable pageable) {
        
        log.debug("GET /api/companies/{}/users - Listando usuários", id);
        Page<User> users = companyService.getCompanyUsers(id, pageable);
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    /**
     * Vincula usuário a empresa.
     */
    @PostMapping("/{id}/users/{userId}")
    @Operation(summary = "Vincular usuário", description = "Vincula um usuário à empresa")
    public ResponseEntity<ApiResponse<Void>> addUser(
            @Parameter(description = "ID da empresa") @PathVariable Long id,
            @Parameter(description = "ID do usuário") @PathVariable Long userId) {
        
        log.info("POST /api/companies/{}/users/{} - Vinculando usuário", id, userId);
        companyService.addUser(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Usuário vinculado à empresa", null));
    }

    /**
     * Remove usuário da empresa.
     */
    @DeleteMapping("/{id}/users/{userId}")
    @Operation(summary = "Remover usuário", description = "Remove vínculo de usuário com a empresa")
    public ResponseEntity<ApiResponse<Void>> removeUser(
            @Parameter(description = "ID da empresa") @PathVariable Long id,
            @Parameter(description = "ID do usuário") @PathVariable Long userId) {
        
        log.info("DELETE /api/companies/{}/users/{} - Removendo usuário", id, userId);
        companyService.removeUser(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Usuário removido da empresa", null));
    }

    /**
     * Lista workspaces de uma empresa.
     */
    @GetMapping("/{id}/workspaces")
    @Operation(summary = "Listar workspaces da empresa", description = "Lista todos os workspaces da empresa")
    public ResponseEntity<ApiResponse<Page<Workspace>>> getWorkspaces(
            @Parameter(description = "ID da empresa") @PathVariable Long id,
            @PageableDefault(size = 20) Pageable pageable) {
        
        log.debug("GET /api/companies/{}/workspaces - Listando workspaces", id);
        Page<Workspace> workspaces = companyService.getCompanyWorkspaces(id, pageable);
        return ResponseEntity.ok(ApiResponse.success(workspaces));
    }

    /**
     * Obtém estatísticas de empresas.
     */
    @GetMapping("/stats")
    @Operation(summary = "Estatísticas", description = "Retorna estatísticas gerais das empresas")
    public ResponseEntity<ApiResponse<CompanyStatsDTO>> getStats() {
        
        log.debug("GET /api/companies/stats - Obtendo estatísticas");
        CompanyStatsDTO stats = companyService.getStats();
        return ResponseEntity.ok(ApiResponse.success(stats));
    }
}
