package com.brazucacms.service.integration;

import com.brazucacms.dto.integration.IntegrationConnectRequest;
import com.brazucacms.model.Integration;
import com.brazucacms.model.SyncedProduct;
import com.brazucacms.repository.IntegrationRepository;
import com.brazucacms.repository.SyncedProductRepository;
import com.brazucacms.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Service for WooCommerce e-commerce integration.
 * Handles products, orders, customers, and webhooks.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class WooCommerceIntegrationService {

    private final IntegrationRepository integrationRepository;
    private final SyncedProductRepository productRepository;
    private final UserRepository userRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    /**
     * Connect WooCommerce with REST API credentials
     */
    public Integration connectWithApiKey(Long companyId, Long userId, IntegrationConnectRequest request) {
        var user = userRepository.findById(userId).orElseThrow();
        
        String storeUrl = (String) request.getConfig().get("storeUrl");
        String consumerKey = (String) request.getConfig().get("consumerKey");
        String consumerSecret = (String) request.getConfig().get("consumerSecret");
        
        // Remove trailing slash
        if (storeUrl.endsWith("/")) {
            storeUrl = storeUrl.substring(0, storeUrl.length() - 1);
        }
        
        // Validate credentials by fetching store info
        Map<String, Object> storeInfo = getStoreInfo(storeUrl, consumerKey, consumerSecret);
        
        Integration integration = new Integration();
        integration.setCompany(user.getCompany());
        integration.setConnectedBy(user);
        integration.setPlatform(Integration.Platform.WOOCOMMERCE);
        integration.setName(request.getName() != null ? request.getName() : "WooCommerce");
        integration.setStatus(Integration.IntegrationStatus.ACTIVE);
        integration.setAccessToken(consumerKey);
        integration.setRefreshToken(consumerSecret); // Store secret as refresh token
        
        Map<String, Object> config = new HashMap<>();
        config.put("storeUrl", storeUrl);
        config.put("siteName", storeInfo.getOrDefault("name", "WooCommerce Store"));
        config.put("siteDescription", storeInfo.get("description"));
        config.put("wooVersion", storeInfo.get("wc_version"));
        config.put("wpVersion", storeInfo.get("version"));
        
        try {
            integration.setConfig(objectMapper.writeValueAsString(config));
        } catch (Exception e) {
            log.error("Failed to serialize config", e);
        }
        
        integration.setConnectedAt(LocalDateTime.now());
        
        return integrationRepository.save(integration);
    }

    /**
     * Get store information
     */
    public Map<String, Object> getStoreInfo(String storeUrl, String consumerKey, String consumerSecret) {
        HttpHeaders headers = createHeaders(consumerKey, consumerSecret);
        HttpEntity<?> entity = new HttpEntity<>(headers);
        
        ResponseEntity<Map> response = restTemplate.exchange(
                storeUrl + "/wp-json/wc/v3/",
                HttpMethod.GET,
                entity,
                Map.class
        );
        
        return response.getBody();
    }

    /**
     * Get products
     */
    public Map<String, Object> getProducts(Long integrationId, int page, int perPage, String status) {
        Integration integration = getIntegration(integrationId);
        String baseUrl = getStoreUrl(integration);
        HttpHeaders headers = createHeaders(integration.getAccessToken(), integration.getRefreshToken());
        HttpEntity<?> entity = new HttpEntity<>(headers);
        
        StringBuilder url = new StringBuilder(baseUrl);
        url.append("/wp-json/wc/v3/products?");
        url.append("page=").append(page);
        url.append("&per_page=").append(perPage);
        
        if (status != null) {
            url.append("&status=").append(status);
        }
        
        ResponseEntity<List> response = restTemplate.exchange(
                url.toString(),
                HttpMethod.GET,
                entity,
                List.class
        );
        
        String totalItems = response.getHeaders().getFirst("X-WP-Total");
        String totalPages = response.getHeaders().getFirst("X-WP-TotalPages");
        
        return Map.of(
                "products", response.getBody(),
                "total", totalItems != null ? Integer.parseInt(totalItems) : 0,
                "totalPages", totalPages != null ? Integer.parseInt(totalPages) : 0,
                "page", page,
                "perPage", perPage
        );
    }

    /**
     * Get single product
     */
    public Map<String, Object> getProduct(Long integrationId, Long productId) {
        Integration integration = getIntegration(integrationId);
        String baseUrl = getStoreUrl(integration);
        HttpHeaders headers = createHeaders(integration.getAccessToken(), integration.getRefreshToken());
        HttpEntity<?> entity = new HttpEntity<>(headers);
        
        ResponseEntity<Map> response = restTemplate.exchange(
                baseUrl + "/wp-json/wc/v3/products/" + productId,
                HttpMethod.GET,
                entity,
                Map.class
        );
        
        return response.getBody();
    }

    /**
     * Create product
     */
    public Map<String, Object> createProduct(Long integrationId, Map<String, Object> productData) {
        Integration integration = getIntegration(integrationId);
        String baseUrl = getStoreUrl(integration);
        HttpHeaders headers = createHeaders(integration.getAccessToken(), integration.getRefreshToken());
        headers.setContentType(MediaType.APPLICATION_JSON);
        
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(productData, headers);
        
        ResponseEntity<Map> response = restTemplate.exchange(
                baseUrl + "/wp-json/wc/v3/products",
                HttpMethod.POST,
                entity,
                Map.class
        );
        
        return response.getBody();
    }

    /**
     * Update product
     */
    public Map<String, Object> updateProduct(Long integrationId, Long productId, Map<String, Object> productData) {
        Integration integration = getIntegration(integrationId);
        String baseUrl = getStoreUrl(integration);
        HttpHeaders headers = createHeaders(integration.getAccessToken(), integration.getRefreshToken());
        headers.setContentType(MediaType.APPLICATION_JSON);
        
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(productData, headers);
        
        ResponseEntity<Map> response = restTemplate.exchange(
                baseUrl + "/wp-json/wc/v3/products/" + productId,
                HttpMethod.PUT,
                entity,
                Map.class
        );
        
        return response.getBody();
    }

    /**
     * Get orders
     */
    public Map<String, Object> getOrders(Long integrationId, int page, int perPage, String status) {
        Integration integration = getIntegration(integrationId);
        String baseUrl = getStoreUrl(integration);
        HttpHeaders headers = createHeaders(integration.getAccessToken(), integration.getRefreshToken());
        HttpEntity<?> entity = new HttpEntity<>(headers);
        
        StringBuilder url = new StringBuilder(baseUrl);
        url.append("/wp-json/wc/v3/orders?");
        url.append("page=").append(page);
        url.append("&per_page=").append(perPage);
        
        if (status != null) {
            url.append("&status=").append(status);
        }
        
        ResponseEntity<List> response = restTemplate.exchange(
                url.toString(),
                HttpMethod.GET,
                entity,
                List.class
        );
        
        String totalItems = response.getHeaders().getFirst("X-WP-Total");
        String totalPages = response.getHeaders().getFirst("X-WP-TotalPages");
        
        return Map.of(
                "orders", response.getBody(),
                "total", totalItems != null ? Integer.parseInt(totalItems) : 0,
                "totalPages", totalPages != null ? Integer.parseInt(totalPages) : 0,
                "page", page,
                "perPage", perPage
        );
    }

    /**
     * Get single order
     */
    public Map<String, Object> getOrder(Long integrationId, Long orderId) {
        Integration integration = getIntegration(integrationId);
        String baseUrl = getStoreUrl(integration);
        HttpHeaders headers = createHeaders(integration.getAccessToken(), integration.getRefreshToken());
        HttpEntity<?> entity = new HttpEntity<>(headers);
        
        ResponseEntity<Map> response = restTemplate.exchange(
                baseUrl + "/wp-json/wc/v3/orders/" + orderId,
                HttpMethod.GET,
                entity,
                Map.class
        );
        
        return response.getBody();
    }

    /**
     * Update order status
     */
    public Map<String, Object> updateOrderStatus(Long integrationId, Long orderId, String status) {
        Integration integration = getIntegration(integrationId);
        String baseUrl = getStoreUrl(integration);
        HttpHeaders headers = createHeaders(integration.getAccessToken(), integration.getRefreshToken());
        headers.setContentType(MediaType.APPLICATION_JSON);
        
        Map<String, Object> body = Map.of("status", status);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        
        ResponseEntity<Map> response = restTemplate.exchange(
                baseUrl + "/wp-json/wc/v3/orders/" + orderId,
                HttpMethod.PUT,
                entity,
                Map.class
        );
        
        return response.getBody();
    }

    /**
     * Get customers
     */
    public Map<String, Object> getCustomers(Long integrationId, int page, int perPage, String search) {
        Integration integration = getIntegration(integrationId);
        String baseUrl = getStoreUrl(integration);
        HttpHeaders headers = createHeaders(integration.getAccessToken(), integration.getRefreshToken());
        HttpEntity<?> entity = new HttpEntity<>(headers);
        
        StringBuilder url = new StringBuilder(baseUrl);
        url.append("/wp-json/wc/v3/customers?");
        url.append("page=").append(page);
        url.append("&per_page=").append(perPage);
        
        if (search != null) {
            url.append("&search=").append(search);
        }
        
        ResponseEntity<List> response = restTemplate.exchange(
                url.toString(),
                HttpMethod.GET,
                entity,
                List.class
        );
        
        String totalItems = response.getHeaders().getFirst("X-WP-Total");
        String totalPages = response.getHeaders().getFirst("X-WP-TotalPages");
        
        return Map.of(
                "customers", response.getBody(),
                "total", totalItems != null ? Integer.parseInt(totalItems) : 0,
                "totalPages", totalPages != null ? Integer.parseInt(totalPages) : 0,
                "page", page,
                "perPage", perPage
        );
    }

    /**
     * Get categories
     */
    public List<Map<String, Object>> getCategories(Long integrationId) {
        Integration integration = getIntegration(integrationId);
        String baseUrl = getStoreUrl(integration);
        HttpHeaders headers = createHeaders(integration.getAccessToken(), integration.getRefreshToken());
        HttpEntity<?> entity = new HttpEntity<>(headers);
        
        ResponseEntity<List> response = restTemplate.exchange(
                baseUrl + "/wp-json/wc/v3/products/categories?per_page=100",
                HttpMethod.GET,
                entity,
                List.class
        );
        
        return response.getBody();
    }

    /**
     * Get coupons
     */
    public Map<String, Object> getCoupons(Long integrationId, int page, int perPage) {
        Integration integration = getIntegration(integrationId);
        String baseUrl = getStoreUrl(integration);
        HttpHeaders headers = createHeaders(integration.getAccessToken(), integration.getRefreshToken());
        HttpEntity<?> entity = new HttpEntity<>(headers);
        
        String url = baseUrl + "/wp-json/wc/v3/coupons?page=" + page + "&per_page=" + perPage;
        
        ResponseEntity<List> response = restTemplate.exchange(url, HttpMethod.GET, entity, List.class);
        
        String totalItems = response.getHeaders().getFirst("X-WP-Total");
        
        return Map.of(
                "coupons", response.getBody(),
                "total", totalItems != null ? Integer.parseInt(totalItems) : 0
        );
    }

    /**
     * Create coupon
     */
    public Map<String, Object> createCoupon(Long integrationId, Map<String, Object> couponData) {
        Integration integration = getIntegration(integrationId);
        String baseUrl = getStoreUrl(integration);
        HttpHeaders headers = createHeaders(integration.getAccessToken(), integration.getRefreshToken());
        headers.setContentType(MediaType.APPLICATION_JSON);
        
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(couponData, headers);
        
        ResponseEntity<Map> response = restTemplate.exchange(
                baseUrl + "/wp-json/wc/v3/coupons",
                HttpMethod.POST,
                entity,
                Map.class
        );
        
        return response.getBody();
    }

    /**
     * Get reports - sales
     */
    public List<Map<String, Object>> getSalesReport(Long integrationId, String dateMin, String dateMax) {
        Integration integration = getIntegration(integrationId);
        String baseUrl = getStoreUrl(integration);
        HttpHeaders headers = createHeaders(integration.getAccessToken(), integration.getRefreshToken());
        HttpEntity<?> entity = new HttpEntity<>(headers);
        
        StringBuilder url = new StringBuilder(baseUrl);
        url.append("/wp-json/wc/v3/reports/sales?");
        if (dateMin != null) url.append("date_min=").append(dateMin).append("&");
        if (dateMax != null) url.append("date_max=").append(dateMax);
        
        ResponseEntity<List> response = restTemplate.exchange(url.toString(), HttpMethod.GET, entity, List.class);
        return response.getBody();
    }

    /**
     * Get reports - top sellers
     */
    public List<Map<String, Object>> getTopSellers(Long integrationId, String period) {
        Integration integration = getIntegration(integrationId);
        String baseUrl = getStoreUrl(integration);
        HttpHeaders headers = createHeaders(integration.getAccessToken(), integration.getRefreshToken());
        HttpEntity<?> entity = new HttpEntity<>(headers);
        
        String url = baseUrl + "/wp-json/wc/v3/reports/top_sellers?period=" + (period != null ? period : "month");
        
        ResponseEntity<List> response = restTemplate.exchange(url, HttpMethod.GET, entity, List.class);
        return response.getBody();
    }

    /**
     * Sync products to CMS
     */
    public Map<String, Object> syncProducts(Long integrationId) {
        Integration integration = getIntegration(integrationId);
        
        List<SyncedProduct> syncedProducts = new ArrayList<>();
        int page = 1;
        int perPage = 100;
        int totalSynced = 0;
        
        while (true) {
            Map<String, Object> result = getProducts(integrationId, page, perPage, "publish");
            List<Map<String, Object>> products = (List<Map<String, Object>>) result.get("products");
            
            if (products == null || products.isEmpty()) break;
            
            for (Map<String, Object> product : products) {
                String externalId = String.valueOf(product.get("id"));
                
                SyncedProduct synced = productRepository
                        .findByIntegrationIdAndExternalId(integrationId, externalId)
                        .orElse(new SyncedProduct());
                
                synced.setCompany(integration.getCompany());
                synced.setIntegration(integration);
                synced.setPlatform(Integration.Platform.WOOCOMMERCE);
                synced.setExternalId(externalId);
                synced.setTitle((String) product.get("name"));
                synced.setDescription((String) product.get("description"));
                synced.setHandle((String) product.get("slug"));
                synced.setStatus((String) product.get("status"));
                
                // Price
                String price = (String) product.get("price");
                if (price != null && !price.isEmpty()) {
                    synced.setPrice(Double.parseDouble(price));
                }
                
                String comparePrice = (String) product.get("regular_price");
                if (comparePrice != null && !comparePrice.isEmpty()) {
                    synced.setCompareAtPrice(Double.parseDouble(comparePrice));
                }
                
                // Inventory
                Object stockQty = product.get("stock_quantity");
                if (stockQty != null) {
                    synced.setInventoryQuantity(((Number) stockQty).intValue());
                }
                
                // Images
                List<Map<String, Object>> images = (List<Map<String, Object>>) product.get("images");
                if (images != null && !images.isEmpty()) {
                    List<String> imageUrls = images.stream()
                            .map(img -> (String) img.get("src"))
                            .toList();
                    try {
                        synced.setImages(objectMapper.writeValueAsString(imageUrls));
                    } catch (Exception e) {
                        log.error("Failed to serialize images", e);
                    }
                }
                
                // Categories
                List<Map<String, Object>> categories = (List<Map<String, Object>>) product.get("categories");
                if (categories != null && !categories.isEmpty()) {
                    List<String> categoryNames = categories.stream()
                            .map(cat -> (String) cat.get("name"))
                            .toList();
                    try {
                        synced.setCategories(objectMapper.writeValueAsString(categoryNames));
                    } catch (Exception e) {
                        log.error("Failed to serialize categories", e);
                    }
                }
                
                // SKU
                synced.setSku((String) product.get("sku"));
                
                // Variants (for variable products)
                List<Map<String, Object>> variations = (List<Map<String, Object>>) product.get("variations");
                if (variations != null && !variations.isEmpty()) {
                    try {
                        synced.setVariants(objectMapper.writeValueAsString(variations));
                    } catch (Exception e) {
                        log.error("Failed to serialize variants", e);
                    }
                }
                
                // Raw data
                try {
                    synced.setRawData(objectMapper.writeValueAsString(product));
                } catch (Exception e) {
                    log.error("Failed to serialize raw data", e);
                }
                
                synced.setLastSyncedAt(LocalDateTime.now());
                productRepository.save(synced);
                totalSynced++;
            }
            
            int total = (int) result.get("total");
            if (totalSynced >= total) break;
            
            page++;
        }
        
        // Update integration sync stats
        integration.setLastSyncAt(LocalDateTime.now());
        integration.setTotalSyncs(integration.getTotalSyncs() + 1);
        integration.setTotalItemsSynced(integration.getTotalItemsSynced() + totalSynced);
        integrationRepository.save(integration);
        
        return Map.of(
                "synced", totalSynced,
                "syncedAt", LocalDateTime.now().toString()
        );
    }

    /**
     * Register webhook
     */
    public Map<String, Object> registerWebhook(Long integrationId, String topic, String deliveryUrl) {
        Integration integration = getIntegration(integrationId);
        String baseUrl = getStoreUrl(integration);
        HttpHeaders headers = createHeaders(integration.getAccessToken(), integration.getRefreshToken());
        headers.setContentType(MediaType.APPLICATION_JSON);
        
        Map<String, Object> body = new HashMap<>();
        body.put("name", "BrazucaCMS - " + topic);
        body.put("topic", topic);
        body.put("delivery_url", deliveryUrl);
        body.put("status", "active");
        
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        
        ResponseEntity<Map> response = restTemplate.exchange(
                baseUrl + "/wp-json/wc/v3/webhooks",
                HttpMethod.POST,
                entity,
                Map.class
        );
        
        // Store webhook info
        try {
            Map<String, Object> config = objectMapper.readValue(integration.getConfig(), Map.class);
            List<Map<String, Object>> webhooks = (List<Map<String, Object>>) config.getOrDefault("webhooks", new ArrayList<>());
            webhooks.add(Map.of(
                    "id", response.getBody().get("id"),
                    "topic", topic
            ));
            config.put("webhooks", webhooks);
            integration.setConfig(objectMapper.writeValueAsString(config));
            integration.setWebhookConfigured(true);
            integrationRepository.save(integration);
        } catch (Exception e) {
            log.error("Failed to save webhook config", e);
        }
        
        return response.getBody();
    }

    /**
     * Process webhook
     */
    public Map<String, Object> processWebhook(String topic, String signature, String payload) {
        log.info("Processing WooCommerce webhook: {}", topic);
        
        // In production, verify signature
        
        try {
            Map<String, Object> data = objectMapper.readValue(payload, Map.class);
            
            Map<String, Object> result = new HashMap<>();
            result.put("topic", topic);
            result.put("processed", true);
            
            switch (topic) {
                case "product.created":
                case "product.updated":
                    result.put("productId", data.get("id"));
                    result.put("productName", data.get("name"));
                    break;
                    
                case "product.deleted":
                    result.put("productId", data.get("id"));
                    result.put("deleted", true);
                    break;
                    
                case "order.created":
                case "order.updated":
                    result.put("orderId", data.get("id"));
                    result.put("orderTotal", data.get("total"));
                    result.put("status", data.get("status"));
                    break;
                    
                case "customer.created":
                case "customer.updated":
                    result.put("customerId", data.get("id"));
                    result.put("email", data.get("email"));
                    break;
                    
                default:
                    result.put("message", "Topic not handled");
            }
            
            return result;
        } catch (Exception e) {
            log.error("Failed to process webhook", e);
            throw new RuntimeException("Failed to process webhook: " + e.getMessage());
        }
    }

    // ============ Helper Methods ============

    private Integration getIntegration(Long integrationId) {
        return integrationRepository.findById(integrationId)
                .orElseThrow(() -> new RuntimeException("Integration not found"));
    }

    private String getStoreUrl(Integration integration) {
        try {
            Map<String, Object> config = objectMapper.readValue(integration.getConfig(), Map.class);
            return (String) config.get("storeUrl");
        } catch (Exception e) {
            throw new RuntimeException("Invalid integration config");
        }
    }

    private HttpHeaders createHeaders(String consumerKey, String consumerSecret) {
        HttpHeaders headers = new HttpHeaders();
        String credentials = consumerKey + ":" + consumerSecret;
        String encodedCredentials = Base64.getEncoder().encodeToString(credentials.getBytes());
        headers.set("Authorization", "Basic " + encodedCredentials);
        return headers;
    }
}
