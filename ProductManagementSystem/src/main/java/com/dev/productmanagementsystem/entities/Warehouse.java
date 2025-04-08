package com.dev.productmanagementsystem.entities;

import javax.persistence.*;
import java.util.Set;

@Entity
@Table(name = "warehouses")
public class Warehouse {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name")
    private String name;

    @Column(name = "location")
    private String location;

    @Column(name = "address")
    private String address;

    @Column(name = "capacity")
    private Double capacity;

    @ManyToOne
    @JoinColumn(name = "manager_id")
    private User manager;

    @OneToMany(mappedBy = "warehouse")
    private Set<User> workers;

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

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public Double getCapacity() {
        return capacity;
    }

    public void setCapacity(Double capacity) {
        this.capacity = capacity;
    }

    public User getManager() {
        return manager;
    }

    public void setManager(User manager) {
        this.manager = manager;
    }

    public Set<User> getWorkers() {
        return workers;
    }

    public void setWorkers(Set<User> workers) {
        this.workers = workers;
    }

    public void addWorker(User worker) {
        this.workers.add(worker);
    }

    public void removeWorker(User worker) {
        this.workers.remove(worker);
    }

    public Set<StockMovement> getStockMovements() {
        return stockMovements;
    }

    public void setStockMovements(Set<StockMovement> stockMovements) {
        this.stockMovements = stockMovements;
    }
}