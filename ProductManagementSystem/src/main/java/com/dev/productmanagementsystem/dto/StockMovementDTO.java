package com.dev.productmanagementsystem.dto;

import com.dev.productmanagementsystem.MovementStatus;
import java.time.LocalDateTime;

public class StockMovementDTO {
    private Long id;
    private ProductSummaryDTO product;
    private WarehouseDTO warehouse;
    private MovementStatus movementStatus;
    private Double quantity;
    private LocalDateTime movementDate;

    // Constructors
    public StockMovementDTO() {}

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public ProductSummaryDTO getProduct() {
        return product;
    }

    public void setProduct(ProductSummaryDTO product) {
        this.product = product;
    }

    public WarehouseDTO getWarehouse() {
        return warehouse;
    }

    public void setWarehouse(WarehouseDTO warehouse) {
        this.warehouse = warehouse;
    }

    public MovementStatus getMovementStatus() {
        return movementStatus;
    }

    public void setMovementStatus(MovementStatus movementStatus) {
        this.movementStatus = movementStatus;
    }

    public Double getQuantity() {
        return quantity;
    }

    public void setQuantity(Double quantity) {
        this.quantity = quantity;
    }

    public LocalDateTime getMovementDate() {
        return movementDate;
    }

    public void setMovementDate(LocalDateTime movementDate) {
        this.movementDate = movementDate;
    }
}