package com.dev.productmanagementsystem.dto;

import java.time.LocalDateTime;

public class PaymentSummaryDTO {
    private Long id;
    private LocalDateTime paymentDate;

    public PaymentSummaryDTO() {}

    public PaymentSummaryDTO(Long id, LocalDateTime paymentDate) {
        this.id = id;
        this.paymentDate = paymentDate;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public LocalDateTime getPaymentDate() { return paymentDate; }
    public void setPaymentDate(LocalDateTime paymentDate) { this.paymentDate = paymentDate; }
}