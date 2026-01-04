package com.brazucacms.service.integration;

import com.brazucacms.dto.integration.IntegrationConnectRequest;
import com.brazucacms.dto.integration.SyncedProductResponse;
import com.brazucacms.exception.IntegrationException;
import com.brazucacms.model.Company;
import com.brazucacms.model.Integration;
import com.brazucacms.model.SyncedProduct;
import com.brazucacms.repository.IntegrationRepository;
import com.brazucacms.repository.SyncedProductRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Shopify Integration Service
 * Handles:
 * - OAuth authentication with Shopify stores
 * - Product synchronization
 * - Order webhooks
 * - Inventory management
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class ShopifyIntegrationService {

    private final IntegrationRepository integrationRepository;
    private final SyncedProductRepository syncedProductRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${integrations.shopify.api-key:}")
    private String apiKey;

    @Value("${integrations.shopify.api-secret:}")
    private String apiSecret;

    private static final String SHOPIFY_API_VERSION = "2024-01";

    // ============ OAuth ============

    public String getOAuthUrl(String shopDomain, String redirectUri, String state) {
        String scopes = "read_products,write_products,read_orders,read_inventory";
        return String.format(
            "https://%s/admin/oauth/authorize?client_id=%s&scope=%s&redirect_uri=%s&state=%s",
            shopDomain, apiKey, scopes, redirectUri, state
        );
    }

    @Transactional
    public Integration connectWithOAuth(Long companyId, Long userId, IntegrationConnectRequest request) {
        try {
            String shopDomain = request.getCredentials().get("shopDomain");
            String code = request.getCode();
            
            // Exchange code for permanent access token
            String accessToken = exchangeCodeForToken(shopDomain, code);
            
            // Get shop info
            Map<String, Object> shopInfo = getShopInfo(shopDomain, accessToken);
            
            // Create or update integration
            Integration integration = integrationRepository
                    .findByCompanyIdAndPlatform(companyId, Integration.Platform.SHOPIFY)
                    .orElse(new Integration());
            
            Company company = new Company();
            company.setId(companyId);
            integration.setCompany(company);
            integration.setPlatform(Integration.Platform.SHOPIFY);
            integration.setDisplayName((String) shopInfo.get("name"));
            integration.setAccessToken(accessToken);
            integration.setStatus(Integration.IntegrationStatus.ACTIVE);
            integration.setLastSyncAt(LocalDateTime.now());
            integration.setLastSyncStatus("Connected successfully");
            
            // Store shop config
            Map<String, Object> config = new HashMap<>();
            config.put("shopDomain", shopDomain);
            config.put("shopName", shopInfo.get("name"));
            config.put("email", shopInfo.get("email"));
            config.put("currency", shopInfo.get("currency"));
            config.put("timezone", shopInfo.get("timezone"));
            integration.setConfiguration(objectMapper.writeValueAsString(config));

            return integrationRepository.save(integration);
            
        } catch (Exception e) {
            log.error("Failed to connect Shopify: {}", e.getMessage());
            throw new IntegrationException("Failed to connect Shopify: " + e.getMessage());
        }
    }

    /**
     * Connect using API key (custom app)
     */
    @Transactional
    public Integration connectWithApiKey(Long companyId, Long userId, IntegrationConnectRequest request) {
        try {
            String shopDomain = request.getCredentials().get("shopDomain");
            String accessToken = request.getApiKey();
            
            // Verify connection by getting shop info
            Map<String, Object> shopInfo = getShopInfo(shopDomain, accessToken);
            
            Integration integration = integrationRepository
                    .findByCompanyIdAndPlatform(companyId, Integration.Platform.SHOPIFY)
                    .orElse(new Integration());
            
            Company company = new Company();
            company.setId(companyId);
            integration.setCompany(company);
            integration.setPlatform(Integration.Platform.SHOPIFY);
            integration.setDisplayName((String) shopInfo.get("name"));
            integration.setAccessToken(accessToken);
            integration.setStatus(Integration.IntegrationStatus.ACTIVE);
            integration.setLastSyncAt(LocalDateTime.now());
            
            Map<String, Object> config = new HashMap<>();
            config.put("shopDomain", shopDomain);
            config.put("shopName", shopInfo.get("name"));
            config.put("currency", shopInfo.get("currency"));
            integration.setConfiguration(objectMapper.writeValueAsString(config));

            return integrationRepository.save(integration);
            
        } catch (Exception e) {
            log.error("Failed to connect Shopify with API key: {}", e.getMessage());
            throw new IntegrationException("Failed to connect: " + e.getMessage());
        }
    }

    private String exchangeCodeForToken(String shopDomain, String code) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, String> body = Map.of(
            "client_id", apiKey,
            "client_secret", apiSecret,
            "code", code
        );

        ResponseEntity<JsonNode> response = restTemplate.exchange(
            String.format("https://%s/admin/oauth/access_token", shopDomain),
            HttpMethod.POST,
            new HttpEntity<>(body, headers),
            JsonNode.class
        );

        JsonNode responseBody = response.getBody();
        if (responseBody == null || !responseBody.has("access_token")) {
            throw new IntegrationException("Failed to get access token from Shopify");
        }

        return responseBody.get("access_token").asText();
    }

    // ============ API Methods ============

    public Map<String, Object> getShopInfo(String shopDomain, String accessToken) {
        HttpHeaders headers = createHeaders(accessToken);
        
        ResponseEntity<JsonNode> response = restTemplate.exchange(
            buildApiUrl(shopDomain, "/shop.json"),
            HttpMethod.GET,
            new HttpEntity<>(headers),
            JsonNode.class
        );
        
        JsonNode shop = response.getBody().get("shop");
        Map<String, Object> result = new HashMap<>();
        result.put("id", shop.get("id").asLong());
        result.put("name", shop.get("name").asText());
        result.put("email", shop.get("email").asText());
        result.put("domain", shop.get("domain").asText());
        result.put("currency", shop.get("currency").asText());
        result.put("timezone", shop.get("timezone").asText());
        return result;
    }

    /**
     * Get all products from Shopify store
     */
    public List<Map<String, Object>> getProducts(String shopDomain, String accessToken, int limit) {
        HttpHeaders headers = createHeaders(accessToken);
        
        ResponseEntity<JsonNode> response = restTemplate.exchange(
            buildApiUrl(shopDomain, "/products.json?limit=" + limit),
            HttpMethod.GET,
            new HttpEntity<>(headers),
            JsonNode.class
        );
        
        List<Map<String, Object>> products = new ArrayList<>();
        for (JsonNode product : response.getBody().get("products")) {
            products.add(parseProduct(product));
        }
        return products;
    }

    /**
     * Get a single product by ID
     */
    public Map<String, Object> getProduct(String shopDomain, String accessToken, String productId) {
        HttpHeaders headers = createHeaders(accessToken);
        
        ResponseEntity<JsonNode> response = restTemplate.exchange(
            buildApiUrl(shopDomain, "/products/" + productId + ".json"),
            HttpMethod.GET,
            new HttpEntity<>(headers),
            JsonNode.class
        );
        
        return parseProduct(response.getBody().get("product"));
    }

    /**
     * Get orders
     */
    public List<Map<String, Object>> getOrders(String shopDomain, String accessToken, String status, int limit) {
        HttpHeaders headers = createHeaders(accessToken);
        
        String url = buildApiUrl(shopDomain, "/orders.json?limit=" + limit);
        if (status != null) {
            url += "&status=" + status;
        }
        
        ResponseEntity<JsonNode> response = restTemplate.exchange(
            url,
            HttpMethod.GET,
            new HttpEntity<>(headers),
            JsonNode.class
        );
        
        List<Map<String, Object>> orders = new ArrayList<>();
        for (JsonNode order : response.getBody().get("orders")) {
            Map<String, Object> orderMap = new HashMap<>();
            orderMap.put("id", order.get("id").asLong());
            orderMap.put("orderNumber", order.get("order_number").asInt());
            orderMap.put("email", order.has("email") ? order.get("email").asText() : null);
            orderMap.put("totalPrice", order.get("total_price").asText());
            orderMap.put("currency", order.get("currency").asText());
            orderMap.put("financialStatus", order.get("financial_status").asText());
            orderMap.put("fulfillmentStatus", order.has("fulfillment_status") && !order.get("fulfillment_status").isNull() 
                ? order.get("fulfillment_status").asText() : null);
            orderMap.put("createdAt", order.get("created_at").asText());
            orders.add(orderMap);
        }
        return orders;
    }

    // ============ Sync Methods ============

    /**
     * Sync all products from Shopify to local database
     */
    @Transactional
    public Map<String, Object> syncProducts(Long integrationId) {
        Integration integration = integrationRepository.findById(integrationId)
                .orElseThrow(() -> new IntegrationException("Integration not found"));
        
        Map<String, Object> result = new HashMap<>();
        int created = 0, updated = 0, errors = 0;
        
        try {
            String shopDomain = getShopDomain(integration);
            List<Map<String, Object>> products = getProducts(shopDomain, integration.getAccessToken(), 250);
            
            for (Map<String, Object> productData : products) {
                try {
                    String externalId = String.valueOf(productData.get("id"));
                    
                    SyncedProduct product = syncedProductRepository
                            .findByCompanyIdAndPlatformAndExternalId(
                                integration.getCompany().getId(), 
                                Integration.Platform.SHOPIFY, 
                                externalId)
                            .orElse(new SyncedProduct());
                    
                    boolean isNew = product.getId() == null;
                    
                    product.setCompany(integration.getCompany());
                    product.setIntegration(integration);
                    product.setPlatform(Integration.Platform.SHOPIFY);
                    product.setExternalId(externalId);
                    product.setTitle((String) productData.get("title"));
                    product.setDescription((String) productData.get("bodyHtml"));
                    product.setHtmlDescription((String) productData.get("bodyHtml"));
                    product.setVendor((String) productData.get("vendor"));
                    product.setProductType((String) productData.get("productType"));
                    product.setHandle((String) productData.get("handle"));
                    product.setTags((String) productData.get("tags"));
                    product.setFeaturedImage((String) productData.get("featuredImage"));
                    product.setExternalUrl("https://" + shopDomain + "/products/" + productData.get("handle"));
                    product.setRawData(objectMapper.writeValueAsString(productData));
                    product.setLastSyncedAt(LocalDateTime.now());
                    
                    // Set price from first variant
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> variants = (List<Map<String, Object>>) productData.get("variants");
                    if (variants != null && !variants.isEmpty()) {
                        Map<String, Object> firstVariant = variants.get(0);
                        if (firstVariant.get("price") != null) {
                            product.setPrice(new BigDecimal(String.valueOf(firstVariant.get("price"))));
                        }
                        if (firstVariant.get("compareAtPrice") != null) {
                            product.setCompareAtPrice(new BigDecimal(String.valueOf(firstVariant.get("compareAtPrice"))));
                        }
                        product.setSku((String) firstVariant.get("sku"));
                        if (firstVariant.get("inventoryQuantity") != null) {
                            product.setInventoryQuantity((Integer) firstVariant.get("inventoryQuantity"));
                        }
                    }
                    
                    // Set status
                    String status = (String) productData.get("status");
                    product.setStatus("active".equals(status) ? SyncedProduct.ProductStatus.ACTIVE 
                            : "draft".equals(status) ? SyncedProduct.ProductStatus.DRAFT 
                            : SyncedProduct.ProductStatus.ARCHIVED);
                    
                    syncedProductRepository.save(product);
                    
                    if (isNew) created++;
                    else updated++;
                    
                } catch (Exception e) {
                    log.error("Error syncing product: {}", e.getMessage());
                    errors++;
                }
            }
            
            integration.setLastSyncAt(LocalDateTime.now());
            integration.setLastSyncStatus(String.format("Synced: %d created, %d updated, %d errors", created, updated, errors));
            integration.setSyncError(errors > 0 ? "Some products had errors" : null);
            integrationRepository.save(integration);
            
            result.put("success", true);
            result.put("created", created);
            result.put("updated", updated);
            result.put("errors", errors);
            result.put("total", products.size());
            
        } catch (Exception e) {
            log.error("Failed to sync Shopify products: {}", e.getMessage());
            integration.setLastSyncStatus("Error: " + e.getMessage());
            integration.setSyncError(e.getMessage());
            integrationRepository.save(integration);
            
            result.put("success", false);
            result.put("error", e.getMessage());
        }
        
        return result;
    }

    // ============ Webhook Handling ============

    /**
     * Process incoming Shopify webhook
     */
    public Map<String, Object> processWebhook(String topic, String shopDomain, String payload) {
        log.info("Processing Shopify webhook: {} from {}", topic, shopDomain);
        
        Map<String, Object> result = new HashMap<>();
        result.put("topic", topic);
        result.put("shop", shopDomain);
        result.put("processed", false);

        try {
            JsonNode payloadJson = objectMapper.readTree(payload);
            
            switch (topic) {
                case "products/create":
                case "products/update":
                    result = processProductEvent(topic, shopDomain, payloadJson);
                    break;
                case "products/delete":
                    result = processProductDelete(shopDomain, payloadJson);
                    break;
                case "orders/create":
                case "orders/paid":
                case "orders/fulfilled":
                    result = processOrderEvent(topic, shopDomain, payloadJson);
                    break;
                case "inventory_levels/update":
                    result = processInventoryUpdate(shopDomain, payloadJson);
                    break;
                default:
                    log.info("Unhandled Shopify topic: {}", topic);
            }
        } catch (Exception e) {
            log.error("Error processing Shopify webhook: {}", e.getMessage());
            result.put("error", e.getMessage());
        }

        return result;
    }

    private Map<String, Object> processProductEvent(String topic, String shopDomain, JsonNode payload) {
        Map<String, Object> result = new HashMap<>();
        result.put("topic", topic);
        result.put("processed", true);
        
        String productId = payload.get("id").asText();
        String title = payload.get("title").asText();
        
        result.put("productId", productId);
        result.put("title", title);
        result.put("action", topic.contains("create") ? "created" : "updated");
        
        log.info("Shopify product {}: {} - {}", result.get("action"), productId, title);
        return result;
    }

    private Map<String, Object> processProductDelete(String shopDomain, JsonNode payload) {
        Map<String, Object> result = new HashMap<>();
        result.put("topic", "products/delete");
        result.put("processed", true);
        result.put("productId", payload.get("id").asText());
        result.put("action", "deleted");
        return result;
    }

    private Map<String, Object> processOrderEvent(String topic, String shopDomain, JsonNode payload) {
        Map<String, Object> result = new HashMap<>();
        result.put("topic", topic);
        result.put("processed", true);
        
        result.put("orderId", payload.get("id").asLong());
        result.put("orderNumber", payload.get("order_number").asInt());
        result.put("totalPrice", payload.get("total_price").asText());
        result.put("email", payload.has("email") ? payload.get("email").asText() : null);
        
        log.info("Shopify order event: {} - Order #{}", topic, result.get("orderNumber"));
        return result;
    }

    private Map<String, Object> processInventoryUpdate(String shopDomain, JsonNode payload) {
        Map<String, Object> result = new HashMap<>();
        result.put("topic", "inventory_levels/update");
        result.put("processed", true);
        result.put("inventoryItemId", payload.get("inventory_item_id").asLong());
        result.put("available", payload.get("available").asInt());
        return result;
    }

    // ============ Helpers ============

    private HttpHeaders createHeaders(String accessToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Shopify-Access-Token", accessToken);
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        return headers;
    }

    private String buildApiUrl(String shopDomain, String endpoint) {
        return String.format("https://%s/admin/api/%s%s", shopDomain, SHOPIFY_API_VERSION, endpoint);
    }

    private String getShopDomain(Integration integration) {
        try {
            JsonNode config = objectMapper.readTree(integration.getConfiguration());
            return config.get("shopDomain").asText();
        } catch (Exception e) {
            throw new IntegrationException("Invalid integration configuration");
        }
    }

    private Map<String, Object> parseProduct(JsonNode product) {
        Map<String, Object> result = new HashMap<>();
        result.put("id", product.get("id").asLong());
        result.put("title", product.get("title").asText());
        result.put("bodyHtml", product.has("body_html") ? product.get("body_html").asText() : null);
        result.put("vendor", product.has("vendor") ? product.get("vendor").asText() : null);
        result.put("productType", product.has("product_type") ? product.get("product_type").asText() : null);
        result.put("handle", product.get("handle").asText());
        result.put("status", product.get("status").asText());
        result.put("tags", product.has("tags") ? product.get("tags").asText() : null);
        result.put("createdAt", product.get("created_at").asText());
        result.put("updatedAt", product.get("updated_at").asText());
        
        // Images
        if (product.has("images") && product.get("images").isArray()) {
            List<String> images = new ArrayList<>();
            for (JsonNode img : product.get("images")) {
                images.add(img.get("src").asText());
            }
            result.put("images", images);
            if (!images.isEmpty()) {
                result.put("featuredImage", images.get(0));
            }
        }
        
        // Variants
        if (product.has("variants") && product.get("variants").isArray()) {
            List<Map<String, Object>> variants = new ArrayList<>();
            for (JsonNode variant : product.get("variants")) {
                Map<String, Object> v = new HashMap<>();
                v.put("id", variant.get("id").asLong());
                v.put("title", variant.get("title").asText());
                v.put("price", variant.get("price").asText());
                v.put("compareAtPrice", variant.has("compare_at_price") && !variant.get("compare_at_price").isNull() 
                    ? variant.get("compare_at_price").asText() : null);
                v.put("sku", variant.has("sku") ? variant.get("sku").asText() : null);
                v.put("inventoryQuantity", variant.has("inventory_quantity") ? variant.get("inventory_quantity").asInt() : 0);
                variants.add(v);
            }
            result.put("variants", variants);
        }
        
        return result;
    }
}
