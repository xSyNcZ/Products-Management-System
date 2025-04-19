package com.dev.productmanagementsystem.repositories;

import com.dev.productmanagementsystem.entities.StockMovement;
import com.dev.productmanagementsystem.enums.MovementStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface StockMovementRepository extends JpaRepository<StockMovement, Long> {
    // Find movements by product id
    List<StockMovement> findByProductId(Long productId);

    // Find movements by source warehouse id
    List<StockMovement> findBySourceWarehouseId(Long warehouseId);

    // Find movements by destination warehouse id
    List<StockMovement> findByDestinationWarehouseId(Long warehouseId);

    // Find movements by status
    List<StockMovement> findByStatus(MovementStatus status);

    // Find movements initiated by a specific user
    List<StockMovement> findByInitiatedById(Long userId);

    // Find movements by date range
    List<StockMovement> findByMovementDateBetween(LocalDateTime startDate, LocalDateTime endDate);

    // Find recent movements
    List<StockMovement> findTop10ByOrderByMovementDateDesc();

    // Find movements for both source and destination warehouse
    @Query("SELECT sm FROM StockMovement sm WHERE sm.sourceWarehouse.id = ?1 OR sm.destinationWarehouse.id = ?1")
    List<StockMovement> findByWarehouseId(Long warehouseId);

    // Find movements by product and status
    List<StockMovement> findByProductIdAndStatus(Long productId, MovementStatus status);

    // Count movements by status
    @Query("SELECT COUNT(sm) FROM StockMovement sm WHERE sm.status = ?1")
    Long countByStatus(MovementStatus status);
}