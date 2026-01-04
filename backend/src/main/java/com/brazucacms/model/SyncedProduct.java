package com.brazucacms.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Synced product from Shopify/WooCommerce.
 * Used for e-commerce integrations.
 */
@Entity
@Table(name = "synced_products", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"company_id", "platform", "external_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SyncedProduct {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "integration_id", nullable = false)
    private Integration integration;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Integration.Platform platform;

    @Column(name = "external_id", nullable = false)
    private String externalId; // Shopify/WooCommerce product ID

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "html_description", columnDefinition = "TEXT")
    private String htmlDescription;

    @Column(precision = 10, scale = 2)
    private BigDecimal price;

    @Column(name = "compare_at_price", precision = 10, scale = 2)
    private BigDecimal compareAtPrice;

    private String currency;

    private String sku;

    private String barcode;

    @Column(name = "inventory_quantity")
    @Builder.Default
    private Integer inventoryQuantity = 0;

    @Column(name = "track_inventory")
    @Builder.Default
    private Boolean trackInventory = true;

    private String vendor;

    @Column(name = "product_type")
    private String productType;

    // Images stored as JSON array
    @Column(columnDefinition = "TEXT")
    private String images;

    @Column(name = "featured_image")
    private String featuredImage;

    // Variants stored as JSON array
    @Column(columnDefinition = "TEXT")
    private String variants;

    // Tags as comma-separated
    private String tags;

    // SEO
    @Column(name = "seo_title")
    private String seoTitle;

    @Column(name = "seo_description", columnDefinition = "TEXT")
    private String seoDescription;

    private String handle; // URL slug

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ProductStatus status = ProductStatus.ACTIVE;

    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    // Link to CMS entry if synced
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cms_entry_id")
    private Entry cmsEntry;

    @Column(name = "external_url")
    private String externalUrl;

    // Raw data from platform
    @Column(name = "raw_data", columnDefinition = "TEXT")
    private String rawData;

    @Column(name = "last_synced_at")
    private LocalDateTime lastSyncedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum ProductStatus {
        ACTIVE,
        DRAFT,
        ARCHIVED
    }
}
