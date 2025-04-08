package com.dev.productmanagementsystem.dto;

import java.util.HashSet;
import java.util.Set;

public class CategoryDTO {
    private Long id;
    private String name;
    private String description;
    private Long parentId;
    private Set<Long> subCategoryIds = new HashSet<>();

    // Constructors
    public CategoryDTO() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Long getParentId() { return parentId; }
    public void setParentId(Long parentId) { this.parentId = parentId; }

    public Set<Long> getSubCategoryIds() { return subCategoryIds; }
    public void setSubCategoryIds(Set<Long> subCategoryIds) { this.subCategoryIds = subCategoryIds; }
}