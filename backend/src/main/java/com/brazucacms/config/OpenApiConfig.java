package com.brazucacms.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.ExternalDocumentation;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import io.swagger.v3.oas.models.tags.Tag;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Arrays;
import java.util.List;

/**
 * Configuração do OpenAPI/Swagger para documentação da API.
 * 
 * Esta classe configura:
 * - Informações básicas da API (título, versão, descrição)
 * - Esquemas de segurança (JWT Bearer e API Key)
 * - Tags organizacionais para endpoints
 * - Servidores disponíveis
 * 
 * Acesse a documentação em: http://localhost:8080/swagger-ui.html
 * 
 * @author Brazuca CMS Team
 * @version 1.0.0
 */
@Configuration
public class OpenApiConfig {

    @Value("${server.port:8080}")
    private String serverPort;

    /**
     * Configura e retorna a instância do OpenAPI.
     * Define todas as informações de documentação da API.
     * 
     * @return Configuração completa do OpenAPI
     */
    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
                // Informações principais da API
                .info(apiInfo())
                // Documentação externa
                .externalDocs(externalDocumentation())
                // Servidores disponíveis
                .servers(apiServers())
                // Tags organizacionais
                .tags(apiTags())
                // Requisitos de segurança globais
                .addSecurityItem(new SecurityRequirement().addList("bearerAuth"))
                .addSecurityItem(new SecurityRequirement().addList("apiKeyAuth"))
                // Componentes de segurança
                .components(securityComponents());
    }

    /**
     * Define as informações principais da API.
     * Inclui título, descrição, versão, contato e licença.
     */
    private Info apiInfo() {
        return new Info()
                .title("🇧🇷 Brazuca CMS API")
                .description("""
                    ## API RESTful do Brazuca CMS
                    
                    O **Brazuca CMS** é uma plataforma Headless CMS SaaS desenvolvida para simplificar 
                    a gestão de conteúdo para desenvolvedores e equipes de conteúdo.
                    
                    ### 🔐 Autenticação
                    
                    A API suporta dois métodos de autenticação:
                    
                    1. **JWT Bearer Token** - Para acesso ao painel administrativo
                       - Obtenha o token via `/api/auth/login`
                       - Use no header: `Authorization: Bearer {token}`
                    
                    2. **API Key** - Para acesso à API pública de conteúdo
                       - Crie uma API Key no painel
                       - Use no header: `X-API-Key: {sua-api-key}`
                    
                    ### 👥 Usuários de Teste
                    
                    | Email | Senha | Role |
                    |-------|-------|------|
                    | admin@brazucacms.com | admin123 | SUPER_ADMIN |
                    | operator@brazucacms.com | operator123 | ADMIN |
                    | viewer@brazucacms.com | viewer123 | USER |
                    
                    ### 📚 Recursos Principais
                    
                    - **Workspaces**: Ambientes isolados para projetos
                    - **Content Types**: Modelos de conteúdo personalizáveis
                    - **Entries**: Entradas de conteúdo
                    - **Media**: Gestão de arquivos e mídia
                    - **API Keys**: Chaves de acesso à API pública
                    - **Webhooks**: Notificações de eventos
                    """)
                .version("1.0.0")
                .contact(new Contact()
                        .name("Brazuca CMS Team")
                        .email("suporte@brazucacms.com")
                        .url("https://brazucacms.com"))
                .license(new License()
                        .name("MIT License")
                        .url("https://opensource.org/licenses/MIT"));
    }

    /**
     * Define documentação externa (GitHub, Wiki, etc.).
     */
    private ExternalDocumentation externalDocumentation() {
        return new ExternalDocumentation()
                .description("Documentação Completa e Código Fonte")
                .url("https://github.com/brazucacms/brazuca-cms");
    }

    /**
     * Define os servidores disponíveis para a API.
     */
    private List<Server> apiServers() {
        return Arrays.asList(
                new Server()
                        .url("http://localhost:" + serverPort)
                        .description("Servidor de Desenvolvimento Local"),
                new Server()
                        .url("https://api.brazucacms.com")
                        .description("Servidor de Produção")
        );
    }

    /**
     * Define as tags organizacionais para agrupar endpoints.
     */
    private List<Tag> apiTags() {
        return Arrays.asList(
                new Tag().name("Authentication").description("Endpoints de autenticação e autorização"),
                new Tag().name("Users").description("Gerenciamento de usuários"),
                new Tag().name("Workspaces").description("Gerenciamento de workspaces/projetos"),
                new Tag().name("Content Types").description("Gerenciamento de tipos de conteúdo"),
                new Tag().name("Entries").description("Gerenciamento de entradas de conteúdo"),
                new Tag().name("Media").description("Upload e gerenciamento de arquivos"),
                new Tag().name("API Keys").description("Gerenciamento de chaves de API"),
                new Tag().name("Webhooks").description("Configuração de webhooks"),
                new Tag().name("Settings").description("Configurações do sistema"),
                new Tag().name("Dashboard").description("Estatísticas e métricas"),
                new Tag().name("Analytics").description("Análise de uso e métricas"),
                new Tag().name("Public API").description("API pública para consumo de conteúdo")
        );
    }

    /**
     * Define os componentes de segurança (esquemas de autenticação).
     */
    private Components securityComponents() {
        return new Components()
                // Esquema de autenticação JWT Bearer
                .addSecuritySchemes("bearerAuth",
                        new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .name("bearerAuth")
                                .description("""
                                    Autenticação via JWT Bearer Token.
                                    
                                    1. Faça login em `/api/auth/login` com email e senha
                                    2. Copie o `accessToken` da resposta
                                    3. Clique em 'Authorize' e cole o token
                                    
                                    O token expira em 24 horas.
                                    """))
                // Esquema de autenticação API Key
                .addSecuritySchemes("apiKeyAuth",
                        new SecurityScheme()
                                .type(SecurityScheme.Type.APIKEY)
                                .in(SecurityScheme.In.HEADER)
                                .name("X-API-Key")
                                .description("""
                                    Autenticação via API Key para API pública.
                                    
                                    1. Crie uma API Key no painel administrativo
                                    2. Use o header `X-API-Key` com a chave gerada
                                    
                                    API Keys são usadas para acessar conteúdo público.
                                    """));
    }
}
