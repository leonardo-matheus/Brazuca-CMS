package com.brazucacms.repository;

import com.brazucacms.model.Integration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface IntegrationRepository extends JpaRepository<Integration, Long> {

    List<Integration> findByCompanyId(Long companyId);

    List<Integration> findByCompanyIdAndStatus(Long companyId, Integration.IntegrationStatus status);

    Optional<Integration> findByCompanyIdAndPlatform(Long companyId, Integration.Platform platform);

    Optional<Integration> findByIdAndCompanyId(Long id, Long companyId);

    boolean existsByCompanyIdAndPlatform(Long companyId, Integration.Platform platform);

    @Query("SELECT i FROM Integration i WHERE i.status = 'ACTIVE' AND i.platform = :platform")
    List<Integration> findActiveByPlatform(Integration.Platform platform);

    @Query("SELECT i FROM Integration i WHERE i.status = 'ACTIVE' AND i.tokenExpiresAt < CURRENT_TIMESTAMP")
    List<Integration> findExpiredTokens();

    List<Integration> findByCompanyIdAndPlatformIn(Long companyId, List<Integration.Platform> platforms);
    
    @Query("SELECT DISTINCT i.platform FROM Integration i WHERE i.companyId = :companyId AND i.status = 'ACTIVE'")
    List<Integration.Platform> findActivePlatformsByCompanyId(Long companyId);
}
