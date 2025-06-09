package com.dev.productmanagementsystem.controllers;

import com.dev.productmanagementsystem.dto.StockMovementDTO;
import com.dev.productmanagementsystem.services.StockMovementService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stock-movements")
public class StockMovementController {

    private final StockMovementService stockMovementService;

    @Autowired
    public StockMovementController(StockMovementService stockMovementService) {
        this.stockMovementService = stockMovementService;
    }

    @GetMapping
    public ResponseEntity<List<StockMovementDTO>> getAllStockMovements() {
        List<StockMovementDTO> movements = stockMovementService.getAllStockMovements();
        return ResponseEntity.ok(movements);
    }

    @GetMapping("/{id}")
    public ResponseEntity<StockMovementDTO> getStockMovementById(@PathVariable Long id) {
        StockMovementDTO movement = stockMovementService.getStockMovementById(id);
        return ResponseEntity.ok(movement);
    }

    @GetMapping("/product/{productId}")
    public ResponseEntity<List<StockMovementDTO>> getStockMovementsByProduct(@PathVariable Long productId) {
        List<StockMovementDTO> movements = stockMovementService.getStockMovementsByProduct(productId);
        return ResponseEntity.ok(movements);
    }

    @GetMapping("/warehouse/{warehouseId}")
    public ResponseEntity<List<StockMovementDTO>> getStockMovementsByWarehouse(@PathVariable Long warehouseId) {
        List<StockMovementDTO> movements = stockMovementService.getStockMovementsByWarehouse(warehouseId);
        return ResponseEntity.ok(movements);
    }

    @PostMapping
    public ResponseEntity<StockMovementDTO> createStockMovement(@RequestBody StockMovementDTO movementDTO) {
        StockMovementDTO createdMovement = stockMovementService.createStockMovement(movementDTO);
        return new ResponseEntity<>(createdMovement, HttpStatus.CREATED);
    }

    @PutMapping("/{id}/complete")
    public ResponseEntity<StockMovementDTO> completeStockMovement(@PathVariable Long id) {
        StockMovementDTO completedMovement = stockMovementService.completeStockMovement(id);
        return ResponseEntity.ok(completedMovement);
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<StockMovementDTO> cancelStockMovement(@PathVariable Long id) {
        StockMovementDTO cancelledMovement = stockMovementService.cancelStockMovement(id);
        return ResponseEntity.ok(cancelledMovement);
    }
}