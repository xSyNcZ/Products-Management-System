package com.dev.productmanagementsystem.services;

import com.dev.productmanagementsystem.entities.User;
import com.dev.productmanagementsystem.entities.Warehouse;
import com.dev.productmanagementsystem.repositories.UserRepository;
import com.dev.productmanagementsystem.repositories.WarehouseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

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
}
