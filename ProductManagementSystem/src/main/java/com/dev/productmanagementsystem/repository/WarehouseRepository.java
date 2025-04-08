package com.dev.productmanagementsystem.repository;

import com.dev.productmanagementsystem.entity.Warehouse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
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
}