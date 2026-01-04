package com.brazucacms.service.integration;

import com.brazucacms.dto.integration.IntegrationConnectRequest;
import com.brazucacms.model.Integration;
import com.brazucacms.repository.IntegrationRepository;
import com.brazucacms.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Service for Auth0 authentication integration.
 * Handles OAuth, user management, and authentication flows.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class Auth0IntegrationService {

    private final IntegrationRepository integrationRepository;
    private final UserRepository userRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${integration.auth0.domain:}")
    private String auth0Domain;

    @Value("${integration.auth0.client-id:}")
    private String clientId;

    @Value("${integration.auth0.client-secret:}")
    private String clientSecret;

    @Value("${integration.auth0.audience:}")
    private String apiAudience;

    private static final List<String> DEFAULT_SCOPES = List.of(
            "openid", "profile", "email", "offline_access"
    );

    /**
     * Get OAuth authorization URL
     */
    public String getOAuthUrl(String domain, String redirectUri, String state) {
        String effectiveDomain = domain != null ? domain : auth0Domain;
        String effectiveClientId = clientId;
        
        StringBuilder url = new StringBuilder("https://");
        url.append(effectiveDomain).append("/authorize?");
        url.append("response_type=code");
        url.append("&client_id=").append(effectiveClientId);
        url.append("&redirect_uri=").append(URLEncoder.encode(redirectUri, StandardCharsets.UTF_8));
        url.append("&scope=").append(URLEncoder.encode(String.join(" ", DEFAULT_SCOPES), StandardCharsets.UTF_8));
        
        if (apiAudience != null && !apiAudience.isEmpty()) {
            url.append("&audience=").append(URLEncoder.encode(apiAudience, StandardCharsets.UTF_8));
        }
        
        if (state != null && !state.isEmpty()) {
            url.append("&state=").append(state);
        }
        
        return url.toString();
    }

    /**
     * Connect Auth0 with OAuth code
     */
    public Integration connectWithOAuth(Long companyId, Long userId, IntegrationConnectRequest request) {
        var user = userRepository.findById(userId).orElseThrow();
        
        String code = request.getCode();
        String redirectUri = request.getRedirectUri();
        String domain = request.getConfig() != null ? 
                (String) request.getConfig().get("domain") : auth0Domain;
        
        // Exchange code for tokens
        Map<String, Object> tokens = exchangeCodeForTokens(domain, code, redirectUri);
        
        // Get tenant info using Management API
        String accessToken = (String) tokens.get("access_token");
        Map<String, Object> tenantInfo = getTenantInfo(domain, accessToken);
        
        Integration integration = new Integration();
        integration.setCompany(user.getCompany());
        integration.setConnectedBy(user);
        integration.setPlatform(Integration.Platform.AUTH0);
        integration.setName(request.getName() != null ? request.getName() : "Auth0");
        integration.setStatus(Integration.IntegrationStatus.ACTIVE);
        integration.setAccessToken(accessToken);
        
        if (tokens.containsKey("refresh_token")) {
            integration.setRefreshToken((String) tokens.get("refresh_token"));
        }
        
        if (tokens.containsKey("expires_in")) {
            int expiresIn = ((Number) tokens.get("expires_in")).intValue();
            integration.setTokenExpiresAt(LocalDateTime.now().plusSeconds(expiresIn));
        }
        
        Map<String, Object> config = new HashMap<>();
        config.put("domain", domain);
        config.put("tenantName", tenantInfo.getOrDefault("friendly_name", domain));
        
        try {
            integration.setConfig(objectMapper.writeValueAsString(config));
        } catch (Exception e) {
            log.error("Failed to serialize config", e);
        }
        
        integration.setConnectedAt(LocalDateTime.now());
        
        return integrationRepository.save(integration);
    }

    /**
     * Connect with client credentials (Machine-to-Machine)
     */
    public Integration connectWithCredentials(Long companyId, Long userId, IntegrationConnectRequest request) {
        var user = userRepository.findById(userId).orElseThrow();
        
        String domain = (String) request.getConfig().get("domain");
        String clientId = (String) request.getConfig().get("clientId");
        String clientSecret = (String) request.getConfig().get("clientSecret");
        String audience = (String) request.getConfig().getOrDefault("audience", "https://" + domain + "/api/v2/");
        
        // Get access token using client credentials
        Map<String, Object> tokens = getClientCredentialsToken(domain, clientId, clientSecret, audience);
        
        Integration integration = new Integration();
        integration.setCompany(user.getCompany());
        integration.setConnectedBy(user);
        integration.setPlatform(Integration.Platform.AUTH0);
        integration.setName(request.getName() != null ? request.getName() : "Auth0");
        integration.setStatus(Integration.IntegrationStatus.ACTIVE);
        integration.setAccessToken((String) tokens.get("access_token"));
        
        Map<String, Object> config = new HashMap<>();
        config.put("domain", domain);
        config.put("clientId", clientId);
        config.put("audience", audience);
        config.put("grantType", "client_credentials");
        
        try {
            integration.setConfig(objectMapper.writeValueAsString(config));
        } catch (Exception e) {
            log.error("Failed to serialize config", e);
        }
        
        integration.setConnectedAt(LocalDateTime.now());
        
        return integrationRepository.save(integration);
    }

    /**
     * Exchange authorization code for tokens
     */
    private Map<String, Object> exchangeCodeForTokens(String domain, String code, String redirectUri) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        
        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "authorization_code");
        body.add("client_id", clientId);
        body.add("client_secret", clientSecret);
        body.add("code", code);
        body.add("redirect_uri", redirectUri);
        
        HttpEntity<MultiValueMap<String, String>> entity = new HttpEntity<>(body, headers);
        
        ResponseEntity<Map> response = restTemplate.exchange(
                "https://" + domain + "/oauth/token",
                HttpMethod.POST,
                entity,
                Map.class
        );
        
        return response.getBody();
    }

    /**
     * Get client credentials token
     */
    private Map<String, Object> getClientCredentialsToken(String domain, String clientId, String clientSecret, String audience) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        
        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "client_credentials");
        body.add("client_id", clientId);
        body.add("client_secret", clientSecret);
        body.add("audience", audience);
        
        HttpEntity<MultiValueMap<String, String>> entity = new HttpEntity<>(body, headers);
        
        ResponseEntity<Map> response = restTemplate.exchange(
                "https://" + domain + "/oauth/token",
                HttpMethod.POST,
                entity,
                Map.class
        );
        
        return response.getBody();
    }

    /**
     * Get tenant information
     */
    private Map<String, Object> getTenantInfo(String domain, String accessToken) {
        try {
            HttpHeaders headers = createHeaders(accessToken);
            HttpEntity<?> entity = new HttpEntity<>(headers);
            
            ResponseEntity<Map> response = restTemplate.exchange(
                    "https://" + domain + "/api/v2/tenants/settings",
                    HttpMethod.GET,
                    entity,
                    Map.class
            );
            
            return response.getBody();
        } catch (Exception e) {
            log.warn("Could not fetch tenant info: {}", e.getMessage());
            return Map.of();
        }
    }

    /**
     * List users
     */
    public Map<String, Object> listUsers(Long integrationId, int page, int perPage, String search) {
        Integration integration = getIntegration(integrationId);
        String domain = getDomain(integration);
        HttpHeaders headers = createHeaders(integration.getAccessToken());
        HttpEntity<?> entity = new HttpEntity<>(headers);
        
        StringBuilder url = new StringBuilder("https://");
        url.append(domain).append("/api/v2/users?");
        url.append("page=").append(page);
        url.append("&per_page=").append(perPage);
        url.append("&include_totals=true");
        
        if (search != null && !search.isEmpty()) {
            url.append("&q=").append(URLEncoder.encode(search, StandardCharsets.UTF_8));
        }
        
        ResponseEntity<Map> response = restTemplate.exchange(url.toString(), HttpMethod.GET, entity, Map.class);
        return response.getBody();
    }

    /**
     * Get user by ID
     */
    public Map<String, Object> getUser(Long integrationId, String userId) {
        Integration integration = getIntegration(integrationId);
        String domain = getDomain(integration);
        HttpHeaders headers = createHeaders(integration.getAccessToken());
        HttpEntity<?> entity = new HttpEntity<>(headers);
        
        ResponseEntity<Map> response = restTemplate.exchange(
                "https://" + domain + "/api/v2/users/" + URLEncoder.encode(userId, StandardCharsets.UTF_8),
                HttpMethod.GET,
                entity,
                Map.class
        );
        
        return response.getBody();
    }

    /**
     * Create user
     */
    public Map<String, Object> createUser(Long integrationId, Map<String, Object> userData) {
        Integration integration = getIntegration(integrationId);
        String domain = getDomain(integration);
        HttpHeaders headers = createHeaders(integration.getAccessToken());
        headers.setContentType(MediaType.APPLICATION_JSON);
        
        Map<String, Object> body = new HashMap<>();
        body.put("email", userData.get("email"));
        body.put("connection", userData.getOrDefault("connection", "Username-Password-Authentication"));
        
        if (userData.containsKey("password")) {
            body.put("password", userData.get("password"));
        }
        if (userData.containsKey("name")) {
            body.put("name", userData.get("name"));
        }
        if (userData.containsKey("nickname")) {
            body.put("nickname", userData.get("nickname"));
        }
        if (userData.containsKey("email_verified")) {
            body.put("email_verified", userData.get("email_verified"));
        }
        if (userData.containsKey("user_metadata")) {
            body.put("user_metadata", userData.get("user_metadata"));
        }
        if (userData.containsKey("app_metadata")) {
            body.put("app_metadata", userData.get("app_metadata"));
        }
        
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        
        ResponseEntity<Map> response = restTemplate.exchange(
                "https://" + domain + "/api/v2/users",
                HttpMethod.POST,
                entity,
                Map.class
        );
        
        return response.getBody();
    }

    /**
     * Update user
     */
    public Map<String, Object> updateUser(Long integrationId, String userId, Map<String, Object> updates) {
        Integration integration = getIntegration(integrationId);
        String domain = getDomain(integration);
        HttpHeaders headers = createHeaders(integration.getAccessToken());
        headers.setContentType(MediaType.APPLICATION_JSON);
        
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(updates, headers);
        
        ResponseEntity<Map> response = restTemplate.exchange(
                "https://" + domain + "/api/v2/users/" + URLEncoder.encode(userId, StandardCharsets.UTF_8),
                HttpMethod.PATCH,
                entity,
                Map.class
        );
        
        return response.getBody();
    }

    /**
     * Delete user
     */
    public void deleteUser(Long integrationId, String userId) {
        Integration integration = getIntegration(integrationId);
        String domain = getDomain(integration);
        HttpHeaders headers = createHeaders(integration.getAccessToken());
        HttpEntity<?> entity = new HttpEntity<>(headers);
        
        restTemplate.exchange(
                "https://" + domain + "/api/v2/users/" + URLEncoder.encode(userId, StandardCharsets.UTF_8),
                HttpMethod.DELETE,
                entity,
                Void.class
        );
    }

    /**
     * List roles
     */
    public Map<String, Object> listRoles(Long integrationId) {
        Integration integration = getIntegration(integrationId);
        String domain = getDomain(integration);
        HttpHeaders headers = createHeaders(integration.getAccessToken());
        HttpEntity<?> entity = new HttpEntity<>(headers);
        
        ResponseEntity<Map> response = restTemplate.exchange(
                "https://" + domain + "/api/v2/roles",
                HttpMethod.GET,
                entity,
                Map.class
        );
        
        return response.getBody();
    }

    /**
     * Assign roles to user
     */
    public void assignRolesToUser(Long integrationId, String userId, List<String> roleIds) {
        Integration integration = getIntegration(integrationId);
        String domain = getDomain(integration);
        HttpHeaders headers = createHeaders(integration.getAccessToken());
        headers.setContentType(MediaType.APPLICATION_JSON);
        
        Map<String, Object> body = Map.of("roles", roleIds);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        
        restTemplate.exchange(
                "https://" + domain + "/api/v2/users/" + URLEncoder.encode(userId, StandardCharsets.UTF_8) + "/roles",
                HttpMethod.POST,
                entity,
                Void.class
        );
    }

    /**
     * Get user roles
     */
    public List<Map<String, Object>> getUserRoles(Long integrationId, String userId) {
        Integration integration = getIntegration(integrationId);
        String domain = getDomain(integration);
        HttpHeaders headers = createHeaders(integration.getAccessToken());
        HttpEntity<?> entity = new HttpEntity<>(headers);
        
        ResponseEntity<List> response = restTemplate.exchange(
                "https://" + domain + "/api/v2/users/" + URLEncoder.encode(userId, StandardCharsets.UTF_8) + "/roles",
                HttpMethod.GET,
                entity,
                List.class
        );
        
        return response.getBody();
    }

    /**
     * List connections (identity providers)
     */
    public List<Map<String, Object>> listConnections(Long integrationId) {
        Integration integration = getIntegration(integrationId);
        String domain = getDomain(integration);
        HttpHeaders headers = createHeaders(integration.getAccessToken());
        HttpEntity<?> entity = new HttpEntity<>(headers);
        
        ResponseEntity<List> response = restTemplate.exchange(
                "https://" + domain + "/api/v2/connections",
                HttpMethod.GET,
                entity,
                List.class
        );
        
        return response.getBody();
    }

    /**
     * Send password reset email
     */
    public Map<String, Object> sendPasswordResetEmail(Long integrationId, String email, String connection) {
        Integration integration = getIntegration(integrationId);
        String domain = getDomain(integration);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        
        Map<String, Object> config;
        try {
            config = objectMapper.readValue(integration.getConfig(), Map.class);
        } catch (Exception e) {
            config = Map.of();
        }
        
        Map<String, Object> body = new HashMap<>();
        body.put("client_id", config.getOrDefault("clientId", clientId));
        body.put("email", email);
        body.put("connection", connection != null ? connection : "Username-Password-Authentication");
        
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        
        ResponseEntity<Map> response = restTemplate.exchange(
                "https://" + domain + "/dbconnections/change_password",
                HttpMethod.POST,
                entity,
                Map.class
        );
        
        return Map.of("message", "Password reset email sent");
    }

    /**
     * Get daily stats
     */
    public List<Map<String, Object>> getDailyStats(Long integrationId, String from, String to) {
        Integration integration = getIntegration(integrationId);
        String domain = getDomain(integration);
        HttpHeaders headers = createHeaders(integration.getAccessToken());
        HttpEntity<?> entity = new HttpEntity<>(headers);
        
        String url = "https://" + domain + "/api/v2/stats/daily?from=" + from + "&to=" + to;
        
        ResponseEntity<List> response = restTemplate.exchange(url, HttpMethod.GET, entity, List.class);
        return response.getBody();
    }

    /**
     * Get active users count
     */
    public Map<String, Object> getActiveUsersCount(Long integrationId) {
        Integration integration = getIntegration(integrationId);
        String domain = getDomain(integration);
        HttpHeaders headers = createHeaders(integration.getAccessToken());
        HttpEntity<?> entity = new HttpEntity<>(headers);
        
        ResponseEntity<Map> response = restTemplate.exchange(
                "https://" + domain + "/api/v2/stats/active-users",
                HttpMethod.GET,
                entity,
                Map.class
        );
        
        return response.getBody();
    }

    /**
     * Get logs (login events, etc.)
     */
    public List<Map<String, Object>> getLogs(Long integrationId, int page, int perPage) {
        Integration integration = getIntegration(integrationId);
        String domain = getDomain(integration);
        HttpHeaders headers = createHeaders(integration.getAccessToken());
        HttpEntity<?> entity = new HttpEntity<>(headers);
        
        String url = "https://" + domain + "/api/v2/logs?page=" + page + "&per_page=" + perPage;
        
        ResponseEntity<List> response = restTemplate.exchange(url, HttpMethod.GET, entity, List.class);
        return response.getBody();
    }

    /**
     * Sync users to CMS
     */
    public Map<String, Object> syncUsersToCms(Long integrationId) {
        Integration integration = getIntegration(integrationId);
        
        // Fetch all users
        List<Map<String, Object>> allUsers = new ArrayList<>();
        int page = 0;
        int perPage = 100;
        
        while (true) {
            Map<String, Object> result = listUsers(integrationId, page, perPage, null);
            List<Map<String, Object>> users = (List<Map<String, Object>>) result.get("users");
            
            if (users == null || users.isEmpty()) break;
            
            allUsers.addAll(users);
            
            int total = ((Number) result.get("total")).intValue();
            if (allUsers.size() >= total) break;
            
            page++;
        }
        
        // Update sync stats
        integration.setLastSyncAt(LocalDateTime.now());
        integration.setTotalSyncs(integration.getTotalSyncs() + 1);
        integrationRepository.save(integration);
        
        return Map.of(
                "synced", allUsers.size(),
                "syncedAt", LocalDateTime.now().toString()
        );
    }

    // ============ Helper Methods ============

    private Integration getIntegration(Long integrationId) {
        return integrationRepository.findById(integrationId)
                .orElseThrow(() -> new RuntimeException("Integration not found"));
    }

    private String getDomain(Integration integration) {
        try {
            Map<String, Object> config = objectMapper.readValue(integration.getConfig(), Map.class);
            return (String) config.get("domain");
        } catch (Exception e) {
            throw new RuntimeException("Invalid integration config");
        }
    }

    private HttpHeaders createHeaders(String accessToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        return headers;
    }
}
