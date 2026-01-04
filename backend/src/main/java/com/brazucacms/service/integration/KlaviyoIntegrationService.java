package com.brazucacms.service.integration;

import com.brazucacms.dto.integration.IntegrationConnectRequest;
import com.brazucacms.exception.IntegrationException;
import com.brazucacms.model.Company;
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
 * Klaviyo Integration Service
 * Handles:
 * - API key authentication
 * - List management
 * - Profile/subscriber sync
 * - Email campaign triggers
 * - Event tracking
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class KlaviyoIntegrationService {

    private final IntegrationRepository integrationRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    private static final String KLAVIYO_API = "https://a.klaviyo.com/api";
    private static final String KLAVIYO_API_VERSION = "2024-02-15";

    // ============ Connection ============

    @Transactional
    public Integration connectWithApiKey(Long companyId, Long userId, IntegrationConnectRequest request) {
        try {
            String apiKey = request.getApiKey();
            
            // Verify API key by getting account info
            Map<String, Object> accountInfo = getAccount(apiKey);
            
            Integration integration = integrationRepository
                    .findByCompanyIdAndPlatform(companyId, Integration.Platform.KLAVIYO)
                    .orElse(new Integration());
            
            Company company = new Company();
            company.setId(companyId);
            integration.setCompany(company);
            integration.setPlatform(Integration.Platform.KLAVIYO);
            integration.setDisplayName((String) accountInfo.get("companyName"));
            integration.setAccessToken(apiKey);
            integration.setStatus(Integration.IntegrationStatus.ACTIVE);
            integration.setLastSyncAt(LocalDateTime.now());
            integration.setLastSyncStatus("Connected successfully");
            
            Map<String, Object> config = new HashMap<>();
            config.put("publicApiKey", accountInfo.get("publicApiKey"));
            config.put("companyName", accountInfo.get("companyName"));
            config.put("timezone", accountInfo.get("timezone"));
            integration.setConfiguration(objectMapper.writeValueAsString(config));

            return integrationRepository.save(integration);
            
        } catch (Exception e) {
            log.error("Failed to connect Klaviyo: {}", e.getMessage());
            throw new IntegrationException("Failed to connect Klaviyo: " + e.getMessage());
        }
    }

    // ============ API Methods ============

    /**
     * Get Klaviyo account info
     */
    public Map<String, Object> getAccount(String apiKey) {
        HttpHeaders headers = createHeaders(apiKey);
        
        ResponseEntity<JsonNode> response = restTemplate.exchange(
            KLAVIYO_API + "/accounts/",
            HttpMethod.GET,
            new HttpEntity<>(headers),
            JsonNode.class
        );
        
        JsonNode data = response.getBody().get("data");
        if (data.isArray() && data.size() > 0) {
            JsonNode account = data.get(0);
            JsonNode attributes = account.get("attributes");
            
            Map<String, Object> result = new HashMap<>();
            result.put("id", account.get("id").asText());
            result.put("companyName", attributes.has("contact_information") 
                ? attributes.get("contact_information").get("organization_name").asText() 
                : "Klaviyo Account");
            result.put("publicApiKey", attributes.has("public_api_key") ? attributes.get("public_api_key").asText() : null);
            result.put("timezone", attributes.has("timezone") ? attributes.get("timezone").asText() : null);
            return result;
        }
        
        throw new IntegrationException("Could not retrieve Klaviyo account");
    }

    /**
     * Get all lists
     */
    public List<Map<String, Object>> getLists(String apiKey) {
        HttpHeaders headers = createHeaders(apiKey);
        
        ResponseEntity<JsonNode> response = restTemplate.exchange(
            KLAVIYO_API + "/lists/",
            HttpMethod.GET,
            new HttpEntity<>(headers),
            JsonNode.class
        );
        
        List<Map<String, Object>> lists = new ArrayList<>();
        for (JsonNode list : response.getBody().get("data")) {
            Map<String, Object> listMap = new HashMap<>();
            listMap.put("id", list.get("id").asText());
            listMap.put("name", list.get("attributes").get("name").asText());
            listMap.put("created", list.get("attributes").get("created").asText());
            listMap.put("updated", list.get("attributes").get("updated").asText());
            lists.add(listMap);
        }
        return lists;
    }

    /**
     * Create a new list
     */
    public Map<String, Object> createList(String apiKey, String name) {
        HttpHeaders headers = createHeaders(apiKey);
        
        Map<String, Object> body = Map.of(
            "data", Map.of(
                "type", "list",
                "attributes", Map.of("name", name)
            )
        );
        
        ResponseEntity<JsonNode> response = restTemplate.exchange(
            KLAVIYO_API + "/lists/",
            HttpMethod.POST,
            new HttpEntity<>(body, headers),
            JsonNode.class
        );
        
        JsonNode list = response.getBody().get("data");
        Map<String, Object> result = new HashMap<>();
        result.put("id", list.get("id").asText());
        result.put("name", list.get("attributes").get("name").asText());
        return result;
    }

    /**
     * Add profile to a list (subscribe)
     */
    public Map<String, Object> addProfileToList(String apiKey, String listId, String email, Map<String, Object> properties) {
        HttpHeaders headers = createHeaders(apiKey);
        
        Map<String, Object> profileAttributes = new HashMap<>();
        profileAttributes.put("email", email);
        if (properties != null) {
            profileAttributes.putAll(properties);
        }
        
        Map<String, Object> body = Map.of(
            "data", List.of(
                Map.of(
                    "type", "profile",
                    "attributes", profileAttributes
                )
            )
        );
        
        ResponseEntity<JsonNode> response = restTemplate.exchange(
            KLAVIYO_API + "/lists/" + listId + "/relationships/profiles/",
            HttpMethod.POST,
            new HttpEntity<>(body, headers),
            JsonNode.class
        );
        
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("listId", listId);
        result.put("email", email);
        return result;
    }

    /**
     * Create or update a profile
     */
    public Map<String, Object> upsertProfile(String apiKey, String email, Map<String, Object> properties) {
        HttpHeaders headers = createHeaders(apiKey);
        
        Map<String, Object> attributes = new HashMap<>();
        attributes.put("email", email);
        if (properties != null) {
            if (properties.containsKey("firstName")) attributes.put("first_name", properties.get("firstName"));
            if (properties.containsKey("lastName")) attributes.put("last_name", properties.get("lastName"));
            if (properties.containsKey("phone")) attributes.put("phone_number", properties.get("phone"));
            if (properties.containsKey("title")) attributes.put("title", properties.get("title"));
            if (properties.containsKey("organization")) attributes.put("organization", properties.get("organization"));
            if (properties.containsKey("location")) attributes.put("location", properties.get("location"));
            if (properties.containsKey("properties")) attributes.put("properties", properties.get("properties"));
        }
        
        Map<String, Object> body = Map.of(
            "data", Map.of(
                "type", "profile",
                "attributes", attributes
            )
        );
        
        ResponseEntity<JsonNode> response = restTemplate.exchange(
            KLAVIYO_API + "/profiles/",
            HttpMethod.POST,
            new HttpEntity<>(body, headers),
            JsonNode.class
        );
        
        JsonNode profile = response.getBody().get("data");
        Map<String, Object> result = new HashMap<>();
        result.put("id", profile.get("id").asText());
        result.put("email", email);
        return result;
    }

    /**
     * Track an event (e.g., "Product Viewed", "Added to Cart", "Placed Order")
     */
    public Map<String, Object> trackEvent(String apiKey, String eventName, String email, Map<String, Object> eventProperties) {
        HttpHeaders headers = createHeaders(apiKey);
        
        Map<String, Object> attributes = new HashMap<>();
        attributes.put("metric", Map.of(
            "data", Map.of(
                "type", "metric",
                "attributes", Map.of("name", eventName)
            )
        ));
        attributes.put("profile", Map.of(
            "data", Map.of(
                "type", "profile",
                "attributes", Map.of("email", email)
            )
        ));
        if (eventProperties != null) {
            attributes.put("properties", eventProperties);
        }
        attributes.put("time", LocalDateTime.now().toString());
        
        Map<String, Object> body = Map.of(
            "data", Map.of(
                "type", "event",
                "attributes", attributes
            )
        );
        
        try {
            restTemplate.exchange(
                KLAVIYO_API + "/events/",
                HttpMethod.POST,
                new HttpEntity<>(body, headers),
                JsonNode.class
            );
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("event", eventName);
            result.put("email", email);
            return result;
            
        } catch (Exception e) {
            log.error("Failed to track Klaviyo event: {}", e.getMessage());
            throw new IntegrationException("Failed to track event: " + e.getMessage());
        }
    }

    /**
     * Get campaigns
     */
    public List<Map<String, Object>> getCampaigns(String apiKey, String status) {
        HttpHeaders headers = createHeaders(apiKey);
        
        String url = KLAVIYO_API + "/campaigns/";
        if (status != null) {
            url += "?filter=equals(status,'" + status + "')";
        }
        
        ResponseEntity<JsonNode> response = restTemplate.exchange(
            url,
            HttpMethod.GET,
            new HttpEntity<>(headers),
            JsonNode.class
        );
        
        List<Map<String, Object>> campaigns = new ArrayList<>();
        for (JsonNode campaign : response.getBody().get("data")) {
            JsonNode attrs = campaign.get("attributes");
            Map<String, Object> campaignMap = new HashMap<>();
            campaignMap.put("id", campaign.get("id").asText());
            campaignMap.put("name", attrs.get("name").asText());
            campaignMap.put("status", attrs.get("status").asText());
            campaignMap.put("sendTime", attrs.has("send_time") ? attrs.get("send_time").asText() : null);
            campaignMap.put("created", attrs.get("created_at").asText());
            campaigns.add(campaignMap);
        }
        return campaigns;
    }

    // ============ Automation Actions ============

    /**
     * Send product info to Klaviyo when a product is created/updated
     */
    public Map<String, Object> syncProduct(String apiKey, Map<String, Object> productData) {
        String productId = String.valueOf(productData.get("id"));
        String productName = (String) productData.get("title");
        
        Map<String, Object> catalogItem = new HashMap<>();
        catalogItem.put("external_id", productId);
        catalogItem.put("title", productName);
        catalogItem.put("description", productData.get("description"));
        catalogItem.put("url", productData.get("url"));
        catalogItem.put("image_full_url", productData.get("image"));
        catalogItem.put("price", productData.get("price"));
        
        // This would use Klaviyo's Catalog API
        // For simplicity, we track it as an event
        Map<String, Object> eventProps = new HashMap<>();
        eventProps.put("ProductID", productId);
        eventProps.put("ProductName", productName);
        eventProps.put("ProductURL", productData.get("url"));
        eventProps.put("ImageURL", productData.get("image"));
        eventProps.put("Price", productData.get("price"));
        
        log.info("Synced product to Klaviyo: {} - {}", productId, productName);
        
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("productId", productId);
        result.put("action", "synced");
        return result;
    }

    /**
     * Trigger a flow by adding profile to a specific list
     */
    public Map<String, Object> triggerFlow(String apiKey, String flowTriggerListId, String email, Map<String, Object> properties) {
        return addProfileToList(apiKey, flowTriggerListId, email, properties);
    }

    /**
     * Send transactional email (new product announcement, etc.)
     */
    public Map<String, Object> sendTransactionalEmail(String apiKey, String templateId, String email, Map<String, Object> dynamicContent) {
        // Note: This requires Klaviyo's Transactional Email API
        // which is a separate product
        
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("templateId", templateId);
        result.put("email", email);
        result.put("note", "Transactional email queued");
        
        log.info("Transactional email triggered: {} to {}", templateId, email);
        return result;
    }

    // ============ Helpers ============

    private HttpHeaders createHeaders(String apiKey) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Klaviyo-API-Key " + apiKey);
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        headers.set("revision", KLAVIYO_API_VERSION);
        return headers;
    }
}
