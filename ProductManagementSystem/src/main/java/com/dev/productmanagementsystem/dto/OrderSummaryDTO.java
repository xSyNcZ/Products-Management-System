package com.dev.productmanagementsystem.dto;

import java.time.LocalDateTime;

public class OrderSummaryDTO {
    private Long id;
    private LocalDateTime orderDate;

    public OrderSummaryDTO() {}

    public OrderSummaryDTO(Long id, LocalDateTime orderDate) {
        this.id = id;
        this.orderDate = orderDate;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public LocalDateTime getOrderDate() { return orderDate; }
    public void setOrderDate(LocalDateTime orderDate) { this.orderDate = orderDate; }
}
