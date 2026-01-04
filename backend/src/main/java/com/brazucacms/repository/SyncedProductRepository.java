package com.brazucacms.repository;

import com.brazucacms.model.Integration;
import com.brazucacms.model.SyncedProduct;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SyncedProductRepository extends JpaRepository<SyncedProduct, Long> {

    Page<SyncedProduct> findByCompanyId(Long companyId, Pageable pageable);

    Page<SyncedProduct> findByCompanyIdAndPlatform(Long companyId, Integration.Platform platform, Pageable pageable);

    Optional<SyncedProduct> findByCompanyIdAndPlatformAndExternalId(Long companyId, Integration.Platform platform, String externalId);

    Optional<SyncedProduct> findByIdAndCompanyId(Long id, Long companyId);

    List<SyncedProduct> findByIntegrationId(Long integrationId);

    @Query("SELECT p FROM SyncedProduct p WHERE p.companyId = :companyId AND p.cmsEntry IS NULL")
    List<SyncedProduct> findUnsyncedByCompanyId(Long companyId);

    long countByCompanyId(Long companyId);

    long countByCompanyIdAndPlatform(Long companyId, Integration.Platform platform);

    void deleteByIntegrationId(Long integrationId);
}
