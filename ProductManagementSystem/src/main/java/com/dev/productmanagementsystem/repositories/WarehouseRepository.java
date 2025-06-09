package com.dev.productmanagementsystem.repositories;

import com.dev.productmanagementsystem.entities.Product;
import com.dev.productmanagementsystem.entities.Warehouse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WarehouseRepository extends JpaRepository<Warehouse, Long> {
    // Find warehouse by name
    Optional<Warehouse> findByName(String name);

    // Find warehouses by location
    List<Warehouse> findByLocation(String location);

    // Find warehouses by manager id
    List<Warehouse> findByManagerId(Long managerId);

    // Find warehouses with capacity greater than
    List<Warehouse> findByCapacityGreaterThan(Double capacity);

    // Find warehouses with name containing
    List<Warehouse> findByNameContaining(String name);

    // Find warehouses with a specific worker
    @Query("SELECT w FROM Warehouse w JOIN w.workers u WHERE u.id = ?1")
    List<Warehouse> findByWorkerId(Long userId);

    // Find warehouses that have a specific product in stock
    @Query("SELECT DISTINCT KEY(sq) FROM Product p JOIN p.stockQuantities sq WHERE p.id = ?1 AND VALUE(sq) > 0")
    List<Warehouse> findWarehousesWithProductInStock(Long productId);

    // Count workers in a warehouse
    @Query("SELECT COUNT(u) FROM Warehouse w JOIN w.workers u WHERE w.id = ?1")
    Long countWorkersByWarehouseId(Long warehouseId);

    // Check if warehouse name exists
    boolean existsByName(String name);

    // Find warehouses by name (case insensitive)
    List<Warehouse> findWarehouseByNameContainingIgnoreCase(String name);

    // New methods to match service calls:

    // Find warehouses by city (case insensitive)
    @Query("SELECT w FROM Warehouse w WHERE LOWER(w.location) LIKE LOWER(CONCAT('%', :city, '%'))")
    List<Warehouse> findByCityContainingIgnoreCaseWarehouse(@Param("city") String city);

    // Find product stock in a specific warehouse
    @Query("SELECT COALESCE(VALUE(sq), 0) FROM Product p JOIN p.stockQuantities sq WHERE p.id = :productId AND KEY(sq).id = :warehouseId")
    Integer findProductStockInWarehouse(@Param("productId") Long productId, @Param("warehouseId") Long warehouseId);

    // Update product stock in a warehouse
    @Modifying
    @Query(value = "UPDATE product_stock SET quantity = :newQuantity " +
            "WHERE product_id = :productId AND warehouse_id = :warehouseId", nativeQuery = true)
    void updateProductStock(@Param("productId") Long productId, @Param("warehouseId") Long warehouseId, @Param("newQuantity") Integer newQuantity);

    // Find products below threshold in a specific warehouse
    @Query("SELECT p FROM Product p JOIN p.stockQuantities sq " +
            "WHERE KEY(sq).id = :warehouseId AND VALUE(sq) < :threshold")
    List<Product> findProductsBelowThreshold(@Param("warehouseId") Long warehouseId, @Param("threshold") Integer threshold);
}