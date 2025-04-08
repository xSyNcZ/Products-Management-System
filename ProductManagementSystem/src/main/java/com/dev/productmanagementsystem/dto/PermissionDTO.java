package com.dev.productmanagementsystem.dto;

public class PermissionDTO {
    private Long id;
    private String name;
    private String description;

    // Constructors
    public PermissionDTO() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}