package com.brazucacms.repository;

import com.brazucacms.model.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {

    Optional<Subscription> findByCompanyId(Long companyId);

    Optional<Subscription> findByStripeSubscriptionId(String stripeSubscriptionId);

    Optional<Subscription> findByStripeCustomerId(String stripeCustomerId);

    List<Subscription> findByStatus(Subscription.SubscriptionStatus status);

    @Query("SELECT s FROM Subscription s WHERE s.company.id = :companyId AND s.status IN ('ACTIVE', 'TRIALING')")
    Optional<Subscription> findActiveByCompanyId(@Param("companyId") Long companyId);

    boolean existsByCompanyIdAndStatusIn(Long companyId, List<Subscription.SubscriptionStatus> statuses);
}
