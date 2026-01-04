package com.brazucacms.dto.subscription;

import com.brazucacms.model.Invoice;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceResponse {

    private Long id;
    private String invoiceNumber;
    private String status;
    private BigDecimal subtotal;
    private BigDecimal tax;
    private BigDecimal total;
    private String currency;
    private LocalDateTime periodStart;
    private LocalDateTime periodEnd;
    private LocalDateTime dueDate;
    private LocalDateTime paidAt;
    private String invoicePdf;
    private String hostedInvoiceUrl;
    private LocalDateTime createdAt;

    public static InvoiceResponse fromEntity(Invoice invoice) {
        return InvoiceResponse.builder()
                .id(invoice.getId())
                .invoiceNumber(invoice.getInvoiceNumber())
                .status(invoice.getStatus().name())
                .subtotal(invoice.getSubtotal())
                .tax(invoice.getTax())
                .total(invoice.getTotal())
                .currency(invoice.getCurrency())
                .periodStart(invoice.getPeriodStart())
                .periodEnd(invoice.getPeriodEnd())
                .dueDate(invoice.getDueDate())
                .paidAt(invoice.getPaidAt())
                .invoicePdf(invoice.getInvoicePdf())
                .hostedInvoiceUrl(invoice.getHostedInvoiceUrl())
                .createdAt(invoice.getCreatedAt())
                .build();
    }
}
