package com.brazucacms.config;

import com.brazucacms.model.*;
import com.brazucacms.model.Company.CompanyPlan;
import com.brazucacms.model.Company.CompanyStatus;
import com.brazucacms.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * BRAZUCA CMS - Inicializador de Dados
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Esta classe é executada na inicialização do Spring Boot e cria dados de teste.
 * 
 * ESTRUTURA HIERÁRQUICA CRIADA:
 * 
 * ┌──────────────────────────────────────────────────────────────────────────────┐
 * │ SUPER_ADMIN (Dono do Sistema) - Sem empresa                                  │
 * │   └── admin@brazucacms.com / admin123                                        │
 * │       └── Workspace: Demo Brazuca CMS                                        │
 * ├──────────────────────────────────────────────────────────────────────────────┤
 * │ EMPRESA 1: Tech Solutions Ltda (Plano PROFESSIONAL)                          │
 * │   ├── COMPANY_OWNER: carlos@techsolutions.com / carlos123                    │
 * │   ├── ADMIN: maria@techsolutions.com / maria123                              │
 * │   ├── USER: joao@techsolutions.com / joao123                                 │
 * │   └── Workspace: Portal Tech Solutions                                       │
 * ├──────────────────────────────────────────────────────────────────────────────┤
 * │ EMPRESA 2: Companhia de Teatro (Plano STARTER)                               │
 * │   ├── COMPANY_OWNER: stefani@teatro.com / stefani123                         │
 * │   ├── USER: pedro@teatro.com / pedro123                                      │
 * │   └── Workspace: Site Companhia de Teatro                                    │
 * └──────────────────────────────────────────────────────────────────────────────┘
 * 
 * @author Brazuca CMS Team
 * @version 2.0.0
 */
@Configuration
@RequiredArgsConstructor
@Slf4j
public class DataInitializer {

    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final ContentTypeRepository contentTypeRepository;
    private final SettingsRepository settingsRepository;
    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Bean que executa a inicialização do banco de dados.
     * Cria empresas, usuários, workspaces e configurações padrão.
     */
    @Bean
    CommandLineRunner initDatabase() {
        return args -> {
            log.info("╔══════════════════════════════════════════════════════════════╗");
            log.info("║       BRAZUCA CMS - Inicializando Dados de Teste             ║");
            log.info("╚══════════════════════════════════════════════════════════════╝");
            
            // 1. Criar Super Admin (dono do sistema - sem empresa)
            User superAdmin = createSuperAdmin();
            
            // 2. Criar empresas com usuários e workspaces
            createCompanyTechSolutions();
            createCompanyTeatro();
            
            // 3. Criar configurações padrão do sistema
            createDefaultSettings();
            
            // 4. Criar planos de assinatura
            createSubscriptionPlans();
            
            log.info("╔══════════════════════════════════════════════════════════════╗");
            log.info("║       Dados de teste criados com sucesso!                    ║");
            log.info("╚══════════════════════════════════════════════════════════════╝");
            printTestUsers();
        };
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // SUPER ADMIN - DONO DO SISTEMA
    // ═══════════════════════════════════════════════════════════════════════════════
    
    /**
     * Cria o Super Administrador do sistema.
     * Este usuário NÃO pertence a nenhuma empresa e tem controle total sobre o sistema.
     * Pode criar/gerenciar empresas, ver estatísticas globais, etc.
     */
    private User createSuperAdmin() {
        if (userRepository.existsByEmail("admin@brazucacms.com")) {
            log.info("→ Super Admin já existe, pulando criação...");
            return userRepository.findByEmail("admin@brazucacms.com").orElse(null);
        }
        
        log.info("");
        log.info("━━━ Criando Super Administrador do Sistema ━━━");
        
        User admin = User.builder()
                .name("Super Administrador")
                .email("admin@brazucacms.com")
                .password(passwordEncoder.encode("admin123"))
                .role(User.Role.SUPER_ADMIN)
                .company(null) // SUPER_ADMIN não pertence a empresa
                .emailVerified(true)
                .active(true)
                .jobTitle("Administrador do Sistema")
                .department("Administração")
                .build();
        admin = userRepository.save(admin);
        log.info("  ✓ SUPER_ADMIN criado: admin@brazucacms.com / admin123");
        
        // Criar workspace de demonstração do sistema
        createSystemDemoWorkspace(admin);
        
        return admin;
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // EMPRESA 1: TECH SOLUTIONS LTDA
    // ═══════════════════════════════════════════════════════════════════════════════
    
    /**
     * Cria a empresa Tech Solutions com seus usuários e workspace.
     * Esta é uma empresa de tecnologia com plano PROFESSIONAL.
     */
    private void createCompanyTechSolutions() {
        if (companyRepository.existsBySlug("tech-solutions")) {
            log.info("→ Empresa Tech Solutions já existe, pulando...");
            return;
        }
        
        log.info("");
        log.info("━━━ Criando Empresa: Tech Solutions Ltda ━━━");
        
        // ===== Criar a empresa =====
        Company company = Company.builder()
                .name("Tech Solutions Ltda")
                .slug("tech-solutions")
                .description("Empresa de tecnologia especializada em soluções web e sistemas corporativos")
                .cnpj("12.345.678/0001-90")
                .contactEmail("contato@techsolutions.com")
                .contactPhone("(11) 3456-7890")
                .websiteUrl("https://techsolutions.com.br")
                .address("Av. Paulista, 1000 - Sala 501")
                .city("São Paulo")
                .state("SP")
                .country("Brasil")
                .zipCode("01310-100")
                .plan(CompanyPlan.PROFESSIONAL)
                .status(CompanyStatus.ACTIVE)
                .maxUsers(50)
                .maxWorkspaces(50)
                .storageLimitMb(51200L) // 50GB
                .build();
        company = companyRepository.save(company);
        log.info("  ✓ Empresa criada: {} (Plano: {})", company.getName(), company.getPlan());
        
        // ===== Criar COMPANY_OWNER =====
        User owner = User.builder()
                .name("Carlos Silva")
                .email("carlos@techsolutions.com")
                .password(passwordEncoder.encode("carlos123"))
                .role(User.Role.COMPANY_OWNER)
                .company(company)
                .emailVerified(true)
                .active(true)
                .jobTitle("CEO")
                .department("Diretoria")
                .phone("(11) 99999-1111")
                .build();
        owner = userRepository.save(owner);
        log.info("  ✓ COMPANY_OWNER criado: carlos@techsolutions.com / carlos123");
        
        // ===== Criar ADMIN da empresa =====
        User adminUser = User.builder()
                .name("Maria Santos")
                .email("maria@techsolutions.com")
                .password(passwordEncoder.encode("maria123"))
                .role(User.Role.ADMIN)
                .company(company)
                .emailVerified(true)
                .active(true)
                .jobTitle("Gerente de Projetos")
                .department("Tecnologia")
                .phone("(11) 99999-2222")
                .build();
        adminUser = userRepository.save(adminUser);
        log.info("  ✓ ADMIN criado: maria@techsolutions.com / maria123");
        
        // ===== Criar USER comum =====
        User regularUser = User.builder()
                .name("João Oliveira")
                .email("joao@techsolutions.com")
                .password(passwordEncoder.encode("joao123"))
                .role(User.Role.USER)
                .company(company)
                .emailVerified(true)
                .active(true)
                .jobTitle("Desenvolvedor Full Stack")
                .department("Tecnologia")
                .phone("(11) 99999-3333")
                .build();
        regularUser = userRepository.save(regularUser);
        log.info("  ✓ USER criado: joao@techsolutions.com / joao123");
        
        // ===== Criar Workspace da empresa =====
        Workspace workspace = Workspace.builder()
                .name("Portal Tech Solutions")
                .slug("portal-tech-solutions")
                .description("Portal corporativo da Tech Solutions - Blog, Notícias e Área do Cliente")
                .timezone("America/Sao_Paulo")
                .owner(owner)
                .company(company)
                .plan(Workspace.Plan.PRO)
                .status(Workspace.WorkspaceStatus.ACTIVE)
                .storageLimit(10000L) // 10GB
                .build();
        workspace = workspaceRepository.save(workspace);
        log.info("  ✓ Workspace criado: {}", workspace.getName());
        
        // Adicionar membros ao workspace
        addWorkspaceMember(workspace, owner, WorkspaceMember.MemberRole.ADMIN);
        addWorkspaceMember(workspace, adminUser, WorkspaceMember.MemberRole.EDITOR);
        addWorkspaceMember(workspace, regularUser, WorkspaceMember.MemberRole.VIEWER);
        
        // Criar content types de exemplo
        createSampleContentTypes(workspace, owner);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // EMPRESA 2: COMPANHIA DE TEATRO
    // ═══════════════════════════════════════════════════════════════════════════════
    
    /**
     * Cria a empresa Companhia de Teatro com seus usuários e workspace.
     * Esta é uma companhia de teatro com plano STARTER.
     */
    private void createCompanyTeatro() {
        if (companyRepository.existsBySlug("companhia-teatro")) {
            log.info("→ Empresa Companhia de Teatro já existe, pulando...");
            return;
        }
        
        log.info("");
        log.info("━━━ Criando Empresa: Companhia de Teatro ━━━");
        
        // ===== Criar a empresa =====
        Company company = Company.builder()
                .name("Companhia de Teatro")
                .slug("companhia-teatro")
                .description("Companhia de teatro especializada em espetáculos dramáticos e musicais")
                .cnpj("98.765.432/0001-10")
                .contactEmail("contato@teatro.com")
                .contactPhone("(21) 2345-6789")
                .websiteUrl("https://teatro.com.br")
                .address("Rua do Ouvidor, 50 - Sala 302")
                .city("Rio de Janeiro")
                .state("RJ")
                .country("Brasil")
                .zipCode("20040-030")
                .plan(CompanyPlan.STARTER)
                .status(CompanyStatus.ACTIVE)
                .maxUsers(10)
                .maxWorkspaces(10)
                .storageLimitMb(5120L) // 5GB
                .build();
        company = companyRepository.save(company);
        log.info("  ✓ Empresa criada: {} (Plano: {})", company.getName(), company.getPlan());
        
        // ===== Criar COMPANY_OWNER =====
        User owner = User.builder()
                .name("Stefani Romera")
                .email("stefani@teatro.com")
                .password(passwordEncoder.encode("stefani123"))
                .role(User.Role.COMPANY_OWNER)
                .company(company)
                .emailVerified(true)
                .active(true)
                .jobTitle("Diretora Artística")
                .department("Produção")
                .phone("(21) 98888-1111")
                .build();
        owner = userRepository.save(owner);
        log.info("  ✓ COMPANY_OWNER criado: stefani@teatro.com / stefani123");
        
        // ===== Criar USER comum =====
        User regularUser = User.builder()
                .name("Pedro Souza")
                .email("pedro@teatro.com")
                .password(passwordEncoder.encode("pedro123"))
                .role(User.Role.USER)
                .company(company)
                .emailVerified(true)
                .active(true)
                .jobTitle("Ator")
                .department("Elenco")
                .phone("(21) 98888-2222")
                .build();
        regularUser = userRepository.save(regularUser);
        log.info("  ✓ USER criado: pedro@teatro.com / pedro123");
        
        // ===== Criar Workspace da empresa =====
        Workspace workspace = Workspace.builder()
                .name("Site Companhia de Teatro")
                .slug("site-companhia-teatro")
                .description("Website institucional da Companhia de Teatro - Programação e Ingressos")
                .timezone("America/Sao_Paulo")
                .owner(owner)
                .company(company)
                .plan(Workspace.Plan.PRO)
                .status(Workspace.WorkspaceStatus.ACTIVE)
                .storageLimit(5000L) // 5GB
                .build();
        workspace = workspaceRepository.save(workspace);
        log.info("  ✓ Workspace criado: {}", workspace.getName());
        
        // Adicionar membros
        addWorkspaceMember(workspace, owner, WorkspaceMember.MemberRole.ADMIN);
        addWorkspaceMember(workspace, regularUser, WorkspaceMember.MemberRole.EDITOR);
        
        // Criar content types
        createSampleContentTypes(workspace, owner);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // MÉTODOS AUXILIARES
    // ═══════════════════════════════════════════════════════════════════════════════
    
    /**
     * Cria workspace de demonstração para o Super Admin.
     * Este workspace serve para demonstrar todas as funcionalidades do sistema.
     */
    private void createSystemDemoWorkspace(User admin) {
        if (workspaceRepository.existsBySlug("demo")) {
            return;
        }
        
        Workspace demoWorkspace = Workspace.builder()
                .name("Demo Brazuca CMS")
                .slug("demo")
                .description("Workspace de demonstração completa do sistema - Use para testar todas as funcionalidades")
                .timezone("America/Sao_Paulo")
                .owner(admin)
                .company(null) // Sem empresa - workspace do sistema
                .plan(Workspace.Plan.ENTERPRISE)
                .status(Workspace.WorkspaceStatus.ACTIVE)
                .storageLimit(100000L) // 100GB
                .build();
        demoWorkspace = workspaceRepository.save(demoWorkspace);
        log.info("  ✓ Workspace demo criado: {}", demoWorkspace.getName());
        
        addWorkspaceMember(demoWorkspace, admin, WorkspaceMember.MemberRole.ADMIN);
        createSampleContentTypes(demoWorkspace, admin);
    }

    /**
     * Adiciona um membro ao workspace com a role especificada.
     */
    private void addWorkspaceMember(Workspace workspace, User user, WorkspaceMember.MemberRole role) {
        // Verifica se já é membro
        boolean isMember = workspaceMemberRepository
                .findByWorkspaceAndStatus(workspace, WorkspaceMember.InviteStatus.ACTIVE)
                .stream()
                .anyMatch(m -> m.getUser() != null && m.getUser().getId().equals(user.getId()));
        
        if (!isMember) {
            WorkspaceMember member = WorkspaceMember.builder()
                    .workspace(workspace)
                    .user(user)
                    .role(role)
                    .status(WorkspaceMember.InviteStatus.ACTIVE)
                    .joinedAt(LocalDateTime.now())
                    .build();
            workspaceMemberRepository.save(member);
        }
    }

    /**
     * Cria Content Types de exemplo para um workspace.
     */
    private void createSampleContentTypes(Workspace workspace, User creator) {
        // ===== Blog Posts =====
        if (!contentTypeRepository.existsByWorkspaceIdAndSlug(workspace.getId(), "blog-posts")) {
            contentTypeRepository.save(ContentType.builder()
                    .name("Blog Posts")
                    .displayName("Publicações do Blog")
                    .slug("blog-posts")
                    .description("Artigos, notícias e publicações do blog")
                    .icon("📝")
                    .workspace(workspace)
                    .fields("[{\"name\":\"title\",\"type\":\"text\",\"required\":true,\"label\":\"Título\"},{\"name\":\"content\",\"type\":\"richtext\",\"required\":true,\"label\":\"Conteúdo\"},{\"name\":\"excerpt\",\"type\":\"textarea\",\"label\":\"Resumo\"},{\"name\":\"featuredImage\",\"type\":\"media\",\"label\":\"Imagem Destacada\"},{\"name\":\"category\",\"type\":\"select\",\"label\":\"Categoria\",\"options\":[\"Tecnologia\",\"Marketing\",\"Novidades\"]},{\"name\":\"tags\",\"type\":\"tags\",\"label\":\"Tags\"}]")
                    .status(ContentType.ContentTypeStatus.ACTIVE)
                    .createdBy(creator)
                    .build());
        }
        
        // ===== Páginas =====
        if (!contentTypeRepository.existsByWorkspaceIdAndSlug(workspace.getId(), "pages")) {
            contentTypeRepository.save(ContentType.builder()
                    .name("Pages")
                    .displayName("Páginas Estáticas")
                    .slug("pages")
                    .description("Páginas estáticas do site (Sobre, Contato, etc)")
                    .icon("📄")
                    .workspace(workspace)
                    .fields("[{\"name\":\"title\",\"type\":\"text\",\"required\":true,\"label\":\"Título\"},{\"name\":\"content\",\"type\":\"richtext\",\"required\":true,\"label\":\"Conteúdo\"},{\"name\":\"seoTitle\",\"type\":\"text\",\"label\":\"Título SEO\"},{\"name\":\"seoDescription\",\"type\":\"textarea\",\"label\":\"Meta Description\"}]")
                    .status(ContentType.ContentTypeStatus.ACTIVE)
                    .createdBy(creator)
                    .build());
        }
        
        // ===== Produtos (para demonstração) =====
        if (!contentTypeRepository.existsByWorkspaceIdAndSlug(workspace.getId(), "products")) {
            contentTypeRepository.save(ContentType.builder()
                    .name("Products")
                    .displayName("Produtos")
                    .slug("products")
                    .description("Catálogo de produtos e serviços")
                    .icon("🛍️")
                    .workspace(workspace)
                    .fields("[{\"name\":\"name\",\"type\":\"text\",\"required\":true,\"label\":\"Nome\"},{\"name\":\"description\",\"type\":\"richtext\",\"label\":\"Descrição\"},{\"name\":\"price\",\"type\":\"number\",\"label\":\"Preço\"},{\"name\":\"images\",\"type\":\"media\",\"label\":\"Imagens\",\"multiple\":true},{\"name\":\"sku\",\"type\":\"text\",\"label\":\"SKU\"},{\"name\":\"inStock\",\"type\":\"boolean\",\"label\":\"Em Estoque\"}]")
                    .status(ContentType.ContentTypeStatus.ACTIVE)
                    .createdBy(creator)
                    .build());
        }
    }

    /**
     * Cria configurações padrão do sistema.
     */
    private void createDefaultSettings() {
        if (settingsRepository.existsByKey("site_name")) {
            return;
        }
        
        log.info("");
        log.info("━━━ Criando Configurações do Sistema ━━━");
        
        settingsRepository.save(Settings.builder()
                .key("site_name")
                .value("Brazuca CMS")
                .type("string")
                .description("Nome do sistema exibido na interface")
                .group("general")
                .isPublic(true)
                .build());
        
        settingsRepository.save(Settings.builder()
                .key("site_description")
                .value("CMS Headless Brasileiro para Gestão de Conteúdo")
                .type("string")
                .description("Descrição do sistema")
                .group("general")
                .isPublic(true)
                .build());
        
        settingsRepository.save(Settings.builder()
                .key("allow_registration")
                .value("true")
                .type("boolean")
                .description("Permitir registro de novos usuários")
                .group("auth")
                .isPublic(false)
                .build());
        
        settingsRepository.save(Settings.builder()
                .key("default_language")
                .value("pt-BR")
                .type("string")
                .description("Idioma padrão do sistema")
                .group("general")
                .isPublic(true)
                .build());
        
        settingsRepository.save(Settings.builder()
                .key("max_upload_size_mb")
                .value("50")
                .type("number")
                .description("Tamanho máximo de upload em MB")
                .group("media")
                .isPublic(false)
                .build());
        
        log.info("  ✓ Configurações padrão criadas");
    }

    /**
     * Imprime a lista de usuários de teste no console para referência.
     */
    private void printTestUsers() {
        log.info("");
        log.info("╔══════════════════════════════════════════════════════════════════╗");
        log.info("║                    USUÁRIOS DE TESTE DISPONÍVEIS                 ║");
        log.info("╠══════════════════════════════════════════════════════════════════╣");
        log.info("║                                                                  ║");
        log.info("║ 🔑 SUPER ADMIN (Dono do Sistema)                                 ║");
        log.info("║    Email: admin@brazucacms.com                                   ║");
        log.info("║    Senha: admin123                                               ║");
        log.info("║    Pode: Gerenciar empresas, ver estatísticas globais            ║");
        log.info("║                                                                  ║");
        log.info("╠══════════════════════════════════════════════════════════════════╣");
        log.info("║                                                                  ║");
        log.info("║ 🏢 TECH SOLUTIONS LTDA (Plano Professional)                      ║");
        log.info("║    ┌────────────────────────────────────────────────────────┐    ║");
        log.info("║    │ 👑 carlos@techsolutions.com / carlos123 [COMPANY_OWNER]│    ║");
        log.info("║    │ 🛡️  maria@techsolutions.com / maria123   [ADMIN]        │    ║");
        log.info("║    │ 👤 joao@techsolutions.com / joao123      [USER]        │    ║");
        log.info("║    └────────────────────────────────────────────────────────┘    ║");
        log.info("║                                                                  ║");
        log.info("╠══════════════════════════════════════════════════════════════════╣");
        log.info("║                                                                  ║");
        log.info("║ 🏢 AGÊNCIA DIGITAL ABC (Plano Starter)                           ║");
        log.info("║    ┌────────────────────────────────────────────────────────┐    ║");
        log.info("║    │ 👑 stefani@agenciaabc.com / stefani123  [COMPANY_OWNER]│    ║");
        log.info("║    │ 👤 pedro@agenciaabc.com / pedro123      [USER]         │    ║");
        log.info("║    └────────────────────────────────────────────────────────┘    ║");
        log.info("║                                                                  ║");
        log.info("╠══════════════════════════════════════════════════════════════════╣");
        log.info("║                                                                  ║");
        log.info("║ 📚 DOCUMENTAÇÃO E FERRAMENTAS                                    ║");
        log.info("║    Swagger UI:  http://localhost:8080/swagger-ui.html            ║");
        log.info("║    H2 Console:  http://localhost:8080/h2-console                 ║");
        log.info("║    API Base:    http://localhost:8080/api                        ║");
        log.info("║                                                                  ║");
        log.info("╚══════════════════════════════════════════════════════════════════╝");
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // PLANOS DE ASSINATURA
    // ═══════════════════════════════════════════════════════════════════════════════

    /**
     * Cria os planos de assinatura padrão.
     */
    private void createSubscriptionPlans() {
        if (subscriptionPlanRepository.existsByName("starter")) {
            log.info("→ Planos de assinatura já existem, pulando...");
            return;
        }

        log.info("");
        log.info("━━━ Criando Planos de Assinatura ━━━");

        // Plano Starter (Gratuito)
        subscriptionPlanRepository.save(SubscriptionPlan.builder()
                .name("starter")
                .displayName("Starter")
                .description("Perfeito para projetos pessoais e pequenos sites.")
                .priceMonthly(BigDecimal.ZERO)
                .priceYearly(BigDecimal.ZERO)
                .stripePriceIdMonthly("price_1Slx3UIrEucdbP0DagQS11j0")
                .stripePriceIdYearly("price_1Slx3UIrEucdbP0DagQS11j0")
                .maxProjects(1)
                .maxUsers(3)
                .maxApiRequests(10000L)
                .maxStorageMb(1024L) // 1GB
                .maxWebhooks(5)
                .hasGraphql(false)
                .hasWebhooks(true)
                .hasPrioritySupport(false)
                .hasSso(false)
                .hasCustomDomain(false)
                .hasAdvancedAnalytics(false)
                .sortOrder(1)
                .active(true)
                .build());
        log.info("  ✓ Plano Starter criado (Gratuito)");

        // Plano Pro
        subscriptionPlanRepository.save(SubscriptionPlan.builder()
                .name("pro")
                .displayName("Pro")
                .description("Ideal para equipes e projetos em crescimento.")
                .priceMonthly(new BigDecimal("99.00"))
                .priceYearly(new BigDecimal("990.00"))
                .stripePriceIdMonthly("price_1SlwlkIrEucdbP0DPNxfFDNW")
                .stripePriceIdYearly("price_1SlwlkIrEucdbP0DWpAQJU8R")
                .maxProjects(5)
                .maxUsers(10)
                .maxApiRequests(100000L)
                .maxStorageMb(25600L) // 25GB
                .maxWebhooks(-1) // ilimitado
                .hasGraphql(true)
                .hasWebhooks(true)
                .hasPrioritySupport(true)
                .hasSso(false)
                .hasCustomDomain(true)
                .hasAdvancedAnalytics(true)
                .sortOrder(2)
                .active(true)
                .build());
        log.info("  ✓ Plano Pro criado (R$ 99/mês)");

        // Plano Enterprise
        subscriptionPlanRepository.save(SubscriptionPlan.builder()
                .name("enterprise")
                .displayName("Enterprise")
                .description("Para grandes organizações com necessidades avançadas.")
                .priceMonthly(new BigDecimal("499.00"))
                .priceYearly(new BigDecimal("4990.00"))
                .stripePriceIdMonthly("price_1SlwmfIrEucdbP0DEIey5G9N")
                .stripePriceIdYearly("price_1SlwmfIrEucdbP0D1vGdLi6Q")
                .maxProjects(-1) // ilimitado
                .maxUsers(-1)    // ilimitado
                .maxApiRequests(-1L) // ilimitado
                .maxStorageMb(-1L)   // ilimitado
                .maxWebhooks(-1)     // ilimitado
                .hasGraphql(true)
                .hasWebhooks(true)
                .hasPrioritySupport(true)
                .hasSso(true)
                .hasCustomDomain(true)
                .hasAdvancedAnalytics(true)
                .sortOrder(3)
                .active(true)
                .build());
        log.info("  ✓ Plano Enterprise criado (R$ 499/mês)");
    }
}
