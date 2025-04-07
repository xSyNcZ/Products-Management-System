package com.dev.productmanagementsystem.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class InvoiceDTO {
    private Long id;
    private LocalDateTime invoiceDate;
    private BigDecimal totalAmount;
    private OrderSummaryDTO order;
    private PaymentSummaryDTO payment;

    // Constructors
    public InvoiceDTO() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public LocalDateTime getInvoiceDate() { return invoiceDate; }
    public void setInvoiceDate(LocalDateTime invoiceDate) { this.invoiceDate = invoiceDate; }

    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }

    public OrderSummaryDTO getOrder() { return order; }
    public void setOrder(OrderSummaryDTO order) { this.order = order; }

    public PaymentSummaryDTO getPayment() { return payment; }
    public void setPayment(PaymentSummaryDTO payment) { this.payment = payment; }
}


