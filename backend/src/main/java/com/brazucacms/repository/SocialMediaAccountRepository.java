package com.brazucacms.repository;

import com.brazucacms.model.SocialMediaAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SocialMediaAccountRepository extends JpaRepository<SocialMediaAccount, Long> {

    List<SocialMediaAccount> findByCompanyId(Long companyId);

    List<SocialMediaAccount> findByCompanyIdAndPlatform(Long companyId, SocialMediaAccount.Platform platform);

    List<SocialMediaAccount> findByCompanyIdAndStatus(Long companyId, SocialMediaAccount.AccountStatus status);

    Optional<SocialMediaAccount> findByCompanyIdAndPlatformAccountId(Long companyId, String platformAccountId);

    Optional<SocialMediaAccount> findByIdAndCompanyId(Long id, Long companyId);

    boolean existsByCompanyIdAndPlatformAccountId(Long companyId, String platformAccountId);

    List<SocialMediaAccount> findByStatus(SocialMediaAccount.AccountStatus status);
}
