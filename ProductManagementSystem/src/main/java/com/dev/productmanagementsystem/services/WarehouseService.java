package com.dev.productmanagementsystem.services;

import com.dev.productmanagementsystem.entities.Product;
import com.dev.productmanagementsystem.entities.User;
import com.dev.productmanagementsystem.entities.Warehouse;
import com.dev.productmanagementsystem.exceptions.InsufficientStockException;
import com.dev.productmanagementsystem.repositories.UserRepository;
import com.dev.productmanagementsystem.repositories.WarehouseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
public class WarehouseService {

    private final WarehouseRepository warehouseRepository;
    private final UserRepository userRepository;

    @Autowired
    public WarehouseService(WarehouseRepository warehouseRepository, UserRepository userRepository) {
        this.warehouseRepository = warehouseRepository;
        this.userRepository = userRepository;
    }

    public List<Warehouse> findAll() {
        return warehouseRepository.findAll();
    }

    public Optional<Warehouse> findById(Long id) {
        return warehouseRepository.findById(id);
    }

    public Warehouse save(Warehouse warehouse) {
        return warehouseRepository.save(warehouse);
    }

    public void delete(Long id) {
        warehouseRepository.deleteById(id);
    }

    public Warehouse assignManager(Long warehouseId, Long managerId) {
        Warehouse warehouse = warehouseRepository.findById(warehouseId)
                .orElseThrow(() -> new IllegalArgumentException("Warehouse not found"));
        User manager = userRepository.findById(managerId)
                .orElseThrow(() -> new IllegalArgumentException("Manager not found"));

        warehouse.setManager(manager);
        return warehouseRepository.save(warehouse);
    }

    public Warehouse addWorker(Long warehouseId, Long workerId) {
        Warehouse warehouse = warehouseRepository.findById(warehouseId)
                .orElseThrow(() -> new IllegalArgumentException("Warehouse not found"));
        User worker = userRepository.findById(workerId)
                .orElseThrow(() -> new IllegalArgumentException("Worker not found"));

        warehouse.addWorker(worker);
        return warehouseRepository.save(warehouse);
    }

    public Warehouse removeWorker(Long warehouseId, Long workerId) {
        Warehouse warehouse = warehouseRepository.findById(warehouseId)
                .orElseThrow(() -> new IllegalArgumentException("Warehouse not found"));
        User worker = userRepository.findById(workerId)
                .orElseThrow(() -> new IllegalArgumentException("Worker not found"));

        warehouse.removeWorker(worker);
        return warehouseRepository.save(warehouse);
    }

    public List<Warehouse> findByManager(Long managerId) {
        return warehouseRepository.findByManagerId(managerId);
    }

    public Set<User> getWarehouseWorkers(Long warehouseId) {
        Warehouse warehouse = warehouseRepository.findById(warehouseId)
                .orElseThrow(() -> new IllegalArgumentException("Warehouse not found"));
        return warehouse.getWorkers();
    }

    public List<Warehouse> findByNameContaining(String name) {
        return warehouseRepository.findByNameContainingIgnoreCase(name);
    }

    public List<Warehouse> findByCity(String city) {
        return warehouseRepository.findByCityContainingIgnoreCase(city);
    }

    public Integer getProductStock(Long productId, Long warehouseId) {
        return warehouseRepository.findProductStockInWarehouse(productId, warehouseId);
    }

    @Transactional
    public void reduceProductStock(Long productId, Long warehouseId, Integer quantity) {
        Integer currentStock = getProductStock(productId, warehouseId);
        if (currentStock == null || currentStock < quantity) {
            throw new InsufficientStockException("Insufficient stock for product ID: " + productId +
                    " in warehouse ID: " + warehouseId + ". Available: " +
                    (currentStock == null ? 0 : currentStock) + ", Requested: " + quantity);
        }

        warehouseRepository.updateProductStock(productId, warehouseId, currentStock - quantity);
    }

    @Transactional
    public void increaseProductStock(Long productId, Long warehouseId, Integer quantity) {
        Integer currentStock = getProductStock(productId, warehouseId);
        if (currentStock == null) {
            currentStock = 0;
        }

        warehouseRepository.updateProductStock(productId, warehouseId, currentStock + quantity);
    }
    
    public List<Product> getLowStockProducts(Long warehouseId, Integer threshold) {
        return warehouseRepository.findProductsBelowThreshold(warehouseId, threshold);
    }
}
