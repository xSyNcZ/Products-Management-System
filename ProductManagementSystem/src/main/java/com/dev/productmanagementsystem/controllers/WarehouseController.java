package com.dev.productmanagementsystem.controllers;

import com.dev.productmanagementsystem.dto.WarehouseDTO;
import com.dev.productmanagementsystem.entities.Product;
import com.dev.productmanagementsystem.entities.User;
import com.dev.productmanagementsystem.entities.Warehouse;
import com.dev.productmanagementsystem.services.WarehouseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/warehouses")
public class WarehouseController {

    private final WarehouseService warehouseService;

    @Autowired
    public WarehouseController(WarehouseService warehouseService) {
        this.warehouseService = warehouseService;
    }

    @GetMapping
    public ResponseEntity<List<WarehouseDTO>> getAllWarehouses() {
        List<Warehouse> warehouses = warehouseService.findAll();
        List<WarehouseDTO> warehouseDTOs = warehouses.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(warehouseDTOs);
    }

    @GetMapping("/{id}")
    public ResponseEntity<WarehouseDTO> getWarehouseById(@PathVariable Long id) {
        Optional<Warehouse> warehouseOptional = warehouseService.findById(id);
        return warehouseOptional
                .map(warehouse -> ResponseEntity.ok(convertToDTO(warehouse)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/search")
    public ResponseEntity<List<WarehouseDTO>> searchWarehousesByName(@RequestParam String name) {
        List<Warehouse> warehouses = warehouseService.findByNameContaining(name);
        List<WarehouseDTO> warehouseDTOs = warehouses.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(warehouseDTOs);
    }

    @GetMapping("/city")
    public ResponseEntity<List<WarehouseDTO>> getWarehousesByCity(@RequestParam String city) {
        List<Warehouse> warehouses = warehouseService.findByCity(city);
        List<WarehouseDTO> warehouseDTOs = warehouses.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(warehouseDTOs);
    }

    @GetMapping("/manager/{managerId}")
    public ResponseEntity<List<WarehouseDTO>> getWarehousesByManager(@PathVariable Long managerId) {
        List<Warehouse> warehouses = warehouseService.findByManager(managerId);
        List<WarehouseDTO> warehouseDTOs = warehouses.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(warehouseDTOs);
    }

    @GetMapping("/{id}/workers")
    public ResponseEntity<Set<User>> getWarehouseWorkers(@PathVariable Long id) {
        Set<User> workers = warehouseService.getWarehouseWorkers(id);
        return ResponseEntity.ok(workers);
    }

    @GetMapping("/{id}/product/{productId}/stock")
    public ResponseEntity<Integer> getProductStock(
            @PathVariable Long id,
            @PathVariable Long productId) {
        Integer stock = warehouseService.getProductStock(productId, id);
        return ResponseEntity.ok(stock != null ? stock : 0);
    }

    @GetMapping("/{id}/low-stock")
    public ResponseEntity<List<Product>> getLowStockProducts(
            @PathVariable Long id,
            @RequestParam(defaultValue = "10") Integer threshold) {
        List<Product> products = warehouseService.getLowStockProducts(id, threshold);
        return ResponseEntity.ok(products);
    }

    @PostMapping
    public ResponseEntity<WarehouseDTO> createWarehouse(@RequestBody Warehouse warehouse) {
        Warehouse createdWarehouse = warehouseService.save(warehouse);
        return new ResponseEntity<>(convertToDTO(createdWarehouse), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<WarehouseDTO> updateWarehouse(
            @PathVariable Long id,
            @RequestBody Warehouse warehouse) {
        Optional<Warehouse> existingWarehouse = warehouseService.findById(id);
        if (!existingWarehouse.isPresent()) {
            return ResponseEntity.notFound().build();
        }

        warehouse.setId(id);
        Warehouse updatedWarehouse = warehouseService.save(warehouse);
        return ResponseEntity.ok(convertToDTO(updatedWarehouse));
    }

    @PutMapping("/{id}/manager/{managerId}")
    public ResponseEntity<WarehouseDTO> assignManager(
            @PathVariable Long id,
            @PathVariable Long managerId) {
        Warehouse updatedWarehouse = warehouseService.assignManager(id, managerId);
        return ResponseEntity.ok(convertToDTO(updatedWarehouse));
    }

    @PutMapping("/{id}/workers/add/{workerId}")
    public ResponseEntity<WarehouseDTO> addWorker(
            @PathVariable Long id,
            @PathVariable Long workerId) {
        Warehouse updatedWarehouse = warehouseService.addWorker(id, workerId);
        return ResponseEntity.ok(convertToDTO(updatedWarehouse));
    }

    @PutMapping("/{id}/workers/remove/{workerId}")
    public ResponseEntity<WarehouseDTO> removeWorker(
            @PathVariable Long id,
            @PathVariable Long workerId) {
        Warehouse updatedWarehouse = warehouseService.removeWorker(id, workerId);
        return ResponseEntity.ok(convertToDTO(updatedWarehouse));
    }

    @PutMapping("/{id}/product/{productId}/increase")
    public ResponseEntity<Void> increaseProductStock(
            @PathVariable Long id,
            @PathVariable Long productId,
            @RequestParam Integer quantity) {
        warehouseService.increaseProductStock(productId, id, quantity);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/product/{productId}/reduce")
    public ResponseEntity<Void> reduceProductStock(
            @PathVariable Long id,
            @PathVariable Long productId,
            @RequestParam Integer quantity) {
        warehouseService.reduceProductStock(productId, id, quantity);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteWarehouse(@PathVariable Long id) {
        warehouseService.delete(id);
        return ResponseEntity.noContent().build();
    }

    private WarehouseDTO convertToDTO(Warehouse warehouse) {
        WarehouseDTO dto = new WarehouseDTO();
        dto.setId(warehouse.getId());
        dto.setName(warehouse.getName());
        dto.setLocation(warehouse.getLocation());
        dto.setAddress(warehouse.getAddress());
        dto.setCapacity(warehouse.getCapacity());

        if (warehouse.getManager() != null) {
            dto.setManagerId(warehouse.getManager().getId());
            dto.setManagerName(warehouse.getManager().getFirstName() + " " + warehouse.getManager().getLastName());
        }

        if (warehouse.getWorkers() != null) {
            dto.setWorkerIds(warehouse.getWorkers().stream()
                    .map(User::getId)
                    .collect(Collectors.toSet()));
        }

        return dto;
    }
}