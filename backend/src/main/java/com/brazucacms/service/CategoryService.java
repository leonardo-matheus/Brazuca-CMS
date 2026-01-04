package com.brazucacms.service;

import com.brazucacms.dto.category.CategoryRequest;
import com.brazucacms.dto.category.CategoryResponse;
import com.brazucacms.dto.common.PageResponse;
import com.brazucacms.exception.ResourceNotFoundException;
import com.brazucacms.model.Category;
import com.brazucacms.model.ContentType;
import com.brazucacms.repository.CategoryRepository;
import com.brazucacms.repository.ContentTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final ContentTypeRepository contentTypeRepository;

    public List<CategoryResponse> getCategoriesByContentType(Long contentTypeId) {
        return categoryRepository.findByContentTypeId(contentTypeId).stream()
                .map(CategoryResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public PageResponse<CategoryResponse> getCategoriesByContentType(Long contentTypeId, Pageable pageable) {
        Page<Category> page = categoryRepository.findByContentTypeId(contentTypeId, pageable);
        return PageResponse.from(page.map(CategoryResponse::fromEntity));
    }

    public CategoryResponse getCategoryById(Long contentTypeId, Long id) {
        Category category = categoryRepository.findByIdAndContentTypeId(id, contentTypeId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));
        return CategoryResponse.fromEntity(category);
    }

    public CategoryResponse getCategoryBySlug(Long contentTypeId, String slug) {
        Category category = categoryRepository.findByContentTypeIdAndSlug(contentTypeId, slug)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with slug: " + slug));
        return CategoryResponse.fromEntity(category);
    }

    @Transactional
    public CategoryResponse createCategory(Long contentTypeId, CategoryRequest request) {
        ContentType contentType = contentTypeRepository.findById(contentTypeId)
                .orElseThrow(() -> new ResourceNotFoundException("Content type not found with id: " + contentTypeId));

        String slug = request.getSlug();
        if (slug == null || slug.isBlank()) {
            slug = generateSlug(request.getName());
        }

        // Ensure unique slug within content type
        String baseSlug = slug;
        int counter = 1;
        while (categoryRepository.existsByContentTypeIdAndSlug(contentTypeId, slug)) {
            slug = baseSlug + "-" + counter++;
        }

        Category parent = null;
        if (request.getParentId() != null) {
            parent = categoryRepository.findByIdAndContentTypeId(request.getParentId(), contentTypeId)
                    .orElseThrow(() -> new ResourceNotFoundException("Parent category not found"));
        }

        Category category = Category.builder()
                .name(request.getName())
                .slug(slug)
                .description(request.getDescription())
                .color(request.getColor())
                .contentType(contentType)
                .parent(parent)
                .entryCount(0)
                .build();

        category = categoryRepository.save(category);
        return CategoryResponse.fromEntity(category);
    }

    @Transactional
    public CategoryResponse updateCategory(Long contentTypeId, Long id, CategoryRequest request) {
        Category category = categoryRepository.findByIdAndContentTypeId(id, contentTypeId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));

        category.setName(request.getName());
        
        if (request.getSlug() != null && !request.getSlug().isBlank()) {
            // Check if slug is unique (excluding current category)
            categoryRepository.findByContentTypeIdAndSlug(contentTypeId, request.getSlug())
                    .ifPresent(existing -> {
                        if (!existing.getId().equals(id)) {
                            throw new IllegalArgumentException("Slug already exists for this content type");
                        }
                    });
            category.setSlug(request.getSlug());
        }

        category.setDescription(request.getDescription());
        category.setColor(request.getColor());

        if (request.getParentId() != null) {
            if (request.getParentId().equals(id)) {
                throw new IllegalArgumentException("Category cannot be its own parent");
            }
            Category parent = categoryRepository.findByIdAndContentTypeId(request.getParentId(), contentTypeId)
                    .orElseThrow(() -> new ResourceNotFoundException("Parent category not found"));
            category.setParent(parent);
        } else {
            category.setParent(null);
        }

        category = categoryRepository.save(category);
        return CategoryResponse.fromEntity(category);
    }

    @Transactional
    public void deleteCategory(Long contentTypeId, Long id) {
        Category category = categoryRepository.findByIdAndContentTypeId(id, contentTypeId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));
        categoryRepository.delete(category);
    }

    public PageResponse<CategoryResponse> searchCategories(Long contentTypeId, String query, Pageable pageable) {
        Page<Category> page = categoryRepository.searchByContentTypeId(contentTypeId, query, pageable);
        return PageResponse.from(page.map(CategoryResponse::fromEntity));
    }

    private String generateSlug(String name) {
        return name.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
    }
}
