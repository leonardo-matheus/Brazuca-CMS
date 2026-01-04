package com.brazucacms.repository;

import com.brazucacms.model.SocialMediaPost;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface SocialMediaPostRepository extends JpaRepository<SocialMediaPost, Long> {

    Page<SocialMediaPost> findBySocialAccountCompanyIdOrderByCreatedAtDesc(Long companyId, Pageable pageable);

    List<SocialMediaPost> findBySocialAccountId(Long socialAccountId);

    List<SocialMediaPost> findByEntryId(Long entryId);

    Optional<SocialMediaPost> findByPlatformPostId(String platformPostId);

    List<SocialMediaPost> findByStatusAndScheduledAtBefore(SocialMediaPost.PostStatus status, LocalDateTime dateTime);

    @Query("SELECT COUNT(p) FROM SocialMediaPost p WHERE p.socialAccount.company.id = :companyId AND p.status = 'PUBLISHED'")
    Long countPublishedByCompanyId(Long companyId);

    @Query("SELECT COUNT(p) FROM SocialMediaPost p WHERE p.socialAccount.id = :accountId AND p.status = 'PUBLISHED'")
    Long countPublishedByAccountId(Long accountId);
}
