package com.dev.productmanagementsystem.repositories;

import com.dev.productmanagementsystem.entities.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    // Find product by name
    List<Product> findByName(String name);

    // Find product by SKU
    Optional<Product> findBySku(String sku);

    // Find products by category id
    List<Product> findByCategoryId(Long categoryId);

    // Find products with price less than
    List<Product> findByPriceLessThan(BigDecimal price);

    // Find products with price greater than
    List<Product> findByPriceGreaterThan(BigDecimal price);

    // Find products with price between
    List<Product> findByPriceBetween(BigDecimal minPrice, BigDecimal maxPrice);

    // Find products with name containing
    List<Product> findByNameContaining(String name);

    // Find products by name containing a string (case insensitive)
    List<Product> findByNameContainingIgnoreCase(String name);


    // Find products in stock at a specific warehouse
    @Query("SELECT p FROM Product p JOIN p.stockQuantities sq WHERE KEY(sq) = ?1 AND VALUE(sq) > 0")
    List<Product> findInStockAtWarehouse(Long warehouseId);

    // Find out of stock products
    @Query("SELECT p FROM Product p WHERE (SELECT SUM(VALUE(sq)) FROM p.stockQuantities sq) = 0")
    List<Product> findOutOfStockProducts();

    // Find products with stock below threshold
    @Query("SELECT p FROM Product p WHERE (SELECT SUM(VALUE(sq)) FROM p.stockQuantities sq) < ?1")
    List<Product> findProductsWithStockBelow(Integer threshold);

    // Count products by category
    @Query("SELECT COUNT(p) FROM Product p WHERE p.category.id = ?1")
    Long countByCategoryId(Long categoryId);
}