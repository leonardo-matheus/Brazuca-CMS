package com.brazucacms.service;

import com.brazucacms.dto.apikey.ApiKeyRequest;
import com.brazucacms.dto.apikey.ApiKeyResponse;
import com.brazucacms.dto.apikey.ApiUsageResponse;
import com.brazucacms.exception.ResourceNotFoundException;
import com.brazucacms.model.ApiKey;
import com.brazucacms.model.User;
import com.brazucacms.model.Workspace;
import com.brazucacms.repository.ApiKeyRepository;
import com.brazucacms.repository.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ApiKeyService {

    private final ApiKeyRepository apiKeyRepository;
    private final WorkspaceRepository workspaceRepository;
    private static final SecureRandom secureRandom = new SecureRandom();

    // API Usage statistics
    public ApiUsageResponse getApiUsage(Long workspaceId) {
        List<ApiKey> keys = apiKeyRepository.findByWorkspaceId(workspaceId);
        long totalRequests = keys.stream().mapToLong(ApiKey::getRequestsThisMonth).sum();
        long requestsToday = keys.stream().mapToLong(ApiKey::getRequestsToday).sum();
        
        return ApiUsageResponse.builder()
                .totalRequests(totalRequests)
                .rateLimit(1000)
                .rateLimitRemaining(1000 - (int) requestsToday)
                .requestsThisMonth(totalRequests)
                .monthlyLimit(100000)
                .build();
    }

    // Workspace-scoped methods
    public List<ApiKeyResponse> getApiKeysByWorkspace(Long workspaceId) {
        return apiKeyRepository.findByWorkspaceId(workspaceId).stream()
                .map(ApiKeyResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public List<ApiKeyResponse> getActiveApiKeysByWorkspace(Long workspaceId) {
        return apiKeyRepository.findByWorkspaceIdAndActiveTrue(workspaceId).stream()
                .map(ApiKeyResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public ApiKeyResponse createApiKey(Long workspaceId, ApiKeyRequest request, User owner) {
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found with id: " + workspaceId));

        String fullKey = generateApiKey();
        String keyPrefix = fullKey.substring(0, 8) + "...";

        ApiKey.ApiKeyType type = ApiKey.ApiKeyType.READ_ONLY;
        if (request.getType() != null) {
            type = ApiKey.ApiKeyType.valueOf(request.getType().toUpperCase());
        }

        ApiKey apiKey = ApiKey.builder()
                .name(request.getName())
                .description(request.getDescription())
                .key(hashKey(fullKey))
                .keyPrefix(keyPrefix)
                .type(type)
                .permissions(request.getPermissions())
                .expiresAt(request.getExpiresAt())
                .workspace(workspace)
                .owner(owner)
                .status(ApiKey.ApiKeyStatus.ACTIVE)
                .build();

        ApiKey savedApiKey = apiKeyRepository.save(apiKey);
        return ApiKeyResponse.fromEntityWithKey(savedApiKey, fullKey);
    }

    @Transactional
    public ApiKeyResponse updateApiKey(Long id, ApiKeyRequest request) {
        ApiKey apiKey = apiKeyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("API key not found with id: " + id));

        if (request.getName() != null) {
            apiKey.setName(request.getName());
        }

        if (request.getDescription() != null) {
            apiKey.setDescription(request.getDescription());
        }

        if (request.getType() != null) {
            apiKey.setType(ApiKey.ApiKeyType.valueOf(request.getType().toUpperCase()));
        }

        if (request.getPermissions() != null) {
            apiKey.setPermissions(request.getPermissions());
        }

        if (request.getExpiresAt() != null) {
            apiKey.setExpiresAt(request.getExpiresAt());
        }

        ApiKey savedApiKey = apiKeyRepository.save(apiKey);
        return ApiKeyResponse.fromEntity(savedApiKey);
    }

    @Transactional
    public void revokeApiKey(Long id) {
        ApiKey apiKey = apiKeyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("API key not found with id: " + id));

        apiKey.setActive(false);
        apiKey.setStatus(ApiKey.ApiKeyStatus.REVOKED);
        apiKeyRepository.save(apiKey);
    }

    @Transactional
    public ApiKeyResponse regenerateApiKey(Long id) {
        ApiKey apiKey = apiKeyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("API key not found with id: " + id));

        String fullKey = generateApiKey();
        String keyPrefix = fullKey.substring(0, 8) + "...";

        apiKey.setKey(hashKey(fullKey));
        apiKey.setKeyPrefix(keyPrefix);
        apiKey.setLastUsedAt(null);
        apiKey.setRequestCount(0L);

        ApiKey savedApiKey = apiKeyRepository.save(apiKey);
        return ApiKeyResponse.fromEntityWithKey(savedApiKey, fullKey);
    }

    @Transactional
    public void deleteApiKey(Long id) {
        ApiKey apiKey = apiKeyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("API key not found with id: " + id));
        apiKeyRepository.delete(apiKey);
    }

    public long countApiKeysByWorkspace(Long workspaceId) {
        return apiKeyRepository.countByWorkspaceIdAndActiveTrue(workspaceId);
    }

    // Legacy methods (keeping for backward compatibility)
    public List<ApiKeyResponse> getApiKeysByOwner(Long ownerId) {
        return apiKeyRepository.findByOwnerId(ownerId).stream()
                .map(ApiKeyResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public List<ApiKeyResponse> getActiveApiKeysByOwner(Long ownerId) {
        return apiKeyRepository.findByOwnerIdAndActiveTrue(ownerId).stream()
                .map(ApiKeyResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public ApiKeyResponse getApiKeyById(Long id) {
        ApiKey apiKey = apiKeyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("API key not found with id: " + id));
        return ApiKeyResponse.fromEntity(apiKey);
    }

    @Transactional
    public ApiKeyResponse createApiKey(ApiKeyRequest request, User owner) {
        String fullKey = generateApiKey();
        String keyPrefix = fullKey.substring(0, 8) + "...";

        ApiKey.ApiKeyType type = ApiKey.ApiKeyType.READ_ONLY;
        if (request.getType() != null) {
            type = ApiKey.ApiKeyType.valueOf(request.getType().toUpperCase());
        }

        ApiKey apiKey = ApiKey.builder()
                .name(request.getName())
                .description(request.getDescription())
                .key(hashKey(fullKey))
                .keyPrefix(keyPrefix)
                .type(type)
                .permissions(request.getPermissions())
                .expiresAt(request.getExpiresAt())
                .owner(owner)
                .status(ApiKey.ApiKeyStatus.ACTIVE)
                .build();

        ApiKey savedApiKey = apiKeyRepository.save(apiKey);
        return ApiKeyResponse.fromEntityWithKey(savedApiKey, fullKey);
    }

    @Transactional
    public ApiKeyResponse updateApiKey(Long id, ApiKeyRequest request, Long ownerId) {
        ApiKey apiKey = apiKeyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("API key not found with id: " + id));

        if (!apiKey.getOwner().getId().equals(ownerId)) {
            throw new ResourceNotFoundException("API key not found with id: " + id);
        }

        if (request.getName() != null) {
            apiKey.setName(request.getName());
        }

        if (request.getType() != null) {
            apiKey.setType(ApiKey.ApiKeyType.valueOf(request.getType().toUpperCase()));
        }

        if (request.getExpiresAt() != null) {
            apiKey.setExpiresAt(request.getExpiresAt());
        }

        ApiKey savedApiKey = apiKeyRepository.save(apiKey);
        return ApiKeyResponse.fromEntity(savedApiKey);
    }

    @Transactional
    public void revokeApiKey(Long id, Long ownerId) {
        ApiKey apiKey = apiKeyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("API key not found with id: " + id));

        if (!apiKey.getOwner().getId().equals(ownerId)) {
            throw new ResourceNotFoundException("API key not found with id: " + id);
        }

        apiKey.setActive(false);
        apiKey.setStatus(ApiKey.ApiKeyStatus.REVOKED);
        apiKeyRepository.save(apiKey);
    }

    @Transactional
    public void deleteApiKey(Long id, Long ownerId) {
        ApiKey apiKey = apiKeyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("API key not found with id: " + id));

        if (!apiKey.getOwner().getId().equals(ownerId)) {
            throw new ResourceNotFoundException("API key not found with id: " + id);
        }

        apiKeyRepository.delete(apiKey);
    }

    public ApiKey validateApiKey(String key) {
        String hashedKey = hashKey(key);
        ApiKey apiKey = apiKeyRepository.findByKeyAndActiveTrue(hashedKey)
                .orElse(null);

        if (apiKey == null) {
            return null;
        }

        if (apiKey.getExpiresAt() != null && apiKey.getExpiresAt().isBefore(LocalDateTime.now())) {
            return null;
        }

        // Update last used and request count
        apiKey.setLastUsedAt(LocalDateTime.now());
        apiKey.setRequestCount(apiKey.getRequestCount() != null ? apiKey.getRequestCount() + 1 : 1L);
        apiKeyRepository.save(apiKey);

        return apiKey;
    }

    public long countApiKeys() {
        return apiKeyRepository.countByActiveTrue();
    }

    private String generateApiKey() {
        byte[] randomBytes = new byte[32];
        secureRandom.nextBytes(randomBytes);
        return "bz_" + Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
    }

    private String hashKey(String key) {
        // In production, use a proper hashing algorithm like BCrypt
        // For simplicity, we're storing the key directly (NOT recommended for production)
        return key;
    }
}
