# 🚀 CMS SaaS - API Documentation
## Complete REST API Specification para Backend

---

## 📋 1. OVERVIEW

**Base URL:** `https://api.cms-saas.com/v1`  
**Authentication:** Bearer Token (JWT)  
**Response Format:** JSON  
**Rate Limit:** 1,000 requests/min per API key  
**Status Codes:** 200 (OK), 201 (Created), 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), 500 (Server Error)

### Environment URLs
```
Development:  http://localhost:3001/api/v1
Staging:      https://staging-api.cms-saas.com/v1
Production:   https://api.cms-saas.com/v1
```

---

## 🔐 2. AUTHENTICATION

### Register New User
```
POST /auth/register
Content-Type: application/json

{
  "name": "João Silva",
  "email": "joao@example.com",
  "password": "SecurePass123!",
  "acceptTerms": true
}

Response: 201 Created
{
  "id": "user_abc123",
  "email": "joao@example.com",
  "name": "João Silva",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "createdAt": "2026-01-03T22:00:00Z"
}
```

### Login
```
POST /auth/login
Content-Type: application/json

{
  "email": "joao@example.com",
  "password": "SecurePass123!"
}

Response: 200 OK
{
  "id": "user_abc123",
  "email": "joao@example.com",
  "name": "João Silva",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "workspace": {
    "id": "ws_123",
    "name": "Meu CMS",
    "role": "admin"
  }
}
```

### Refresh Token
```
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}

Response: 200 OK
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Logout
```
POST /auth/logout
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

Response: 200 OK
{
  "message": "Logged out successfully"
}
```

### Verify Email
```
POST /auth/verify-email
Content-Type: application/json

{
  "token": "email_verification_token_123"
}

Response: 200 OK
{
  "verified": true,
  "message": "Email verified successfully"
}
```

---

## 👥 3. WORKSPACES

### Create Workspace
```
POST /workspaces
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "name": "Meu CMS SaaS",
  "description": "CMS para meu blog",
  "timezone": "America/Sao_Paulo"
}

Response: 201 Created
{
  "id": "ws_abc123",
  "name": "Meu CMS SaaS",
  "description": "CMS para meu blog",
  "slug": "meu-cms-saas",
  "customUrl": "https://api.cms-saas.com/ws/meu-cms-saas",
  "timezone": "America/Sao_Paulo",
  "owner": "user_abc123",
  "members": 1,
  "createdAt": "2026-01-03T22:00:00Z",
  "updatedAt": "2026-01-03T22:00:00Z"
}
```

### Get Workspace Details
```
GET /workspaces/{workspaceId}
Authorization: Bearer TOKEN

Response: 200 OK
{
  "id": "ws_abc123",
  "name": "Meu CMS SaaS",
  "description": "CMS para meu blog",
  "slug": "meu-cms-saas",
  "customUrl": "https://api.cms-saas.com/ws/meu-cms-saas",
  "timezone": "America/Sao_Paulo",
  "owner": "user_abc123",
  "members": 1,
  "storage": {
    "used": 2300,
    "limit": 10000,
    "unit": "MB"
  },
  "plan": "pro",
  "createdAt": "2026-01-03T22:00:00Z",
  "updatedAt": "2026-01-03T22:00:00Z"
}
```

### Update Workspace
```
PUT /workspaces/{workspaceId}
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "name": "Novo Nome",
  "description": "Nova descrição",
  "timezone": "America/Sao_Paulo"
}

Response: 200 OK
{
  "id": "ws_abc123",
  "name": "Novo Nome",
  "description": "Nova descrição",
  ...
}
```

### List All Workspaces
```
GET /workspaces
Authorization: Bearer TOKEN

Response: 200 OK
{
  "data": [
    {
      "id": "ws_abc123",
      "name": "Workspace 1",
      "role": "admin",
      "createdAt": "2026-01-03T22:00:00Z"
    },
    {
      "id": "ws_def456",
      "name": "Workspace 2",
      "role": "editor",
      "createdAt": "2026-01-02T22:00:00Z"
    }
  ],
  "total": 2,
  "page": 1,
  "limit": 10
}
```

### List Workspace Members
```
GET /workspaces/{workspaceId}/members
Authorization: Bearer TOKEN

Response: 200 OK
{
  "data": [
    {
      "id": "member_abc123",
      "name": "João Silva",
      "email": "joao@example.com",
      "role": "admin",
      "joinedAt": "2026-01-03T22:00:00Z"
    },
    {
      "id": "member_def456",
      "name": "Maria Santos",
      "email": "maria@example.com",
      "role": "editor",
      "joinedAt": "2026-01-02T22:00:00Z"
    }
  ],
  "total": 2
}
```

### Invite Member to Workspace
```
POST /workspaces/{workspaceId}/members/invite
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "email": "novo@example.com",
  "role": "editor"
}

Response: 201 Created
{
  "id": "invite_abc123",
  "email": "novo@example.com",
  "role": "editor",
  "status": "pending",
  "inviteToken": "invite_token_123",
  "inviteUrl": "https://cms-saas.com/invite/invite_token_123",
  "createdAt": "2026-01-03T22:00:00Z",
  "expiresAt": "2026-01-10T22:00:00Z"
}
```

### Update Member Role
```
PUT /workspaces/{workspaceId}/members/{memberId}
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "role": "admin"
}

Response: 200 OK
{
  "id": "member_abc123",
  "name": "Maria Santos",
  "email": "maria@example.com",
  "role": "admin",
  "updatedAt": "2026-01-03T22:00:00Z"
}
```

### Remove Member
```
DELETE /workspaces/{workspaceId}/members/{memberId}
Authorization: Bearer TOKEN

Response: 204 No Content
```

---

## 📁 4. CONTENT TYPES

### Create Content Type
```
POST /workspaces/{workspaceId}/content-types
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "name": "Article",
  "displayName": "Artigos",
  "description": "Blog articles",
  "fields": [
    {
      "id": "title",
      "name": "title",
      "type": "text",
      "displayName": "Title",
      "required": true,
      "unique": false,
      "validation": {
        "minLength": 3,
        "maxLength": 200
      }
    },
    {
      "id": "body",
      "name": "body",
      "type": "richtext",
      "displayName": "Body",
      "required": true,
      "unique": false
    },
    {
      "id": "featuredImage",
      "name": "featuredImage",
      "type": "media",
      "displayName": "Featured Image",
      "required": false,
      "unique": false
    },
    {
      "id": "author",
      "name": "author",
      "type": "relation",
      "displayName": "Author",
      "required": true,
      "relationType": "Author"
    },
    {
      "id": "tags",
      "name": "tags",
      "type": "array",
      "displayName": "Tags",
      "required": false,
      "items": {
        "type": "text"
      }
    }
  ]
}

Response: 201 Created
{
  "id": "ct_abc123",
  "name": "Article",
  "displayName": "Artigos",
  "description": "Blog articles",
  "slug": "article",
  "status": "draft",
  "fieldCount": 5,
  "fields": [...],
  "createdBy": "user_abc123",
  "createdAt": "2026-01-03T22:00:00Z",
  "updatedAt": "2026-01-03T22:00:00Z"
}
```

### Get Content Type
```
GET /workspaces/{workspaceId}/content-types/{contentTypeId}
Authorization: Bearer TOKEN

Response: 200 OK
{
  "id": "ct_abc123",
  "name": "Article",
  "displayName": "Artigos",
  "description": "Blog articles",
  "slug": "article",
  "status": "active",
  "fieldCount": 5,
  "entryCount": 45,
  "fields": [
    {
      "id": "title",
      "name": "title",
      "type": "text",
      "displayName": "Title",
      "required": true,
      "validation": { "minLength": 3, "maxLength": 200 }
    },
    ...
  ],
  "createdBy": "user_abc123",
  "createdAt": "2026-01-03T22:00:00Z",
  "updatedAt": "2026-01-03T22:00:00Z"
}
```

### List Content Types
```
GET /workspaces/{workspaceId}/content-types?status=all&limit=10&page=1
Authorization: Bearer TOKEN

Response: 200 OK
{
  "data": [
    {
      "id": "ct_abc123",
      "name": "Article",
      "displayName": "Artigos",
      "slug": "article",
      "status": "active",
      "fieldCount": 5,
      "entryCount": 45,
      "createdAt": "2026-01-03T22:00:00Z"
    },
    {
      "id": "ct_def456",
      "name": "Author",
      "displayName": "Autores",
      "slug": "author",
      "status": "active",
      "fieldCount": 3,
      "entryCount": 12,
      "createdAt": "2026-01-02T22:00:00Z"
    }
  ],
  "total": 2,
  "page": 1,
  "limit": 10
}
```

### Update Content Type
```
PUT /workspaces/{workspaceId}/content-types/{contentTypeId}
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "name": "Article",
  "displayName": "Artigos (Atualizado)",
  "description": "Updated description",
  "fields": [...]
}

Response: 200 OK
{
  "id": "ct_abc123",
  "name": "Article",
  "displayName": "Artigos (Atualizado)",
  ...
}
```

### Publish Content Type
```
POST /workspaces/{workspaceId}/content-types/{contentTypeId}/publish
Authorization: Bearer TOKEN

Response: 200 OK
{
  "id": "ct_abc123",
  "name": "Article",
  "status": "active",
  "publishedAt": "2026-01-03T22:00:00Z"
}
```

### Delete Content Type
```
DELETE /workspaces/{workspaceId}/content-types/{contentTypeId}
Authorization: Bearer TOKEN

Response: 204 No Content
```

---

## 📄 5. ENTRIES

### Create Entry
```
POST /workspaces/{workspaceId}/content-types/{contentTypeId}/entries
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "title": "Meu Primeiro Artigo",
  "body": "<p>Conteúdo do artigo...</p>",
  "featuredImage": "media_abc123",
  "author": "entry_author_123",
  "tags": ["tecnologia", "javascript"],
  "status": "draft"
}

Response: 201 Created
{
  "id": "entry_abc123",
  "contentType": "ct_abc123",
  "title": "Meu Primeiro Artigo",
  "body": "<p>Conteúdo do artigo...</p>",
  "featuredImage": "media_abc123",
  "author": "entry_author_123",
  "tags": ["tecnologia", "javascript"],
  "status": "draft",
  "version": 1,
  "author": "user_abc123",
  "createdAt": "2026-01-03T22:00:00Z",
  "updatedAt": "2026-01-03T22:00:00Z",
  "publishedAt": null
}
```

### Get Entry
```
GET /workspaces/{workspaceId}/content-types/{contentTypeId}/entries/{entryId}
Authorization: Bearer TOKEN

Response: 200 OK
{
  "id": "entry_abc123",
  "contentType": "ct_abc123",
  "title": "Meu Primeiro Artigo",
  "body": "<p>Conteúdo do artigo...</p>",
  "featuredImage": {
    "id": "media_abc123",
    "url": "https://storage.cms-saas.com/media_abc123.jpg",
    "name": "featured.jpg",
    "size": 1024000,
    "type": "image/jpeg"
  },
  "author": {
    "id": "entry_author_123",
    "name": "João Silva",
    "email": "joao@example.com"
  },
  "tags": ["tecnologia", "javascript"],
  "status": "draft",
  "version": 1,
  "createdBy": "user_abc123",
  "createdAt": "2026-01-03T22:00:00Z",
  "updatedAt": "2026-01-03T22:00:00Z",
  "publishedAt": null,
  "history": [
    {
      "version": 1,
      "changes": "Initial creation",
      "changedBy": "user_abc123",
      "changedAt": "2026-01-03T22:00:00Z"
    }
  ]
}
```

### List Entries
```
GET /workspaces/{workspaceId}/content-types/{contentTypeId}/entries?status=all&search=artigo&limit=20&page=1&sort=-createdAt
Authorization: Bearer TOKEN

Response: 200 OK
{
  "data": [
    {
      "id": "entry_abc123",
      "title": "Meu Primeiro Artigo",
      "status": "draft",
      "author": "user_abc123",
      "createdAt": "2026-01-03T22:00:00Z",
      "updatedAt": "2026-01-03T22:00:00Z"
    },
    {
      "id": "entry_def456",
      "title": "Segundo Artigo",
      "status": "published",
      "author": "user_def456",
      "createdAt": "2026-01-02T22:00:00Z",
      "updatedAt": "2026-01-02T22:00:00Z"
    }
  ],
  "total": 45,
  "page": 1,
  "limit": 20,
  "totalPages": 3
}
```

### Update Entry
```
PUT /workspaces/{workspaceId}/content-types/{contentTypeId}/entries/{entryId}
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "title": "Artigo Atualizado",
  "body": "<p>Novo conteúdo...</p>",
  "tags": ["nodejs", "backend"]
}

Response: 200 OK
{
  "id": "entry_abc123",
  "title": "Artigo Atualizado",
  "body": "<p>Novo conteúdo...</p>",
  "tags": ["nodejs", "backend"],
  "version": 2,
  "updatedAt": "2026-01-03T23:00:00Z",
  "history": [
    {
      "version": 2,
      "changes": "Updated title, body, tags",
      "changedBy": "user_abc123",
      "changedAt": "2026-01-03T23:00:00Z"
    }
  ]
}
```

### Publish Entry
```
POST /workspaces/{workspaceId}/content-types/{contentTypeId}/entries/{entryId}/publish
Authorization: Bearer TOKEN

Response: 200 OK
{
  "id": "entry_abc123",
  "status": "published",
  "publishedAt": "2026-01-03T23:00:00Z"
}
```

### Unpublish Entry
```
POST /workspaces/{workspaceId}/content-types/{contentTypeId}/entries/{entryId}/unpublish
Authorization: Bearer TOKEN

Response: 200 OK
{
  "id": "entry_abc123",
  "status": "draft",
  "publishedAt": null
}
```

### Delete Entry
```
DELETE /workspaces/{workspaceId}/content-types/{contentTypeId}/entries/{entryId}
Authorization: Bearer TOKEN

Response: 204 No Content
```

### Get Entry History
```
GET /workspaces/{workspaceId}/content-types/{contentTypeId}/entries/{entryId}/history
Authorization: Bearer TOKEN

Response: 200 OK
{
  "data": [
    {
      "version": 2,
      "changes": "Updated title, body, tags",
      "changedBy": "user_abc123",
      "changedAt": "2026-01-03T23:00:00Z",
      "snapshot": {
        "title": "Artigo Atualizado",
        "body": "<p>Novo conteúdo...</p>",
        "tags": ["nodejs", "backend"]
      }
    },
    {
      "version": 1,
      "changes": "Initial creation",
      "changedBy": "user_abc123",
      "changedAt": "2026-01-03T22:00:00Z",
      "snapshot": {
        "title": "Meu Primeiro Artigo",
        "body": "<p>Conteúdo do artigo...</p>",
        "tags": ["tecnologia", "javascript"]
      }
    }
  ]
}
```

### Restore Entry Version
```
POST /workspaces/{workspaceId}/content-types/{contentTypeId}/entries/{entryId}/restore/{version}
Authorization: Bearer TOKEN

Response: 200 OK
{
  "id": "entry_abc123",
  "version": 3,
  "restoredFrom": 1,
  "message": "Entry restored to version 1",
  "restoredAt": "2026-01-03T23:30:00Z"
}
```

---

## 🖼️ 6. MEDIA LIBRARY

### Upload Media
```
POST /workspaces/{workspaceId}/media/upload
Authorization: Bearer TOKEN
Content-Type: multipart/form-data

file: [binary image data]
folder: "/blog" (optional)

Response: 201 Created
{
  "id": "media_abc123",
  "name": "featured.jpg",
  "url": "https://storage.cms-saas.com/media_abc123.jpg",
  "size": 1024000,
  "type": "image/jpeg",
  "width": 1200,
  "height": 800,
  "folder": "/blog",
  "uploadedBy": "user_abc123",
  "uploadedAt": "2026-01-03T22:00:00Z"
}
```

### List Media
```
GET /workspaces/{workspaceId}/media?folder=/blog&limit=50&page=1&sort=-uploadedAt
Authorization: Bearer TOKEN

Response: 200 OK
{
  "data": [
    {
      "id": "media_abc123",
      "name": "featured.jpg",
      "url": "https://storage.cms-saas.com/media_abc123.jpg",
      "size": 1024000,
      "type": "image/jpeg",
      "width": 1200,
      "height": 800,
      "folder": "/blog",
      "uploadedAt": "2026-01-03T22:00:00Z"
    }
  ],
  "total": 127,
  "page": 1,
  "limit": 50,
  "totalUsage": 2300,
  "storageLimit": 10000,
  "unit": "MB"
}
```

### Get Media Details
```
GET /workspaces/{workspaceId}/media/{mediaId}
Authorization: Bearer TOKEN

Response: 200 OK
{
  "id": "media_abc123",
  "name": "featured.jpg",
  "url": "https://storage.cms-saas.com/media_abc123.jpg",
  "size": 1024000,
  "type": "image/jpeg",
  "width": 1200,
  "height": 800,
  "folder": "/blog",
  "uploadedBy": "user_abc123",
  "uploadedAt": "2026-01-03T22:00:00Z",
  "usedIn": [
    {
      "contentType": "Article",
      "entry": "entry_abc123",
      "field": "featuredImage"
    }
  ]
}
```

### Delete Media
```
DELETE /workspaces/{workspaceId}/media/{mediaId}
Authorization: Bearer TOKEN

Response: 204 No Content
```

### Create Media Folder
```
POST /workspaces/{workspaceId}/media/folders
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "name": "blog",
  "parent": "/" (optional)
}

Response: 201 Created
{
  "id": "folder_abc123",
  "name": "blog",
  "path": "/blog",
  "createdAt": "2026-01-03T22:00:00Z"
}
```

---

## 🔑 7. API KEYS

### Generate API Key
```
POST /workspaces/{workspaceId}/api-keys
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "name": "Mobile App",
  "description": "API key for mobile app",
  "permissions": ["read:entries", "read:media"]
}

Response: 201 Created
{
  "id": "key_abc123",
  "key": "sk_live_abc123xyz789...",
  "name": "Mobile App",
  "description": "API key for mobile app",
  "permissions": ["read:entries", "read:media"],
  "status": "active",
  "createdAt": "2026-01-03T22:00:00Z",
  "lastUsedAt": null,
  "usageStats": {
    "requests": 0,
    "lastMonth": 0
  }
}
```

### List API Keys
```
GET /workspaces/{workspaceId}/api-keys
Authorization: Bearer TOKEN

Response: 200 OK
{
  "data": [
    {
      "id": "key_abc123",
      "key": "sk_live_abc123xyz789...",
      "name": "Mobile App",
      "description": "API key for mobile app",
      "permissions": ["read:entries", "read:media"],
      "status": "active",
      "createdAt": "2026-01-03T22:00:00Z",
      "lastUsedAt": "2026-01-03T23:00:00Z",
      "usageStats": {
        "requests": 45234,
        "lastMonth": 12000
      }
    }
  ],
  "total": 1,
  "rateLimit": {
    "requestsPerMin": 1000,
    "currentUsage": 456
  }
}
```

### Revoke API Key
```
DELETE /workspaces/{workspaceId}/api-keys/{keyId}
Authorization: Bearer TOKEN

Response: 204 No Content
```

### Rotate API Key
```
POST /workspaces/{workspaceId}/api-keys/{keyId}/rotate
Authorization: Bearer TOKEN

Response: 200 OK
{
  "id": "key_abc123",
  "newKey": "sk_live_new_key_123...",
  "oldKey": "sk_live_abc123xyz789...",
  "rotatedAt": "2026-01-03T23:00:00Z",
  "message": "Old key will be inactive in 24 hours"
}
```

---

## 🔗 8. WEBHOOKS

### Create Webhook
```
POST /workspaces/{workspaceId}/webhooks
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "url": "https://example.com/webhooks",
  "events": ["entry.created", "entry.published", "entry.deleted"],
  "description": "Sync entries to external database"
}

Response: 201 Created
{
  "id": "webhook_abc123",
  "url": "https://example.com/webhooks",
  "events": ["entry.created", "entry.published", "entry.deleted"],
  "description": "Sync entries to external database",
  "status": "active",
  "headers": {},
  "createdAt": "2026-01-03T22:00:00Z",
  "testUrl": "https://api.cms-saas.com/webhooks/test/webhook_abc123"
}
```

### List Webhooks
```
GET /workspaces/{workspaceId}/webhooks
Authorization: Bearer TOKEN

Response: 200 OK
{
  "data": [
    {
      "id": "webhook_abc123",
      "url": "https://example.com/webhooks",
      "events": ["entry.created", "entry.published", "entry.deleted"],
      "description": "Sync entries to external database",
      "status": "active",
      "createdAt": "2026-01-03T22:00:00Z",
      "failureCount": 0,
      "lastFailedAt": null,
      "lastSuccessAt": "2026-01-03T23:00:00Z"
    }
  ],
  "total": 1
}
```

### Test Webhook
```
POST /workspaces/{workspaceId}/webhooks/{webhookId}/test
Authorization: Bearer TOKEN

Response: 200 OK
{
  "statusCode": 200,
  "responseTime": 234,
  "message": "Webhook test successful",
  "payload": {
    "event": "test",
    "timestamp": "2026-01-03T23:00:00Z",
    "data": {}
  }
}
```

### Update Webhook
```
PUT /workspaces/{workspaceId}/webhooks/{webhookId}
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "url": "https://example.com/webhooks/v2",
  "events": ["entry.created", "entry.published"],
  "status": "active"
}

Response: 200 OK
{
  "id": "webhook_abc123",
  "url": "https://example.com/webhooks/v2",
  "events": ["entry.created", "entry.published"],
  "status": "active",
  "updatedAt": "2026-01-03T23:00:00Z"
}
```

### Delete Webhook
```
DELETE /workspaces/{workspaceId}/webhooks/{webhookId}
Authorization: Bearer TOKEN

Response: 204 No Content
```

### Get Webhook Logs
```
GET /workspaces/{workspaceId}/webhooks/{webhookId}/logs?limit=50&page=1
Authorization: Bearer TOKEN

Response: 200 OK
{
  "data": [
    {
      "id": "log_abc123",
      "event": "entry.created",
      "statusCode": 200,
      "responseTime": 234,
      "attempt": 1,
      "timestamp": "2026-01-03T23:00:00Z",
      "payload": {
        "entryId": "entry_abc123",
        "contentType": "Article",
        "title": "Meu Primeiro Artigo"
      }
    }
  ],
  "total": 156,
  "page": 1
}
```

---

## ⚙️ 9. SETTINGS

### Get Workspace Settings
```
GET /workspaces/{workspaceId}/settings
Authorization: Bearer TOKEN

Response: 200 OK
{
  "workspace": {
    "name": "Meu CMS",
    "slug": "meu-cms",
    "customUrl": "https://api.cms-saas.com/ws/meu-cms",
    "timezone": "America/Sao_Paulo",
    "description": "CMS para meu blog"
  },
  "billing": {
    "plan": "pro",
    "status": "active",
    "monthlyPrice": 29900,
    "currency": "BRL",
    "billingCycle": "monthly",
    "nextBillingDate": "2026-02-03",
    "cancelledAt": null
  },
  "storage": {
    "used": 2300,
    "limit": 10000,
    "unit": "MB",
    "percentage": 23
  },
  "apiRateLimit": {
    "requestsPerMin": 1000,
    "requestsPerMonth": null
  }
}
```

### Update Workspace Settings
```
PUT /workspaces/{workspaceId}/settings
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "timezone": "America/Rio_Branco",
  "description": "Updated description"
}

Response: 200 OK
{
  "timezone": "America/Rio_Branco",
  "description": "Updated description",
  "updatedAt": "2026-01-03T23:00:00Z"
}
```

### Get Billing Settings
```
GET /workspaces/{workspaceId}/settings/billing
Authorization: Bearer TOKEN

Response: 200 OK
{
  "plan": "pro",
  "status": "active",
  "monthlyPrice": 29900,
  "currency": "BRL",
  "billingCycle": "monthly",
  "nextBillingDate": "2026-02-03",
  "paymentMethod": {
    "type": "credit_card",
    "last4": "4242",
    "expiryMonth": 12,
    "expiryYear": 2027
  },
  "invoices": [
    {
      "id": "inv_abc123",
      "amount": 29900,
      "status": "paid",
      "date": "2026-01-03",
      "pdfUrl": "https://billing.cms-saas.com/invoices/inv_abc123.pdf"
    }
  ]
}
```

### Cancel Subscription
```
POST /workspaces/{workspaceId}/settings/billing/cancel
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "reason": "Too expensive",
  "feedback": "Optional feedback"
}

Response: 200 OK
{
  "message": "Subscription cancelled",
  "effectiveDate": "2026-02-03",
  "refundAmount": 0,
  "finalBillingDate": "2026-02-03"
}
```

---

## 📊 10. ANALYTICS

### Get Usage Stats
```
GET /workspaces/{workspaceId}/analytics/usage
Authorization: Bearer TOKEN

Response: 200 OK
{
  "period": "month",
  "entries": {
    "created": 45,
    "published": 38,
    "deleted": 2
  },
  "media": {
    "uploaded": 127,
    "deleted": 5,
    "storageUsed": 2300
  },
  "apiCalls": {
    "total": 45234,
    "byEndpoint": {
      "/entries": 23000,
      "/media": 15000,
      "/content-types": 7234
    }
  },
  "period": {
    "startDate": "2026-01-01",
    "endDate": "2026-01-31"
  }
}
```

### Get API Usage
```
GET /workspaces/{workspaceId}/analytics/api-usage?period=month
Authorization: Bearer TOKEN

Response: 200 OK
{
  "period": "month",
  "totalRequests": 45234,
  "byApiKey": [
    {
      "keyId": "key_abc123",
      "keyName": "Mobile App",
      "requests": 23000,
      "topEndpoints": [
        {
          "endpoint": "GET /entries",
          "count": 15000
        }
      ]
    }
  ],
  "byEndpoint": [
    {
      "endpoint": "GET /entries",
      "count": 25000
    }
  ],
  "rateLimit": {
    "limit": 1000000,
    "used": 45234,
    "remaining": 954766
  }
}
```

---

## 🔄 11. WEBHOOK EVENTS

### Events Emitted

```
entry.created:
{
  "event": "entry.created",
  "timestamp": "2026-01-03T23:00:00Z",
  "workspaceId": "ws_abc123",
  "data": {
    "id": "entry_abc123",
    "contentType": "Article",
    "title": "Novo Artigo",
    "status": "draft",
    "createdBy": "user_abc123"
  }
}

entry.published:
{
  "event": "entry.published",
  "timestamp": "2026-01-03T23:00:00Z",
  "workspaceId": "ws_abc123",
  "data": {
    "id": "entry_abc123",
    "contentType": "Article",
    "title": "Novo Artigo",
    "status": "published",
    "publishedAt": "2026-01-03T23:00:00Z"
  }
}

entry.updated:
{
  "event": "entry.updated",
  "timestamp": "2026-01-03T23:00:00Z",
  "workspaceId": "ws_abc123",
  "data": {
    "id": "entry_abc123",
    "contentType": "Article",
    "changes": ["title", "body"],
    "updatedBy": "user_abc123"
  }
}

entry.deleted:
{
  "event": "entry.deleted",
  "timestamp": "2026-01-03T23:00:00Z",
  "workspaceId": "ws_abc123",
  "data": {
    "id": "entry_abc123",
    "contentType": "Article",
    "title": "Artigo Deletado",
    "deletedBy": "user_abc123"
  }
}

media.uploaded:
{
  "event": "media.uploaded",
  "timestamp": "2026-01-03T23:00:00Z",
  "workspaceId": "ws_abc123",
  "data": {
    "id": "media_abc123",
    "name": "featured.jpg",
    "size": 1024000,
    "url": "https://storage.cms-saas.com/media_abc123.jpg",
    "uploadedBy": "user_abc123"
  }
}

media.deleted:
{
  "event": "media.deleted",
  "timestamp": "2026-01-03T23:00:00Z",
  "workspaceId": "ws_abc123",
  "data": {
    "id": "media_abc123",
    "name": "featured.jpg",
    "deletedBy": "user_abc123"
  }
}
```

---

## 🧪 12. ERROR RESPONSES

### Standard Error Response
```
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "The request body is invalid",
    "statusCode": 400,
    "timestamp": "2026-01-03T23:00:00Z",
    "details": {
      "field": "email",
      "issue": "Email format is invalid"
    }
  }
}
```

### Common Error Codes
```
400 BAD_REQUEST - Invalid request parameters
401 UNAUTHORIZED - Missing or invalid authentication
403 FORBIDDEN - User lacks permissions
404 NOT_FOUND - Resource not found
409 CONFLICT - Resource already exists
429 RATE_LIMITED - Too many requests
500 SERVER_ERROR - Internal server error
503 SERVICE_UNAVAILABLE - Service temporarily unavailable
```

---

## 📝 13. REQUEST/RESPONSE HEADERS

### Required Headers
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json
X-Workspace-Id: ws_abc123 (optional, for multi-workspace support)
```

### Response Headers
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1609977600
X-Request-Id: req_abc123xyz789
Content-Type: application/json
```

---

## 🔐 14. PERMISSIONS MODEL

### Permission Levels
```
admin       - Full access to all resources
editor      - Create, read, update entries; read media
viewer      - Read-only access to entries and media
contributor - Create entries in specific content types
```

### Endpoint Permissions
```
POST /content-types           → admin only
PUT /content-types/{id}       → admin only
DELETE /content-types/{id}    → admin only

POST /entries                 → editor, contributor
PUT /entries/{id}             → editor, contributor (own entries)
DELETE /entries/{id}          → editor (own entries), admin
POST /entries/{id}/publish    → editor, admin

POST /media/upload            → editor, contributor
DELETE /media/{id}            → editor, admin

GET /workspaces/{id}/members  → admin only
POST /workspaces/{id}/members → admin only
```

---

## 📦 15. DATABASE SCHEMA

### Users Collection
```javascript
{
  _id: ObjectId,
  email: String (unique),
  passwordHash: String,
  name: String,
  avatar: String (optional),
  verified: Boolean,
  status: String (active/inactive/banned),
  workspaces: [ObjectId],
  createdAt: Date,
  updatedAt: Date
}
```

### Workspaces Collection
```javascript
{
  _id: ObjectId,
  name: String,
  slug: String (unique),
  customUrl: String (unique),
  description: String,
  owner: ObjectId (User),
  members: [{
    userId: ObjectId,
    role: String (admin/editor/viewer),
    joinedAt: Date
  }],
  timezone: String,
  plan: String (free/pro/enterprise),
  storage: { used: Number, limit: Number },
  createdAt: Date,
  updatedAt: Date
}
```

### Content Types Collection
```javascript
{
  _id: ObjectId,
  workspaceId: ObjectId,
  name: String,
  slug: String,
  displayName: String,
  description: String,
  fields: [{
    id: String,
    name: String,
    type: String (text/richtext/media/relation/array/etc),
    required: Boolean,
    unique: Boolean,
    validation: Object,
    displayName: String
  }],
  status: String (draft/active),
  createdBy: ObjectId (User),
  createdAt: Date,
  updatedAt: Date
}
```

### Entries Collection
```javascript
{
  _id: ObjectId,
  workspaceId: ObjectId,
  contentTypeId: ObjectId,
  title: String,
  data: Object (dynamic fields),
  status: String (draft/published/archived),
  version: Number,
  createdBy: ObjectId (User),
  updatedBy: ObjectId (User),
  publishedAt: Date (nullable),
  createdAt: Date,
  updatedAt: Date
}
```

### Media Collection
```javascript
{
  _id: ObjectId,
  workspaceId: ObjectId,
  name: String,
  url: String,
  size: Number (bytes),
  type: String (image/jpeg, etc),
  width: Number (for images),
  height: Number (for images),
  folder: String,
  uploadedBy: ObjectId (User),
  uploadedAt: Date
}
```

### API Keys Collection
```javascript
{
  _id: ObjectId,
  workspaceId: ObjectId,
  key: String (hashed),
  name: String,
  permissions: [String],
  status: String (active/revoked),
  createdAt: Date,
  updatedAt: Date,
  lastUsedAt: Date (nullable),
  usageStats: {
    requests: Number,
    lastMonth: Number
  }
}
```

---

## 🚀 16. DEPLOYMENT & SCALING

### Environment Variables
```
NODE_ENV=production
DATABASE_URL=mongodb+srv://...
JWT_SECRET=your_secret_key
JWT_EXPIRY=7d
REFRESH_TOKEN_EXPIRY=30d
STORAGE_BUCKET=cms-saas-prod
API_RATE_LIMIT=1000
STRIPE_API_KEY=sk_live_...
WEBHOOK_TIMEOUT=30000
```

### Recommended Stack
```
Backend Framework: Node.js + Express OR Next.js API Routes
Database: MongoDB (or PostgreSQL)
Cache: Redis (for rate limiting, sessions)
Storage: AWS S3 (or similar)
Queue: Bull/RabbitMQ (for webhooks, async tasks)
Auth: JWT + Refresh Tokens
Monitoring: Sentry + Datadog
```

### Performance Tips
```
1. Index frequently queried fields (email, workspaceId, contentTypeId)
2. Paginate large lists (limit 50 by default)
3. Use database projections to exclude unnecessary fields
4. Cache static content (content types)
5. Rate limit by API key + IP address
6. Use async webhooks (queue-based)
7. Compress API responses (gzip)
8. Monitor query performance
```

---

## 📖 17. EXAMPLE WORKFLOWS

### New User Onboarding Flow
```
1. POST /auth/register → User created
2. POST /auth/verify-email → Email verified
3. POST /workspaces → Workspace created
4. POST /content-types → Article type created
5. POST /entries → First entry created
6. POST /entries/{id}/publish → Entry published
✓ User ready to use CMS
```

### Publishing Content Flow
```
1. POST /entries (status: draft)
2. PUT /entries/{id} (multiple times, status: draft)
3. GET /entries/{id}/history (review changes)
4. POST /entries/{id}/publish (status: published)
5. Webhook event: entry.published (sent to subscribers)
✓ Content live
```

### Media Management Flow
```
1. POST /media/upload (multiple files)
2. GET /media (list uploaded files)
3. POST /content-types (create Article type)
4. POST /entries (link media in entry)
5. GET /entries/{id} (media resolved with full details)
✓ Media integrated
```

---

*API Documentation - CMS SaaS v1*  
*Last Updated: January 2026*  
*Status: Production Ready*
