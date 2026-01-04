package com.brazucacms.repository;

import com.brazucacms.model.Invoice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    List<Invoice> findByCompanyIdOrderByCreatedAtDesc(Long companyId);

    Page<Invoice> findByCompanyId(Long companyId, Pageable pageable);

    Optional<Invoice> findByStripeInvoiceId(String stripeInvoiceId);

    List<Invoice> findByCompanyIdAndStatus(Long companyId, Invoice.InvoiceStatus status);
}
