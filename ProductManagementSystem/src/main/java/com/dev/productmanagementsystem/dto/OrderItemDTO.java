package com.dev.productmanagementsystem.dto;

import java.math.BigDecimal;

public class OrderItemDTO {
    private Long id;
    private Integer quantity;
    private BigDecimal unitPrice;
    private ProductSummaryDTO product;

    // Constructors
    public OrderItemDTO() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public BigDecimal getUnitPrice() { return unitPrice; }
    public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }

    public ProductSummaryDTO getProduct() { return product; }
    public void setProduct(ProductSummaryDTO product) { this.product = product; }
}