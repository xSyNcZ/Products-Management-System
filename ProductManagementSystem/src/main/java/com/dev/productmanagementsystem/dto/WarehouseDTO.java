package com.dev.productmanagementsystem.dto;

import java.util.Set;

public class WarehouseDTO {
    private Long id;
    private String name;
    private String location;
    private String address;
    private Double capacity;
    private Long managerId;
    private String managerName; // For display purposes
    private Set<Long> workerIds;

    // Constructors
    public WarehouseDTO() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public Double getCapacity() { return capacity; }
    public void setCapacity(Double capacity) { this.capacity = capacity; }

    public Long getManagerId() { return managerId; }
    public void setManagerId(Long managerId) { this.managerId = managerId; }

    public String getManagerName() { return managerName; }
    public void setManagerName(String managerName) { this.managerName = managerName; }

    public Set<Long> getWorkerIds() { return workerIds; }
    public void setWorkerIds(Set<Long> workerIds) { this.workerIds = workerIds; }
}