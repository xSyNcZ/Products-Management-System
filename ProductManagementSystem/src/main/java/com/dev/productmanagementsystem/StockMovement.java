package com.dev.productmanagementsystem;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "stock_movement")
public class StockMovement {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "product_id")
    private Product product;

    @ManyToOne
    @JoinColumn(name = "warehouse_id")
    private Warehouse warehouse;

    @Enumerated(EnumType.STRING)
    @Column(name = "movement_status")
    private MovementStatus movementStatus;

    @Column(name = "quantity")
    private Double quantity;

    @Column(name = "movement_date")
    private LocalDateTime movementDate;

    // Constructors
    public StockMovement() {}

    public StockMovement(Product product, Warehouse warehouse, MovementStatus movementStatus,
                         Double quantity, LocalDateTime movementDate) {
        this.product = product;
        this.warehouse = warehouse;
        this.movementStatus = movementStatus;
        this.quantity = quantity;
        this.movementDate = movementDate;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Product getProduct() {
        return product;
    }

    public void setProduct(Product product) {
        this.product = product;
    }

    public Warehouse getWarehouse() {
        return warehouse;
    }

    public void setWarehouse(Warehouse warehouse) {
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
