package com.dev.productmanagementsystem.controllers;

import com.dev.productmanagementsystem.dto.StockMovementDTO;
import com.dev.productmanagementsystem.enums.MovementStatus;
import com.dev.productmanagementsystem.services.StockMovementService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/stock-movements")
@CrossOrigin(origins = "*") // Allow CORS for frontend
public class StockMovementController {

    private final StockMovementService stockMovementService;

    @Autowired
    public StockMovementController(StockMovementService stockMovementService) {
        this.stockMovementService = stockMovementService;
    }

    /**
     * Get all stock movements
     */
    @GetMapping
    public ResponseEntity<List<StockMovementDTO>> getAllStockMovements() {
        try {
            List<StockMovementDTO> movements = stockMovementService.getAllStockMovements();
            return ResponseEntity.ok(movements);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get stock movement by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<StockMovementDTO> getStockMovementById(@PathVariable Long id) {
        try {
            StockMovementDTO movement = stockMovementService.getStockMovementById(id);
            return ResponseEntity.ok(movement);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Get stock movements by product ID
     */
    @GetMapping("/product/{productId}")
    public ResponseEntity<List<StockMovementDTO>> getStockMovementsByProduct(@PathVariable Long productId) {
        try {
            List<StockMovementDTO> movements = stockMovementService.getStockMovementsByProduct(productId);
            return ResponseEntity.ok(movements);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get stock movements by warehouse ID
     */
    @GetMapping("/warehouse/{warehouseId}")
    public ResponseEntity<List<StockMovementDTO>> getStockMovementsByWarehouse(@PathVariable Long warehouseId) {
        try {
            List<StockMovementDTO> movements = stockMovementService.getStockMovementsByWarehouse(warehouseId);
            return ResponseEntity.ok(movements);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get stock movements by status
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<List<StockMovementDTO>> getStockMovementsByStatus(@PathVariable MovementStatus status) {
        try {
            List<StockMovementDTO> movements = stockMovementService.getStockMovementsByStatus(status);
            return ResponseEntity.ok(movements);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get recent stock movements
     */
    @GetMapping("/recent")
    public ResponseEntity<List<StockMovementDTO>> getRecentStockMovements() {
        try {
            List<StockMovementDTO> movements = stockMovementService.getRecentStockMovements();
            return ResponseEntity.ok(movements);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get movement statistics
     */
    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Object>> getMovementStatistics() {
        try {
            Map<String, Object> statistics = stockMovementService.getMovementStatistics();
            return ResponseEntity.ok(statistics);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Create a new stock movement
     */
    @PostMapping
    public ResponseEntity<StockMovementDTO> createStockMovement(@Valid @RequestBody StockMovementDTO movementDTO) {
        try {
            StockMovementDTO createdMovement = stockMovementService.createStockMovement(movementDTO);
            return new ResponseEntity<>(createdMovement, HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Update an existing stock movement
     */
    @PutMapping("/{id}")
    public ResponseEntity<StockMovementDTO> updateStockMovement(@PathVariable Long id, @Valid @RequestBody StockMovementDTO movementDTO) {
        try {
            StockMovementDTO updatedMovement = stockMovementService.updateStockMovement(id, movementDTO);
            return ResponseEntity.ok(updatedMovement);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Complete a stock movement
     */
    @PutMapping("/{id}/complete")
    public ResponseEntity<StockMovementDTO> completeStockMovement(@PathVariable Long id) {
        try {
            StockMovementDTO completedMovement = stockMovementService.completeStockMovement(id);
            return ResponseEntity.ok(completedMovement);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Cancel a stock movement
     */
    @PutMapping("/{id}/cancel")
    public ResponseEntity<StockMovementDTO> cancelStockMovement(@PathVariable Long id) {
        try {
            StockMovementDTO cancelledMovement = stockMovementService.cancelStockMovement(id);
            return ResponseEntity.ok(cancelledMovement);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Delete a stock movement
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteStockMovement(@PathVariable Long id) {
        try {
            stockMovementService.deleteStockMovement(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Get count of movements by status
     */
    @GetMapping("/count/{status}")
    public ResponseEntity<Long> getMovementCountByStatus(@PathVariable MovementStatus status) {
        try {
            Long count = stockMovementService.getMovementCountByStatus(status);
            return ResponseEntity.ok(count);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}