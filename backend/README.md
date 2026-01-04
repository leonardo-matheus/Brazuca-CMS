# 🇧🇷 Brazuca CMS - Backend API

Backend REST API para o Brazuca CMS, desenvolvido com Spring Boot 3 e Java 21.

## 🚀 Tecnologias

- **Java 21** - LTS mais recente
- **Spring Boot 3.2** - Framework principal
- **Spring Security** - Autenticação e autorização
- **Spring Data JPA** - Persistência de dados
- **H2 Database** - Banco de dados local (desenvolvimento)
- **JWT** - Tokens de autenticação
- **Lombok** - Redução de boilerplate
- **SpringDoc OpenAPI** - Documentação da API (Swagger)

## 📋 Pré-requisitos

- Java 21 ou superior
- Maven 3.8+

## 🔧 Instalação e Execução

### 1. Clone o repositório (se ainda não fez)

```bash
cd Brazuca-CMS/backend
```

### 2. Execute a aplicação

```bash
# Com Maven
./mvnw spring-boot:run

# Ou no Windows
mvnw.cmd spring-boot:run

# Ou compile e execute o JAR
./mvnw clean package
java -jar target/brazuca-cms-backend-1.0.0.jar
```

### 3. Acesse a API

- **API Base URL**: http://localhost:8080
- **Swagger UI**: http://localhost:8080/swagger-ui.html
- **H2 Console**: http://localhost:8080/h2-console
  - JDBC URL: `jdbc:h2:file:./data/brazucacms`
  - User: `sa`
  - Password: `password`

## 👤 Usuário Padrão

Na primeira execução, um usuário admin é criado automaticamente:

- **Email**: `admin@brazucacms.com`
- **Senha**: `admin123`

## 📚 Endpoints da API

### Autenticação (`/api/auth`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/auth/register` | Registrar novo usuário |
| POST | `/api/auth/login` | Login (retorna JWT) |
| POST | `/api/auth/refresh` | Renovar token de acesso |
| GET | `/api/auth/me` | Dados do usuário atual |
| POST | `/api/auth/logout` | Logout |

### Content Types (`/api/content-types`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/content-types` | Listar todos (paginado) |
| GET | `/api/content-types/list` | Listar todos (array) |
| GET | `/api/content-types/{id}` | Buscar por ID |
| GET | `/api/content-types/slug/{slug}` | Buscar por slug |
| POST | `/api/content-types` | Criar novo |
| PUT | `/api/content-types/{id}` | Atualizar |
| DELETE | `/api/content-types/{id}` | Deletar (soft delete) |
| GET | `/api/content-types/search?q=` | Pesquisar |

### Entries (`/api/entries`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/entries` | Listar todos (paginado) |
| GET | `/api/entries/{id}` | Buscar por ID |
| GET | `/api/entries/slug/{slug}` | Buscar por slug |
| GET | `/api/entries/content-type/{slug}` | Listar por content type |
| GET | `/api/entries/recent` | Entradas recentes |
| POST | `/api/entries` | Criar nova |
| PUT | `/api/entries/{id}` | Atualizar |
| POST | `/api/entries/{id}/publish` | Publicar |
| POST | `/api/entries/{id}/unpublish` | Despublicar |
| DELETE | `/api/entries/{id}` | Deletar |
| GET | `/api/entries/search?q=` | Pesquisar |

### Media (`/api/media`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/media` | Listar todos (paginado) |
| GET | `/api/media/{id}` | Buscar por ID |
| POST | `/api/media` | Upload de arquivo |
| PUT | `/api/media/{id}` | Atualizar metadados |
| DELETE | `/api/media/{id}` | Deletar arquivo |
| GET | `/api/media/file/{filename}` | Baixar arquivo |
| GET | `/api/media/search?q=` | Pesquisar |

### API Keys (`/api/api-keys`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/api-keys` | Listar todas do usuário |
| GET | `/api/api-keys/{id}` | Buscar por ID |
| POST | `/api/api-keys` | Criar nova |
| PUT | `/api/api-keys/{id}` | Atualizar |
| POST | `/api/api-keys/{id}/revoke` | Revogar |
| DELETE | `/api/api-keys/{id}` | Deletar |

### Settings (`/api/settings`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/settings` | Listar todas |
| GET | `/api/settings/public` | Listar públicas |
| GET | `/api/settings/group/{group}` | Listar por grupo |
| GET | `/api/settings/{id}` | Buscar por ID |
| GET | `/api/settings/key/{key}` | Buscar por chave |
| POST | `/api/settings` | Criar nova |
| PUT | `/api/settings/{id}` | Atualizar |
| PUT | `/api/settings/batch` | Atualizar múltiplas |
| DELETE | `/api/settings/{id}` | Deletar |

### Dashboard (`/api/dashboard`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/dashboard/stats` | Estatísticas do dashboard |

### API Pública (`/api/v1`)

Endpoints para consumo do conteúdo via API Key:

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/v1/content-types` | Listar content types |
| GET | `/api/v1/content-types/{slug}` | Buscar content type |
| GET | `/api/v1/{contentTypeSlug}` | Listar entradas publicadas |
| GET | `/api/v1/{contentTypeSlug}/{slug}` | Buscar entrada por slug |

## 🔐 Autenticação

### JWT (Dashboard)

Para endpoints `/api/*` (exceto `/api/v1`):

```http
Authorization: Bearer <seu_jwt_token>
```

### API Key (API Pública)

Para endpoints `/api/v1/*`:

```http
X-API-Key: <sua_api_key>
```

Ou via query parameter:
```
/api/v1/blog-posts?api_key=<sua_api_key>
```

## 🔄 Integração com Next.js Frontend

### Exemplo de configuração do serviço de API:

```typescript
// lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const api = {
  // Auth
  login: async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return res.json();
  },

  // Content Types
  getContentTypes: async (token: string) => {
    const res = await fetch(`${API_URL}/api/content-types`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return res.json();
  },

  // Public API
  getPublicEntries: async (contentType: string, apiKey: string) => {
    const res = await fetch(`${API_URL}/api/v1/${contentType}`, {
      headers: { 'X-API-Key': apiKey },
    });
    return res.json();
  },
};
```

## 📁 Estrutura do Projeto

```
backend/
├── src/main/java/com/brazucacms/
│   ├── BrazucaCmsApplication.java
│   ├── config/
│   │   ├── DataInitializer.java
│   │   ├── OpenApiConfig.java
│   │   ├── SecurityConfig.java
│   │   └── WebConfig.java
│   ├── controller/
│   │   ├── ApiKeyController.java
│   │   ├── AuthController.java
│   │   ├── ContentTypeController.java
│   │   ├── DashboardController.java
│   │   ├── EntryController.java
│   │   ├── MediaController.java
│   │   ├── PublicApiController.java
│   │   ├── SettingsController.java
│   │   └── UserController.java
│   ├── dto/
│   │   ├── auth/
│   │   ├── apikey/
│   │   ├── common/
│   │   ├── contenttype/
│   │   ├── dashboard/
│   │   ├── entry/
│   │   ├── media/
│   │   ├── settings/
│   │   └── user/
│   ├── exception/
│   │   ├── DuplicateResourceException.java
│   │   ├── FileStorageException.java
│   │   ├── GlobalExceptionHandler.java
│   │   └── ResourceNotFoundException.java
│   ├── model/
│   │   ├── ApiKey.java
│   │   ├── ContentType.java
│   │   ├── Entry.java
│   │   ├── Media.java
│   │   ├── Settings.java
│   │   └── User.java
│   ├── repository/
│   │   ├── ApiKeyRepository.java
│   │   ├── ContentTypeRepository.java
│   │   ├── EntryRepository.java
│   │   ├── MediaRepository.java
│   │   ├── SettingsRepository.java
│   │   └── UserRepository.java
│   ├── security/
│   │   ├── ApiKeyAuthenticationFilter.java
│   │   ├── CustomUserDetailsService.java
│   │   ├── JwtAuthenticationEntryPoint.java
│   │   ├── JwtAuthenticationFilter.java
│   │   └── JwtTokenProvider.java
│   └── service/
│       ├── ApiKeyService.java
│       ├── AuthService.java
│       ├── ContentTypeService.java
│       ├── DashboardService.java
│       ├── EntryService.java
│       ├── MediaService.java
│       ├── SettingsService.java
│       └── UserService.java
├── src/main/resources/
│   └── application.yml
├── pom.xml
└── README.md
```

## 🔧 Configuração

As principais configurações estão em `src/main/resources/application.yml`:

```yaml
# Porta do servidor
server.port: 8080

# JWT
jwt.secret: sua-chave-secreta
jwt.expiration: 86400000  # 24 horas

# Upload de arquivos
app.upload.dir: ./uploads
spring.servlet.multipart.max-file-size: 50MB

# CORS (origens permitidas)
app.cors.allowed-origins: http://localhost:3000
```

## 📝 Licença

MIT License - Veja [LICENSE](../LICENSE) para mais detalhes.
