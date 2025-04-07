package com.dev.productmanagementsystem.dto;

import java.time.LocalDateTime;

public class InvoiceSummaryDTO {
    private Long id;
    private LocalDateTime invoiceDate;

    public InvoiceSummaryDTO() {}

    public InvoiceSummaryDTO(Long id, LocalDateTime invoiceDate) {
        this.id = id;
        this.invoiceDate = invoiceDate;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public LocalDateTime getInvoiceDate() { return invoiceDate; }
    public void setInvoiceDate(LocalDateTime invoiceDate) { this.invoiceDate = invoiceDate; }
}