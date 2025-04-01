package com.dev.productmanagementsystem;

import javax.persistence.*;
import java.util.Set;

@Entity
@Table(name = "warehouse")
public class Warehouse {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name")
    private String name;

    @Column(name = "location")
    private String location;

    @OneToMany(mappedBy = "warehouse")
    private Set<StockMovement> stockMovements;

    // Constructors
    public Warehouse() {}

    public Warehouse(String name, String location) {
        this.name = name;
        this.location = location;
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

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public Set<StockMovement> getStockMovements() {
        return stockMovements;
    }

    public void setStockMovements(Set<StockMovement> stockMovements) {
        this.stockMovements = stockMovements;
    }
}
