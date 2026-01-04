package com.brazucacms.repository;

import com.brazucacms.model.Category;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {

    List<Category> findByContentTypeId(Long contentTypeId);

    Page<Category> findByContentTypeId(Long contentTypeId, Pageable pageable);

    Optional<Category> findByContentTypeIdAndSlug(Long contentTypeId, String slug);

    Optional<Category> findByIdAndContentTypeId(Long id, Long contentTypeId);

    List<Category> findByContentTypeIdAndParentIsNull(Long contentTypeId);

    @Query("SELECT c FROM Category c WHERE c.contentType.id = :contentTypeId AND " +
           "(LOWER(c.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(c.slug) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<Category> searchByContentTypeId(@Param("contentTypeId") Long contentTypeId, 
                                          @Param("query") String query, 
                                          Pageable pageable);

    boolean existsByContentTypeIdAndSlug(Long contentTypeId, String slug);

    void deleteByContentTypeId(Long contentTypeId);
}
