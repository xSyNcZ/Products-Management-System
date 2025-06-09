package com.dev.productmanagementsystem.services;

import com.dev.productmanagementsystem.entities.Category;
import com.dev.productmanagementsystem.repositories.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;

    @Autowired
    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    public List<Category> findAll() {
        return categoryRepository.findAll();
    }

    public Optional<Category> findById(Long id) {
        return categoryRepository.findById(id);
    }

    public List<Category> findByName(String name) {
        return categoryRepository.findByNameContainingIgnoreCase(name);
    }

    public Category save(Category category) {
        return categoryRepository.save(category);
    }

    public void delete(Long id) {
        categoryRepository.deleteById(id);
    }

    public List<Category> findRootCategories() {
        return categoryRepository.findByParentIsNull();
    }

    public Set<Category> findSubcategories(Long parentId) {
        Category parent = categoryRepository.findById(parentId)
                .orElseThrow(() -> new IllegalArgumentException("Parent category not found"));
        return parent.getSubCategories();
    }

    public Category addSubcategory(Long parentId, Category subCategory) {
        Category parent = categoryRepository.findById(parentId)
                .orElseThrow(() -> new IllegalArgumentException("Parent category not found"));

        parent.addSubCategory(subCategory);
        categoryRepository.save(subCategory);
        return categoryRepository.save(parent);
    }

    public Category removeSubcategory(Long parentId, Long subCategoryId) {
        Category parent = categoryRepository.findById(parentId)
                .orElseThrow(() -> new IllegalArgumentException("Parent category not found"));
        Category subCategory = categoryRepository.findById(subCategoryId)
                .orElseThrow(() -> new IllegalArgumentException("Subcategory not found"));

        parent.removeSubCategory(subCategory);
        return categoryRepository.save(parent);
    }
}
