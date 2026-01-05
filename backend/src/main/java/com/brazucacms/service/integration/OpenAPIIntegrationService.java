package com.brazucacms.service.integration;

import com.brazucacms.dto.integration.IntegrationConnectRequest;
import com.brazucacms.exception.IntegrationException;
import com.brazucacms.model.Company;
import com.brazucacms.model.Integration;
import com.brazucacms.repository.IntegrationRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * OpenAPI Integration Service
 * Handles:
 * - OpenAPI/Swagger spec parsing (using Jackson)
 * - Documentation generation from specs
 * - Auto-sync with GitHub repos
 * - Live API documentation updates
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class OpenAPIIntegrationService {

    private final IntegrationRepository integrationRepository;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper yamlMapper = new ObjectMapper(new YAMLFactory());

    // ============ Connection ============

    @Transactional
    public Integration connectWithUrl(Long companyId, Long userId, IntegrationConnectRequest request) {
        try {
            // Support both credentials and configuration for flexibility
            String specUrl = null;
            String specContent = null;
            
            if (request.getCredentials() != null) {
                specUrl = request.getCredentials().get("specUrl");
                specContent = request.getCredentials().get("specContent");
            }
            if (request.getConfiguration() != null) {
                if (specUrl == null && request.getConfiguration().get("specUrl") != null) {
                    specUrl = request.getConfiguration().get("specUrl").toString();
                }
                if (specContent == null && request.getConfiguration().get("specContent") != null) {
                    specContent = request.getConfiguration().get("specContent").toString();
                }
            }
            
            // Parse and validate spec
            JsonNode openAPISpec;
            if (specUrl != null && !specUrl.isEmpty()) {
                openAPISpec = parseSpecFromUrl(specUrl);
            } else if (specContent != null && !specContent.isEmpty()) {
                openAPISpec = parseSpecFromContent(specContent);
            } else {
                throw new IntegrationException("OPENAPI", "INVALID_CONFIG", "Either specUrl or specContent is required");
            }
            
            Integration integration = integrationRepository
                    .findByCompanyIdAndPlatform(companyId, Integration.Platform.OPENAPI)
                    .orElse(new Integration());
            
            Company company = new Company();
            company.setId(companyId);
            integration.setCompany(company);
            integration.setPlatform(Integration.Platform.OPENAPI);
            
            JsonNode info = openAPISpec.get("info");
            String title = info != null && info.has("title") ? info.get("title").asText() : "OpenAPI Spec";
            String version = info != null && info.has("version") ? info.get("version").asText() : "1.0.0";
            String description = info != null && info.has("description") ? info.get("description").asText() : "";
            
            integration.setDisplayName(title);
            integration.setStatus(Integration.IntegrationStatus.ACTIVE);
            integration.setLastSyncAt(LocalDateTime.now());
            integration.setLastSyncStatus("Spec parsed successfully");
            
            JsonNode paths = openAPISpec.get("paths");
            int pathCount = paths != null ? paths.size() : 0;
            
            Map<String, Object> config = new HashMap<>();
            config.put("specUrl", specUrl);
            config.put("title", title);
            config.put("version", version);
            config.put("description", description);
            config.put("pathCount", pathCount);
            integration.setConfiguration(objectMapper.writeValueAsString(config));

            return integrationRepository.save(integration);
            
        } catch (IntegrationException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to connect OpenAPI: {}", e.getMessage());
            throw new IntegrationException("OPENAPI", "CONNECTION_FAILED", "Failed to parse OpenAPI spec: " + e.getMessage());
        }
    }

    // ============ Spec Parsing ============

    /**
     * Parse OpenAPI spec from URL
     */
    public JsonNode parseSpecFromUrl(String url) {
        try {
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            String content = response.getBody();
            
            if (content == null || content.isEmpty()) {
                throw new IntegrationException("OPENAPI", "EMPTY_SPEC", "Empty spec from URL");
            }
            
            return parseSpecFromContent(content);
        } catch (IntegrationException e) {
            throw e;
        } catch (Exception e) {
            throw new IntegrationException("OPENAPI", "URL_FETCH_FAILED", "Failed to fetch spec from URL: " + e.getMessage());
        }
    }

    /**
     * Parse OpenAPI spec from content string (JSON or YAML)
     */
    public JsonNode parseSpecFromContent(String content) {
        try {
            // Try JSON first
            if (content.trim().startsWith("{")) {
                return objectMapper.readTree(content);
            }
            // Try YAML
            return yamlMapper.readTree(content);
        } catch (Exception e) {
            throw new IntegrationException("OPENAPI", "PARSE_FAILED", "Failed to parse spec: " + e.getMessage());
        }
    }

    // ============ Documentation Generation ============

    /**
     * Generate markdown documentation from OpenAPI spec
     */
    public String generateMarkdownDocs(JsonNode openAPISpec) {
        StringBuilder md = new StringBuilder();
        
        JsonNode info = openAPISpec.get("info");
        
        // Title and description
        String title = info != null && info.has("title") ? info.get("title").asText() : "API Documentation";
        md.append("# ").append(title).append("\n\n");
        
        if (info != null && info.has("description")) {
            md.append(info.get("description").asText()).append("\n\n");
        }
        
        String version = info != null && info.has("version") ? info.get("version").asText() : "1.0.0";
        md.append("**Version:** ").append(version).append("\n\n");
        
        // Servers
        JsonNode servers = openAPISpec.get("servers");
        if (servers != null && servers.isArray() && servers.size() > 0) {
            md.append("## Servers\n\n");
            for (JsonNode server : servers) {
                md.append("- `").append(server.get("url").asText()).append("`");
                if (server.has("description")) {
                    md.append(" - ").append(server.get("description").asText());
                }
                md.append("\n");
            }
            md.append("\n");
        }
        
        // Endpoints
        JsonNode paths = openAPISpec.get("paths");
        if (paths != null) {
            md.append("## Endpoints\n\n");
            
            // Group by tags
            Map<String, List<EndpointInfo>> endpointsByTag = new LinkedHashMap<>();
            
            Iterator<String> pathIterator = paths.fieldNames();
            while (pathIterator.hasNext()) {
                String path = pathIterator.next();
                JsonNode pathItem = paths.get(path);
                
                Iterator<String> methodIterator = pathItem.fieldNames();
                while (methodIterator.hasNext()) {
                    String method = methodIterator.next();
                    if (method.equals("parameters") || method.equals("servers") || method.equals("$ref")) {
                        continue;
                    }
                    
                    JsonNode operation = pathItem.get(method);
                    String tag = "Default";
                    if (operation.has("tags") && operation.get("tags").isArray() && operation.get("tags").size() > 0) {
                        tag = operation.get("tags").get(0).asText();
                    }
                    
                    String summary = operation.has("summary") ? operation.get("summary").asText() : "";
                    String pathDescription = operation.has("description") ? operation.get("description").asText() : "";
                    
                    endpointsByTag.computeIfAbsent(tag, k -> new ArrayList<>())
                        .add(new EndpointInfo(method.toUpperCase(), path, summary, pathDescription));
                }
            }
            
            endpointsByTag.forEach((tag, endpoints) -> {
                md.append("### ").append(tag).append("\n\n");
                md.append("| Method | Path | Summary |\n");
                md.append("|--------|------|--------|\n");
                
                for (EndpointInfo endpoint : endpoints) {
                    md.append("| `").append(endpoint.method).append("` | `").append(endpoint.path).append("` | ");
                    md.append(endpoint.summary != null ? endpoint.summary : "").append(" |\n");
                }
                md.append("\n");
            });
        }
        
        return md.toString();
    }

    private static class EndpointInfo {
        String method;
        String path;
        String summary;
        String description;
        
        EndpointInfo(String method, String path, String summary, String description) {
            this.method = method;
            this.path = path;
            this.summary = summary;
            this.description = description;
        }
    }

    /**
     * Generate detailed endpoint documentation
     */
    public List<Map<String, Object>> generateEndpointDocs(JsonNode openAPISpec) {
        List<Map<String, Object>> endpoints = new ArrayList<>();
        
        JsonNode paths = openAPISpec.get("paths");
        if (paths == null) return endpoints;
        
        Iterator<String> pathIterator = paths.fieldNames();
        while (pathIterator.hasNext()) {
            String path = pathIterator.next();
            JsonNode pathItem = paths.get(path);
            
            Iterator<String> methodIterator = pathItem.fieldNames();
            while (methodIterator.hasNext()) {
                String method = methodIterator.next();
                if (method.equals("parameters") || method.equals("servers") || method.equals("$ref")) {
                    continue;
                }
                
                JsonNode operation = pathItem.get(method);
                
                Map<String, Object> endpoint = new HashMap<>();
                endpoint.put("method", method.toUpperCase());
                endpoint.put("path", path);
                endpoint.put("operationId", operation.has("operationId") ? operation.get("operationId").asText() : null);
                endpoint.put("summary", operation.has("summary") ? operation.get("summary").asText() : null);
                endpoint.put("description", operation.has("description") ? operation.get("description").asText() : null);
                
                if (operation.has("tags") && operation.get("tags").isArray()) {
                    List<String> tags = new ArrayList<>();
                    for (JsonNode tag : operation.get("tags")) {
                        tags.add(tag.asText());
                    }
                    endpoint.put("tags", tags);
                }
                
                endpoint.put("deprecated", operation.has("deprecated") && operation.get("deprecated").asBoolean());
                
                // Parameters
                if (operation.has("parameters") && operation.get("parameters").isArray()) {
                    List<Map<String, Object>> params = new ArrayList<>();
                    for (JsonNode param : operation.get("parameters")) {
                        Map<String, Object> p = new HashMap<>();
                        p.put("name", param.has("name") ? param.get("name").asText() : null);
                        p.put("in", param.has("in") ? param.get("in").asText() : null);
                        p.put("required", param.has("required") && param.get("required").asBoolean());
                        p.put("description", param.has("description") ? param.get("description").asText() : null);
                        if (param.has("schema") && param.get("schema").has("type")) {
                            p.put("type", param.get("schema").get("type").asText());
                        }
                        params.add(p);
                    }
                    endpoint.put("parameters", params);
                }
                
                // Request body
                if (operation.has("requestBody")) {
                    JsonNode requestBody = operation.get("requestBody");
                    Map<String, Object> body = new HashMap<>();
                    body.put("description", requestBody.has("description") ? requestBody.get("description").asText() : null);
                    body.put("required", requestBody.has("required") && requestBody.get("required").asBoolean());
                    if (requestBody.has("content")) {
                        List<String> contentTypes = new ArrayList<>();
                        requestBody.get("content").fieldNames().forEachRemaining(contentTypes::add);
                        body.put("contentTypes", contentTypes);
                    }
                    endpoint.put("requestBody", body);
                }
                
                // Responses
                if (operation.has("responses")) {
                    Map<String, Object> responses = new HashMap<>();
                    JsonNode responsesNode = operation.get("responses");
                    responsesNode.fieldNames().forEachRemaining(code -> {
                        JsonNode response = responsesNode.get(code);
                        Map<String, Object> r = new HashMap<>();
                        r.put("description", response.has("description") ? response.get("description").asText() : null);
                        if (response.has("content")) {
                            List<String> contentTypes = new ArrayList<>();
                            response.get("content").fieldNames().forEachRemaining(contentTypes::add);
                            r.put("contentTypes", contentTypes);
                        }
                        responses.put(code, r);
                    });
                    endpoint.put("responses", responses);
                }
                
                endpoints.add(endpoint);
            }
        }
        
        return endpoints;
    }

    /**
     * Generate code examples from spec
     */
    public Map<String, String> generateCodeExamples(String method, String path, String baseUrl, Map<String, Object> params) {
        Map<String, String> examples = new HashMap<>();
        
        String url = baseUrl + path;
        
        // Replace path parameters
        if (params != null) {
            for (Map.Entry<String, Object> param : params.entrySet()) {
                url = url.replace("{" + param.getKey() + "}", String.valueOf(param.getValue()));
            }
        }
        
        // cURL example
        StringBuilder curl = new StringBuilder("curl");
        if (!"GET".equalsIgnoreCase(method)) {
            curl.append(" -X ").append(method.toUpperCase());
        }
        curl.append(" '").append(url).append("'");
        curl.append(" \\\n  -H 'Authorization: Bearer YOUR_API_KEY'");
        curl.append(" \\\n  -H 'Content-Type: application/json'");
        if ("POST".equalsIgnoreCase(method) || "PUT".equalsIgnoreCase(method) || "PATCH".equalsIgnoreCase(method)) {
            curl.append(" \\\n  -d '{}'");
        }
        examples.put("curl", curl.toString());
        
        // JavaScript/fetch example
        StringBuilder js = new StringBuilder();
        js.append("const response = await fetch('").append(url).append("', {\n");
        js.append("  method: '").append(method.toUpperCase()).append("',\n");
        js.append("  headers: {\n");
        js.append("    'Authorization': 'Bearer YOUR_API_KEY',\n");
        js.append("    'Content-Type': 'application/json'\n");
        js.append("  }");
        if ("POST".equalsIgnoreCase(method) || "PUT".equalsIgnoreCase(method) || "PATCH".equalsIgnoreCase(method)) {
            js.append(",\n  body: JSON.stringify({})");
        }
        js.append("\n});\n\nconst data = await response.json();");
        examples.put("javascript", js.toString());
        
        // Python example
        StringBuilder py = new StringBuilder();
        py.append("import requests\n\n");
        py.append("response = requests.").append(method.toLowerCase()).append("(\n");
        py.append("    '").append(url).append("',\n");
        py.append("    headers={\n");
        py.append("        'Authorization': 'Bearer YOUR_API_KEY',\n");
        py.append("        'Content-Type': 'application/json'\n");
        py.append("    }");
        if ("POST".equalsIgnoreCase(method) || "PUT".equalsIgnoreCase(method) || "PATCH".equalsIgnoreCase(method)) {
            py.append(",\n    json={}");
        }
        py.append("\n)\n\ndata = response.json()");
        examples.put("python", py.toString());
        
        return examples;
    }

    // ============ Sync Methods ============

    /**
     * Sync OpenAPI spec and regenerate documentation
     */
    @Transactional
    public Map<String, Object> syncSpec(Long integrationId) {
        Integration integration = integrationRepository.findById(integrationId)
                .orElseThrow(() -> new IntegrationException("OPENAPI", "NOT_FOUND", "Integration not found"));
        
        Map<String, Object> result = new HashMap<>();
        
        try {
            JsonNode config = objectMapper.readTree(integration.getConfiguration());
            String specUrl = config.has("specUrl") ? config.get("specUrl").asText() : null;
            
            if (specUrl == null || specUrl.isEmpty()) {
                throw new IntegrationException("OPENAPI", "NO_URL", "No spec URL configured");
            }
            
            JsonNode openAPISpec = parseSpecFromUrl(specUrl);
            
            JsonNode info = openAPISpec.get("info");
            String title = info != null && info.has("title") ? info.get("title").asText() : "API";
            String version = info != null && info.has("version") ? info.get("version").asText() : "1.0.0";
            String desc = info != null && info.has("description") ? info.get("description").asText() : "";
            
            JsonNode paths = openAPISpec.get("paths");
            int pathCount = paths != null ? paths.size() : 0;
            
            // Update config with new info
            Map<String, Object> newConfig = new HashMap<>();
            newConfig.put("specUrl", specUrl);
            newConfig.put("title", title);
            newConfig.put("version", version);
            newConfig.put("description", desc);
            newConfig.put("pathCount", pathCount);
            integration.setConfiguration(objectMapper.writeValueAsString(newConfig));
            
            integration.setLastSyncAt(LocalDateTime.now());
            integration.setLastSyncStatus("Synced: " + pathCount + " endpoints");
            integrationRepository.save(integration);
            
            result.put("success", true);
            result.put("title", title);
            result.put("version", version);
            result.put("endpointCount", pathCount);
            result.put("markdown", generateMarkdownDocs(openAPISpec));
            result.put("endpoints", generateEndpointDocs(openAPISpec));
            
        } catch (IntegrationException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to sync OpenAPI spec: {}", e.getMessage());
            integration.setLastSyncStatus("Error: " + e.getMessage());
            integration.setSyncError(e.getMessage());
            integrationRepository.save(integration);
            
            result.put("success", false);
            result.put("error", e.getMessage());
        }
        
        return result;
    }

    /**
     * Extract code examples from markdown in GitHub
     */
    public List<Map<String, Object>> extractCodeExamplesFromMarkdown(String markdownContent) {
        List<Map<String, Object>> examples = new ArrayList<>();
        
        // Pattern to match code blocks with language
        Pattern pattern = Pattern.compile("```(\\w+)\\n([\\s\\S]*?)```", Pattern.MULTILINE);
        Matcher matcher = pattern.matcher(markdownContent);
        
        int index = 0;
        while (matcher.find()) {
            Map<String, Object> example = new HashMap<>();
            example.put("index", index++);
            example.put("language", matcher.group(1));
            example.put("code", matcher.group(2).trim());
            examples.add(example);
        }
        
        return examples;
    }
}
