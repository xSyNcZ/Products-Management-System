package com.dev.productmanagementsystem.entities;

import com.dev.productmanagementsystem.enums.MovementStatus;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "stock_movements")
public class StockMovement {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "product_id")
    private Product product;

    @ManyToOne
    @JoinColumn(name = "source_warehouse_id")
    private Warehouse sourceWarehouse;

    @ManyToOne
    @JoinColumn(name = "destination_warehouse_id")
    private Warehouse destinationWarehouse;

    @Column(name = "quantity")
    private Integer quantity;

    @ManyToOne
    @JoinColumn(name = "initiated_by_id")
    private User initiatedBy;

    @Column(name = "movement_date")
    private LocalDateTime movementDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private MovementStatus status;

    @Column(name = "notes")
    private String notes;

    // Constructors
    public StockMovement() {}

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

    public Warehouse getSourceWarehouse() {
        return sourceWarehouse;
    }

    public void setSourceWarehouse(Warehouse sourceWarehouse) {
        this.sourceWarehouse = sourceWarehouse;
    }

    public Warehouse getDestinationWarehouse() {
        return destinationWarehouse;
    }

    public void setDestinationWarehouse(Warehouse destinationWarehouse) {
        this.destinationWarehouse = destinationWarehouse;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public User getInitiatedBy() {
        return initiatedBy;
    }

    public void setInitiatedBy(User initiatedBy) {
        this.initiatedBy = initiatedBy;
    }

    public LocalDateTime getMovementDate() {
        return movementDate;
    }

    public void setMovementDate(LocalDateTime movementDate) {
        this.movementDate = movementDate;
    }

    public MovementStatus getStatus() {
        return status;
    }

    public void setStatus(MovementStatus status) {
        this.status = status;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}