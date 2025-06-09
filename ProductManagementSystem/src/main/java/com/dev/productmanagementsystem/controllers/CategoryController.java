package com.dev.productmanagementsystem.controllers;

import com.dev.productmanagementsystem.dto.CategoryDTO;
import com.dev.productmanagementsystem.entities.Category;
import com.dev.productmanagementsystem.repositories.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    @Autowired
    private CategoryRepository categoryRepository;

    @GetMapping
    public ResponseEntity<List<CategoryDTO>> getAllCategories() {
        List<Category> categories = categoryRepository.findAll();
        List<CategoryDTO> categoryDTOs = categories.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(categoryDTOs);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CategoryDTO> getCategoryById(@PathVariable Long id) {
        Optional<Category> categoryOptional = categoryRepository.findById(id);
        return categoryOptional.map(category -> ResponseEntity.ok(convertToDTO(category)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/name/{name}")
    public ResponseEntity<CategoryDTO> getCategoryByName(@PathVariable String name) {
        Optional<Category> categoryOptional = categoryRepository.findByName(name);
        return categoryOptional.map(category -> ResponseEntity.ok(convertToDTO(category)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/parent-categories")
    public ResponseEntity<List<CategoryDTO>> getParentCategories() {
        List<Category> parentCategories = categoryRepository.findByParentIsNull();
        List<CategoryDTO> categoryDTOs = parentCategories.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(categoryDTOs);
    }

    @GetMapping("/sub-categories/{parentId}")
    public ResponseEntity<List<CategoryDTO>> getSubCategories(@PathVariable Long parentId) {
        List<Category> subCategories = categoryRepository.findByParentId(parentId);
        List<CategoryDTO> categoryDTOs = subCategories.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(categoryDTOs);
    }

    @GetMapping("/search")
    public ResponseEntity<List<CategoryDTO>> searchCategories(@RequestParam String query) {
        List<Category> categories = categoryRepository.findByNameContainingOrDescriptionContaining(query, query);
        List<CategoryDTO> categoryDTOs = categories.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(categoryDTOs);
    }

    @GetMapping("/count-subcategories/{parentId}")
    public ResponseEntity<Long> countSubcategories(@PathVariable Long parentId) {
        Long count = categoryRepository.countSubcategoriesByParentId(parentId);
        return ResponseEntity.ok(count);
    }

    @PostMapping
    public ResponseEntity<CategoryDTO> createCategory(@RequestBody CategoryDTO categoryDTO) {
        Category category = convertToEntity(categoryDTO);

        // Handle parent category if specified
        if (categoryDTO.getParentId() != null) {
            Optional<Category> parentOptional = categoryRepository.findById(categoryDTO.getParentId());
            parentOptional.ifPresent(category::setParent);
        }

        Category savedCategory = categoryRepository.save(category);
        return new ResponseEntity<>(convertToDTO(savedCategory), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CategoryDTO> updateCategory(@PathVariable Long id, @RequestBody CategoryDTO categoryDTO) {
        if (!categoryRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        Category category = convertToEntity(categoryDTO);
        category.setId(id);

        // Handle parent category if specified
        if (categoryDTO.getParentId() != null) {
            Optional<Category> parentOptional = categoryRepository.findById(categoryDTO.getParentId());
            parentOptional.ifPresent(category::setParent);
        } else {
            category.setParent(null);
        }

        Category updatedCategory = categoryRepository.save(category);
        return ResponseEntity.ok(convertToDTO(updatedCategory));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long id) {
        if (!categoryRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        categoryRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private CategoryDTO convertToDTO(Category category) {
        CategoryDTO dto = new CategoryDTO();
        dto.setId(category.getId());
        dto.setName(category.getName());
        dto.setDescription(category.getDescription());

        if (category.getParent() != null) {
            dto.setParentId(category.getParent().getId());
        }

        if (category.getSubCategories() != null) {
            Set<Long> subCategoryIds = category.getSubCategories().stream()
                    .map(Category::getId)
                    .collect(Collectors.toSet());
            dto.setSubCategoryIds(subCategoryIds);
        }

        return dto;
    }

    private Category convertToEntity(CategoryDTO dto) {
        Category category = new Category();
        category.setId(dto.getId());
        category.setName(dto.getName());
        category.setDescription(dto.getDescription());
        return category;
    }
}