package com.dev.productmanagementsystem.dto;

public class ProductDTO {
    private Long id;
    private String name;
    private String description;
    private Double price;
    private CategorySummaryDTO category;

    // Constructors
    public ProductDTO() {}

    public ProductDTO(Long id, String name, String description, Double price, CategorySummaryDTO category) {
        this.id = id;
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

    public Double getPrice() {
        return price;
    }

    public void setPrice(Double price) {
        this.price = price;
    }

    public CategorySummaryDTO getCategory() {
        return category;
    }

    public void setCategory(CategorySummaryDTO category) {
        this.category = category;
    }
}

