package com.brazucacms.dto.integration;

import com.brazucacms.model.SyncedProduct;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SyncedProductResponse {
    private Long id;
    private String platform;
    private String platformDisplayName;
    private String externalId;
    private String title;
    private String description;
    private BigDecimal price;
    private BigDecimal compareAtPrice;
    private String currency;
    private String sku;
    private Integer inventoryQuantity;
    private String vendor;
    private String productType;
    private List<String> images;
    private String featuredImage;
    private String tags;
    private String handle;
    private String status;
    private String externalUrl;
    private Long cmsEntryId;
    private LocalDateTime publishedAt;
    private LocalDateTime lastSyncedAt;
    private LocalDateTime createdAt;

    public static SyncedProductResponse fromEntity(SyncedProduct product) {
        return SyncedProductResponse.builder()
                .id(product.getId())
                .platform(product.getPlatform().name())
                .platformDisplayName(product.getPlatform().getDisplayName())
                .externalId(product.getExternalId())
                .title(product.getTitle())
                .description(product.getDescription())
                .price(product.getPrice())
                .compareAtPrice(product.getCompareAtPrice())
                .currency(product.getCurrency())
                .sku(product.getSku())
                .inventoryQuantity(product.getInventoryQuantity())
                .vendor(product.getVendor())
                .productType(product.getProductType())
                .featuredImage(product.getFeaturedImage())
                .tags(product.getTags())
                .handle(product.getHandle())
                .status(product.getStatus().name())
                .externalUrl(product.getExternalUrl())
                .cmsEntryId(product.getCmsEntry() != null ? product.getCmsEntry().getId() : null)
                .publishedAt(product.getPublishedAt())
                .lastSyncedAt(product.getLastSyncedAt())
                .createdAt(product.getCreatedAt())
                .build();
    }
}
