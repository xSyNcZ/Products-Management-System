package com.dev.productmanagementsystem.dto;

import java.util.List;

public class CategoryDTO {
    private Long id;
    private String name;
    private String description;
    private List<ProductSummaryDTO> products;

    // Constructors
    public CategoryDTO() {}

    public CategoryDTO(Long id, String name, String description) {
        this.id = id;
        this.name = name;
        this.description = description;
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

    public List<ProductSummaryDTO> getProducts() {
        return products;
    }

    public void setProducts(List<ProductSummaryDTO> products) {
        this.products = products;
    }
}

