package com.dev.productmanagementsystem.entity;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

@Entity
@Table(name = "products")
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name")
    private String name;

    @Column(name = "description")
    private String description;

    @Column(name = "sku", unique = true)
    private String sku; //Stock Keeping Unit

    @Column(name = "price", precision = 10, scale = 2)
    private BigDecimal price;

    @ManyToOne
    @JoinColumn(name = "category_id")
    private Category category;

    @ElementCollection
    @CollectionTable(name = "product_stock",
            joinColumns = @JoinColumn(name = "product_id"))
    @MapKeyJoinColumn(name = "warehouse_id")
    @Column(name = "quantity")
    private Map<Warehouse, Integer> stockQuantities = new HashMap<>();

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "product")
    private Set<StockMovement> stockMovements;

    // Constructors
    public Product() {}

    public Product(String name, String description, BigDecimal price, Category category) {
        this.name = name;
        this.description = description;
        this.price = price;
        this.category = category;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getSku() {
        return sku;
    }

    public void setSku(String sku) {
        this.sku = sku;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public Category getCategory() {
        return category;
    }

    public void setCategory(Category category) {
        this.category = category;
    }

    public Map<Warehouse, Integer> getStockQuantities() {
        return stockQuantities;
    }

    public void setStockQuantities(Map<Warehouse, Integer> stockQuantities) {
        this.stockQuantities = stockQuantities;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public Set<StockMovement> getStockMovements() {
        return stockMovements;
    }

    public void setStockMovements(Set<StockMovement> stockMovements) {
        this.stockMovements = stockMovements;
    }

    // Additional methods
    public void updateStock(Warehouse warehouse, Integer quantity) {
        stockQuantities.put(warehouse, quantity);
        this.updatedAt = LocalDateTime.now();
    }

    public Integer getTotalStock() {
        return stockQuantities.values().stream().mapToInt(Integer::intValue).sum();
    }

    // Auditing methods
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}