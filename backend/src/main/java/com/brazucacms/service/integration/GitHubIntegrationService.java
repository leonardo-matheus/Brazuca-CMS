package com.brazucacms.service.integration;

import com.brazucacms.dto.integration.IntegrationConnectRequest;
import com.brazucacms.exception.IntegrationException;
import com.brazucacms.model.Entry;
import com.brazucacms.model.Integration;
import com.brazucacms.repository.IntegrationRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;

/**
 * GitHub Integration Service
 * Handles:
 * - OAuth authentication
 * - Repository access
 * - File content sync (code examples)
 * - Webhooks for commits
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class GitHubIntegrationService {

    private final IntegrationRepository integrationRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${integrations.github.client-id:}")
    private String clientId;

    @Value("${integrations.github.client-secret:}")
    private String clientSecret;

    private static final String GITHUB_API = "https://api.github.com";
    private static final String GITHUB_OAUTH = "https://github.com/login/oauth";

    // ============ OAuth ============

    public String getOAuthUrl(String redirectUri, String state) {
        String scope = "repo,read:user,read:org";
        return String.format(
            "%s/authorize?client_id=%s&redirect_uri=%s&scope=%s&state=%s",
            GITHUB_OAUTH, clientId, redirectUri, scope, state
        );
    }

    @Transactional
    public Integration connectWithOAuth(Long companyId, Long userId, IntegrationConnectRequest request) {
        try {
            // Exchange code for access token
            String accessToken = exchangeCodeForToken(request.getCode(), request.getRedirectUri());
            
            // Get GitHub user info
            Map<String, Object> userInfo = getGitHubUser(accessToken);
            String username = (String) userInfo.get("login");
            
            // Create or update integration
            Integration integration = integrationRepository
                    .findByCompanyIdAndPlatform(companyId, Integration.Platform.GITHUB)
                    .orElse(new Integration());
            
            integration.setCompany(new com.brazucacms.model.Company());
            integration.getCompany().setId(companyId);
            integration.setPlatform(Integration.Platform.GITHUB);
            integration.setDisplayName(username);
            integration.setAccessToken(accessToken);
            integration.setStatus(Integration.IntegrationStatus.ACTIVE);
            integration.setLastSyncAt(LocalDateTime.now());
            integration.setLastSyncStatus("Connected successfully");
            
            // Store additional config
            Map<String, Object> config = new HashMap<>();
            config.put("username", username);
            config.put("avatarUrl", userInfo.get("avatar_url"));
            config.put("name", userInfo.get("name"));
            integration.setConfiguration(objectMapper.writeValueAsString(config));

            return integrationRepository.save(integration);
            
        } catch (Exception e) {
            log.error("Failed to connect GitHub: {}", e.getMessage());
            throw new IntegrationException("Failed to connect GitHub: " + e.getMessage());
        }
    }

    private String exchangeCodeForToken(String code, String redirectUri) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));

        Map<String, String> body = Map.of(
            "client_id", clientId,
            "client_secret", clientSecret,
            "code", code,
            "redirect_uri", redirectUri
        );

        ResponseEntity<JsonNode> response = restTemplate.exchange(
            GITHUB_OAUTH + "/access_token",
            HttpMethod.POST,
            new HttpEntity<>(body, headers),
            JsonNode.class
        );

        JsonNode responseBody = response.getBody();
        if (responseBody == null || !responseBody.has("access_token")) {
            throw new IntegrationException("Failed to get access token from GitHub");
        }

        return responseBody.get("access_token").asText();
    }

    // ============ API Methods ============

    public Map<String, Object> getGitHubUser(String accessToken) {
        HttpHeaders headers = createHeaders(accessToken);
        ResponseEntity<Map> response = restTemplate.exchange(
            GITHUB_API + "/user",
            HttpMethod.GET,
            new HttpEntity<>(headers),
            Map.class
        );
        return response.getBody();
    }

    public List<Map<String, Object>> listRepositories(String accessToken) {
        HttpHeaders headers = createHeaders(accessToken);
        ResponseEntity<List> response = restTemplate.exchange(
            GITHUB_API + "/user/repos?sort=updated&per_page=100",
            HttpMethod.GET,
            new HttpEntity<>(headers),
            List.class
        );
        return response.getBody();
    }

    public List<Map<String, Object>> listOrganizations(String accessToken) {
        HttpHeaders headers = createHeaders(accessToken);
        ResponseEntity<List> response = restTemplate.exchange(
            GITHUB_API + "/user/orgs",
            HttpMethod.GET,
            new HttpEntity<>(headers),
            List.class
        );
        return response.getBody();
    }

    /**
     * Get file content from a repository
     */
    public String getFileContent(String accessToken, String owner, String repo, String path, String ref) {
        HttpHeaders headers = createHeaders(accessToken);
        headers.setAccept(List.of(MediaType.parseMediaType("application/vnd.github.raw")));
        
        String url = String.format("%s/repos/%s/%s/contents/%s", GITHUB_API, owner, repo, path);
        if (ref != null && !ref.isEmpty()) {
            url += "?ref=" + ref;
        }
        
        try {
            ResponseEntity<String> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                new HttpEntity<>(headers),
                String.class
            );
            return response.getBody();
        } catch (Exception e) {
            log.error("Failed to get file content: {}", e.getMessage());
            return null;
        }
    }

    /**
     * List files in a directory
     */
    public List<Map<String, Object>> listDirectory(String accessToken, String owner, String repo, String path) {
        HttpHeaders headers = createHeaders(accessToken);
        
        String url = String.format("%s/repos/%s/%s/contents/%s", GITHUB_API, owner, repo, path);
        
        ResponseEntity<List> response = restTemplate.exchange(
            url,
            HttpMethod.GET,
            new HttpEntity<>(headers),
            List.class
        );
        return response.getBody();
    }

    /**
     * Get repository info
     */
    public Map<String, Object> getRepository(String accessToken, String owner, String repo) {
        HttpHeaders headers = createHeaders(accessToken);
        
        ResponseEntity<Map> response = restTemplate.exchange(
            String.format("%s/repos/%s/%s", GITHUB_API, owner, repo),
            HttpMethod.GET,
            new HttpEntity<>(headers),
            Map.class
        );
        return response.getBody();
    }

    /**
     * Get recent commits
     */
    public List<Map<String, Object>> getCommits(String accessToken, String owner, String repo, String path, int limit) {
        HttpHeaders headers = createHeaders(accessToken);
        
        String url = String.format("%s/repos/%s/%s/commits?per_page=%d", GITHUB_API, owner, repo, limit);
        if (path != null && !path.isEmpty()) {
            url += "&path=" + path;
        }
        
        ResponseEntity<List> response = restTemplate.exchange(
            url,
            HttpMethod.GET,
            new HttpEntity<>(headers),
            List.class
        );
        return response.getBody();
    }

    // ============ Webhook Handling ============

    /**
     * Process incoming GitHub webhook
     */
    public Map<String, Object> processWebhook(String event, String signature, String payload) {
        log.info("Processing GitHub webhook: {}", event);
        
        Map<String, Object> result = new HashMap<>();
        result.put("event", event);
        result.put("processed", false);

        try {
            JsonNode payloadJson = objectMapper.readTree(payload);
            
            switch (event) {
                case "push":
                    result = processPushEvent(payloadJson);
                    break;
                case "release":
                    result = processReleaseEvent(payloadJson);
                    break;
                case "repository":
                    result = processRepositoryEvent(payloadJson);
                    break;
                default:
                    log.info("Unhandled GitHub event: {}", event);
            }
        } catch (Exception e) {
            log.error("Error processing GitHub webhook: {}", e.getMessage());
            result.put("error", e.getMessage());
        }

        return result;
    }

    private Map<String, Object> processPushEvent(JsonNode payload) {
        Map<String, Object> result = new HashMap<>();
        result.put("event", "push");
        result.put("processed", true);
        
        String ref = payload.get("ref").asText();
        String repo = payload.get("repository").get("full_name").asText();
        JsonNode commits = payload.get("commits");
        
        result.put("ref", ref);
        result.put("repository", repo);
        result.put("commitCount", commits.size());
        
        // Extract modified files
        List<String> modifiedFiles = new ArrayList<>();
        for (JsonNode commit : commits) {
            for (JsonNode file : commit.get("modified")) {
                modifiedFiles.add(file.asText());
            }
            for (JsonNode file : commit.get("added")) {
                modifiedFiles.add(file.asText());
            }
        }
        result.put("modifiedFiles", modifiedFiles);
        
        log.info("GitHub push: {} commits to {} on {}", commits.size(), repo, ref);
        return result;
    }

    private Map<String, Object> processReleaseEvent(JsonNode payload) {
        Map<String, Object> result = new HashMap<>();
        result.put("event", "release");
        result.put("processed", true);
        
        String action = payload.get("action").asText();
        JsonNode release = payload.get("release");
        
        result.put("action", action);
        result.put("tagName", release.get("tag_name").asText());
        result.put("name", release.get("name").asText());
        result.put("body", release.get("body").asText());
        result.put("prerelease", release.get("prerelease").asBoolean());
        
        log.info("GitHub release: {} - {}", action, release.get("tag_name").asText());
        return result;
    }

    private Map<String, Object> processRepositoryEvent(JsonNode payload) {
        Map<String, Object> result = new HashMap<>();
        result.put("event", "repository");
        result.put("processed", true);
        
        String action = payload.get("action").asText();
        result.put("action", action);
        result.put("repository", payload.get("repository").get("full_name").asText());
        
        return result;
    }

    // ============ Sync Methods ============

    /**
     * Sync code examples from a repository to CMS entries
     */
    @Transactional
    public Map<String, Object> syncCodeExamples(Long integrationId, String owner, String repo, String path) {
        Integration integration = integrationRepository.findById(integrationId)
                .orElseThrow(() -> new IntegrationException("Integration not found"));
        
        Map<String, Object> result = new HashMap<>();
        List<Map<String, Object>> syncedFiles = new ArrayList<>();
        
        try {
            List<Map<String, Object>> files = listDirectory(integration.getAccessToken(), owner, repo, path);
            
            for (Map<String, Object> file : files) {
                if ("file".equals(file.get("type"))) {
                    String fileName = (String) file.get("name");
                    String filePath = (String) file.get("path");
                    
                    // Get file content
                    String content = getFileContent(integration.getAccessToken(), owner, repo, filePath, null);
                    
                    Map<String, Object> syncedFile = new HashMap<>();
                    syncedFile.put("name", fileName);
                    syncedFile.put("path", filePath);
                    syncedFile.put("size", file.get("size"));
                    syncedFile.put("sha", file.get("sha"));
                    syncedFiles.add(syncedFile);
                }
            }
            
            integration.setLastSyncAt(LocalDateTime.now());
            integration.setLastSyncStatus("Synced " + syncedFiles.size() + " files");
            integrationRepository.save(integration);
            
            result.put("success", true);
            result.put("syncedFiles", syncedFiles);
            result.put("count", syncedFiles.size());
            
        } catch (Exception e) {
            log.error("Failed to sync code examples: {}", e.getMessage());
            integration.setLastSyncStatus("Error: " + e.getMessage());
            integration.setSyncError(e.getMessage());
            integrationRepository.save(integration);
            
            result.put("success", false);
            result.put("error", e.getMessage());
        }
        
        return result;
    }

    // ============ Helpers ============

    private HttpHeaders createHeaders(String accessToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        headers.set("X-GitHub-Api-Version", "2022-11-28");
        return headers;
    }
}
