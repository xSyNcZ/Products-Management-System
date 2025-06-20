package com.dev.productmanagementsystem.dto;

import java.math.BigDecimal;

public class OrderItemDTO {
    private Long id;
    private Long orderId;
    private Long productId;
    private String productName;
    private Integer quantity;
    private BigDecimal pricePerUnit;
    private Long sourceWarehouseId;
    private String sourceWarehouseName;

    // Default constructor
    public OrderItemDTO() {
    }

    // Constructor with all fields
    public OrderItemDTO(Long id, Long orderId, Long productId, String productName,
                        Integer quantity, BigDecimal pricePerUnit, Long sourceWarehouseId,
                        String sourceWarehouseName) {
        this.id = id;
        this.orderId = orderId;
        this.productId = productId;
        this.productName = productName;
        this.quantity = quantity;
        this.pricePerUnit = pricePerUnit;
        this.sourceWarehouseId = sourceWarehouseId;
        this.sourceWarehouseName = sourceWarehouseName;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public BigDecimal getPricePerUnit() {
        return pricePerUnit;
    }

    public void setPricePerUnit(BigDecimal pricePerUnit) {
        this.pricePerUnit = pricePerUnit;
    }

    public Long getSourceWarehouseId() {
        return sourceWarehouseId;
    }

    public void setSourceWarehouseId(Long sourceWarehouseId) {
        this.sourceWarehouseId = sourceWarehouseId;
    }

    public String getSourceWarehouseName() {
        return sourceWarehouseName;
    }

    public void setSourceWarehouseName(String sourceWarehouseName) {
        this.sourceWarehouseName = sourceWarehouseName;
    }

    @Override
    public String toString() {
        return "OrderItemDTO{" +
                "id=" + id +
                ", orderId=" + orderId +
                ", productId=" + productId +
                ", productName='" + productName + '\'' +
                ", quantity=" + quantity +
                ", pricePerUnit=" + pricePerUnit +
                ", sourceWarehouseId=" + sourceWarehouseId +
                ", sourceWarehouseName='" + sourceWarehouseName + '\'' +
                '}';
    }
}