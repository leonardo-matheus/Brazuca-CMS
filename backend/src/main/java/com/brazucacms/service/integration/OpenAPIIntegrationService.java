package com.brazucacms.service.integration;

import com.brazucacms.dto.integration.IntegrationConnectRequest;
import com.brazucacms.exception.IntegrationException;
import com.brazucacms.model.Company;
import com.brazucacms.model.Entry;
import com.brazucacms.model.Integration;
import com.brazucacms.repository.IntegrationRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.parser.OpenAPIV3Parser;
import io.swagger.v3.parser.core.models.ParseOptions;
import io.swagger.v3.parser.core.models.SwaggerParseResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * OpenAPI Integration Service
 * Handles:
 * - OpenAPI/Swagger spec parsing
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
    private final ObjectMapper yamlMapper = new ObjectMapper(new YAMLFactory());

    // ============ Connection ============

    @Transactional
    public Integration connectWithUrl(Long companyId, Long userId, IntegrationConnectRequest request) {
        try {
            String specUrl = request.getCredentials().get("specUrl");
            String specContent = request.getCredentials().get("specContent");
            
            // Parse and validate spec
            OpenAPI openAPI;
            if (specUrl != null && !specUrl.isEmpty()) {
                openAPI = parseSpecFromUrl(specUrl);
            } else if (specContent != null && !specContent.isEmpty()) {
                openAPI = parseSpecFromContent(specContent);
            } else {
                throw new IntegrationException("Either specUrl or specContent is required");
            }
            
            Integration integration = integrationRepository
                    .findByCompanyIdAndPlatform(companyId, Integration.Platform.OPENAPI)
                    .orElse(new Integration());
            
            Company company = new Company();
            company.setId(companyId);
            integration.setCompany(company);
            integration.setPlatform(Integration.Platform.OPENAPI);
            integration.setDisplayName(openAPI.getInfo().getTitle());
            integration.setStatus(Integration.IntegrationStatus.ACTIVE);
            integration.setLastSyncAt(LocalDateTime.now());
            integration.setLastSyncStatus("Spec parsed successfully");
            
            Map<String, Object> config = new HashMap<>();
            config.put("specUrl", specUrl);
            config.put("title", openAPI.getInfo().getTitle());
            config.put("version", openAPI.getInfo().getVersion());
            config.put("description", openAPI.getInfo().getDescription());
            config.put("pathCount", openAPI.getPaths() != null ? openAPI.getPaths().size() : 0);
            integration.setConfiguration(objectMapper.writeValueAsString(config));

            return integrationRepository.save(integration);
            
        } catch (Exception e) {
            log.error("Failed to connect OpenAPI: {}", e.getMessage());
            throw new IntegrationException("Failed to parse OpenAPI spec: " + e.getMessage());
        }
    }

    // ============ Spec Parsing ============

    /**
     * Parse OpenAPI spec from URL
     */
    public OpenAPI parseSpecFromUrl(String url) {
        ParseOptions options = new ParseOptions();
        options.setResolve(true);
        
        SwaggerParseResult result = new OpenAPIV3Parser().readLocation(url, null, options);
        
        if (result.getOpenAPI() == null) {
            throw new IntegrationException("Failed to parse OpenAPI spec: " + String.join(", ", result.getMessages()));
        }
        
        return result.getOpenAPI();
    }

    /**
     * Parse OpenAPI spec from content string (JSON or YAML)
     */
    public OpenAPI parseSpecFromContent(String content) {
        ParseOptions options = new ParseOptions();
        options.setResolve(true);
        
        SwaggerParseResult result = new OpenAPIV3Parser().readContents(content, null, options);
        
        if (result.getOpenAPI() == null) {
            throw new IntegrationException("Failed to parse OpenAPI spec: " + String.join(", ", result.getMessages()));
        }
        
        return result.getOpenAPI();
    }

    // ============ Documentation Generation ============

    /**
     * Generate markdown documentation from OpenAPI spec
     */
    public String generateMarkdownDocs(OpenAPI openAPI) {
        StringBuilder md = new StringBuilder();
        
        // Title and description
        md.append("# ").append(openAPI.getInfo().getTitle()).append("\n\n");
        if (openAPI.getInfo().getDescription() != null) {
            md.append(openAPI.getInfo().getDescription()).append("\n\n");
        }
        md.append("**Version:** ").append(openAPI.getInfo().getVersion()).append("\n\n");
        
        // Servers
        if (openAPI.getServers() != null && !openAPI.getServers().isEmpty()) {
            md.append("## Servers\n\n");
            for (var server : openAPI.getServers()) {
                md.append("- `").append(server.getUrl()).append("`");
                if (server.getDescription() != null) {
                    md.append(" - ").append(server.getDescription());
                }
                md.append("\n");
            }
            md.append("\n");
        }
        
        // Endpoints
        if (openAPI.getPaths() != null) {
            md.append("## Endpoints\n\n");
            
            // Group by tags
            Map<String, List<EndpointInfo>> endpointsByTag = new LinkedHashMap<>();
            
            openAPI.getPaths().forEach((path, pathItem) -> {
                pathItem.readOperationsMap().forEach((method, operation) -> {
                    String tag = operation.getTags() != null && !operation.getTags().isEmpty() 
                        ? operation.getTags().get(0) 
                        : "Default";
                    
                    endpointsByTag.computeIfAbsent(tag, k -> new ArrayList<>())
                        .add(new EndpointInfo(method.name(), path, operation.getSummary(), operation.getDescription()));
                });
            });
            
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
    public List<Map<String, Object>> generateEndpointDocs(OpenAPI openAPI) {
        List<Map<String, Object>> endpoints = new ArrayList<>();
        
        if (openAPI.getPaths() == null) return endpoints;
        
        openAPI.getPaths().forEach((path, pathItem) -> {
            pathItem.readOperationsMap().forEach((method, operation) -> {
                Map<String, Object> endpoint = new HashMap<>();
                endpoint.put("method", method.name());
                endpoint.put("path", path);
                endpoint.put("operationId", operation.getOperationId());
                endpoint.put("summary", operation.getSummary());
                endpoint.put("description", operation.getDescription());
                endpoint.put("tags", operation.getTags());
                endpoint.put("deprecated", operation.getDeprecated() != null && operation.getDeprecated());
                
                // Parameters
                if (operation.getParameters() != null) {
                    List<Map<String, Object>> params = new ArrayList<>();
                    for (var param : operation.getParameters()) {
                        Map<String, Object> p = new HashMap<>();
                        p.put("name", param.getName());
                        p.put("in", param.getIn());
                        p.put("required", param.getRequired());
                        p.put("description", param.getDescription());
                        if (param.getSchema() != null) {
                            p.put("type", param.getSchema().getType());
                        }
                        params.add(p);
                    }
                    endpoint.put("parameters", params);
                }
                
                // Request body
                if (operation.getRequestBody() != null) {
                    Map<String, Object> body = new HashMap<>();
                    body.put("description", operation.getRequestBody().getDescription());
                    body.put("required", operation.getRequestBody().getRequired());
                    if (operation.getRequestBody().getContent() != null) {
                        body.put("contentTypes", operation.getRequestBody().getContent().keySet());
                    }
                    endpoint.put("requestBody", body);
                }
                
                // Responses
                if (operation.getResponses() != null) {
                    Map<String, Object> responses = new HashMap<>();
                    operation.getResponses().forEach((code, response) -> {
                        Map<String, Object> r = new HashMap<>();
                        r.put("description", response.getDescription());
                        if (response.getContent() != null) {
                            r.put("contentTypes", response.getContent().keySet());
                        }
                        responses.put(code, r);
                    });
                    endpoint.put("responses", responses);
                }
                
                endpoints.add(endpoint);
            });
        });
        
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
                .orElseThrow(() -> new IntegrationException("Integration not found"));
        
        Map<String, Object> result = new HashMap<>();
        
        try {
            JsonNode config = objectMapper.readTree(integration.getConfiguration());
            String specUrl = config.has("specUrl") ? config.get("specUrl").asText() : null;
            
            if (specUrl == null || specUrl.isEmpty()) {
                throw new IntegrationException("No spec URL configured");
            }
            
            OpenAPI openAPI = parseSpecFromUrl(specUrl);
            
            // Update config with new info
            Map<String, Object> newConfig = new HashMap<>();
            newConfig.put("specUrl", specUrl);
            newConfig.put("title", openAPI.getInfo().getTitle());
            newConfig.put("version", openAPI.getInfo().getVersion());
            newConfig.put("description", openAPI.getInfo().getDescription());
            newConfig.put("pathCount", openAPI.getPaths() != null ? openAPI.getPaths().size() : 0);
            integration.setConfiguration(objectMapper.writeValueAsString(newConfig));
            
            integration.setLastSyncAt(LocalDateTime.now());
            integration.setLastSyncStatus("Synced: " + openAPI.getPaths().size() + " endpoints");
            integrationRepository.save(integration);
            
            result.put("success", true);
            result.put("title", openAPI.getInfo().getTitle());
            result.put("version", openAPI.getInfo().getVersion());
            result.put("endpointCount", openAPI.getPaths() != null ? openAPI.getPaths().size() : 0);
            result.put("markdown", generateMarkdownDocs(openAPI));
            result.put("endpoints", generateEndpointDocs(openAPI));
            
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
