package com.dev.productmanagementsystem.repository;

import com.dev.productmanagementsystem.entities.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    // Find category by name
    Optional<Category> findByName(String name);

    // Find all categories that are parent categories (parent is null)
    List<Category> findByParentIsNull();

    // Find all subcategories of a parent category
    List<Category> findByParentId(Long parentId);

    // Find categories that contain a certain string in name or description
    List<Category> findByNameContainingOrDescriptionContaining(String name, String description);

    // Check if a category with a given name exists
    boolean existsByName(String name);

    // Count subcategories for a parent category
    @Query("SELECT COUNT(c) FROM Category c WHERE c.parent.id = ?1")
    Long countSubcategoriesByParentId(Long parentId);
}