package com.dev.productmanagementsystem.dto;

import java.math.BigDecimal;

public class OrderItemDTO {
    private Long id;
    private Long orderId;
    private Long productId;
    private String productName; // For display purposes
    private Integer quantity;
    private BigDecimal pricePerUnit;
    private Long sourceWarehouseId;
    private String sourceWarehouseName;

    // Constructors
    public OrderItemDTO() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }

    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }

    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public BigDecimal getPricePerUnit() { return pricePerUnit; }
    public void setPricePerUnit(BigDecimal pricePerUnit) { this.pricePerUnit = pricePerUnit; }

    public Long getSourceWarehouseId() { return sourceWarehouseId; }
    public void setSourceWarehouseId(Long sourceWarehouseId) { this.sourceWarehouseId = sourceWarehouseId; }

    public String getSourceWarehouseName() { return sourceWarehouseName; }
    public void setSourceWarehouseName(String sourceWarehouseName) { this.sourceWarehouseName = sourceWarehouseName; }

    // Additional methods
    public BigDecimal getTotalPrice() {
        if (quantity == null || pricePerUnit == null) {
            return BigDecimal.ZERO;
        }
        return pricePerUnit.multiply(new BigDecimal(quantity));
    }
}