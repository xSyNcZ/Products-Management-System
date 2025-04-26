package com.dev.productmanagementsystem.services;

import com.dev.productmanagementsystem.dto.StockMovementDTO;
import com.dev.productmanagementsystem.entities.Product;
import com.dev.productmanagementsystem.entities.StockMovement;
import com.dev.productmanagementsystem.entities.User;
import com.dev.productmanagementsystem.entities.Warehouse;
import com.dev.productmanagementsystem.enums.MovementStatus;
import com.dev.productmanagementsystem.exceptions.InsufficientStockException;
import com.dev.productmanagementsystem.exceptions.ResourceNotFoundException;
import com.dev.productmanagementsystem.repositories.ProductRepository;
import com.dev.productmanagementsystem.repositories.StockMovementRepository;
import com.dev.productmanagementsystem.repositories.UserRepository;
import com.dev.productmanagementsystem.repositories.WarehouseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class StockMovementService {

    private final StockMovementRepository stockMovementRepository;
    private final ProductRepository productRepository;
    private final WarehouseRepository warehouseRepository;
    private final UserRepository userRepository;

    @Autowired
    public StockMovementService(StockMovementRepository stockMovementRepository,
                                ProductRepository productRepository,
                                WarehouseRepository warehouseRepository,
                                UserRepository userRepository) {
        this.stockMovementRepository = stockMovementRepository;
        this.productRepository = productRepository;
        this.warehouseRepository = warehouseRepository;
        this.userRepository = userRepository;
    }

    public List<StockMovementDTO> getAllStockMovements() {
        return stockMovementRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public StockMovementDTO getStockMovementById(Long id) {
        StockMovement movement = stockMovementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Stock movement not found with id: " + id));
        return convertToDTO(movement);
    }

    public List<StockMovementDTO> getStockMovementsByProduct(Long productId) {
        return stockMovementRepository.findByProductId(productId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<StockMovementDTO> getStockMovementsByWarehouse(Long warehouseId) {
        return stockMovementRepository.findBySourceWarehouseIdOrDestinationWarehouseId(warehouseId, warehouseId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public StockMovementDTO createStockMovement(StockMovementDTO movementDTO) {
        Product product = productRepository.findById(movementDTO.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + movementDTO.getProductId()));

        Warehouse sourceWarehouse = null;
        if (movementDTO.getSourceWarehouseId() != null) {
            sourceWarehouse = warehouseRepository.findById(movementDTO.getSourceWarehouseId())
                    .orElseThrow(() -> new ResourceNotFoundException("Source warehouse not found with id: " + movementDTO.getSourceWarehouseId()));

            // Check if there's enough stock in source warehouse
            Map<Warehouse, Integer> stockQuantities = product.getStockQuantities();
            Integer currentStock = stockQuantities.getOrDefault(sourceWarehouse, 0);
            if (currentStock < movementDTO.getQuantity()) {
                throw new InsufficientStockException("Insufficient stock in source warehouse");
            }
        }

        Warehouse destinationWarehouse = null;
        if (movementDTO.getDestinationWarehouseId() != null) {
            destinationWarehouse = warehouseRepository.findById(movementDTO.getDestinationWarehouseId())
                    .orElseThrow(() -> new ResourceNotFoundException("Destination warehouse not found with id: " + movementDTO.getDestinationWarehouseId()));
        }

        User initiatedBy = userRepository.findById(movementDTO.getInitiatedById())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + movementDTO.getInitiatedById()));

        StockMovement movement = new StockMovement();
        movement.setProduct(product);
        movement.setSourceWarehouse(sourceWarehouse);
        movement.setDestinationWarehouse(destinationWarehouse);
        movement.setQuantity(movementDTO.getQuantity());
        movement.setInitiatedBy(initiatedBy);
        movement.setMovementDate(LocalDateTime.now());
        movement.setStatus(MovementStatus.PENDING);
        movement.setNotes(movementDTO.getNotes());

        StockMovement savedMovement = stockMovementRepository.save(movement);
        return convertToDTO(savedMovement);
    }

    @Transactional
    public StockMovementDTO completeStockMovement(Long id) {
        StockMovement movement = stockMovementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Stock movement not found with id: " + id));

        if (movement.getStatus() != MovementStatus.PENDING) {
            throw new IllegalStateException("Stock movement is not in PENDING state");
        }

        Product product = movement.getProduct();
        Warehouse sourceWarehouse = movement.getSourceWarehouse();
        Warehouse destinationWarehouse = movement.getDestinationWarehouse();
        Integer quantity = movement.getQuantity();

        // Update stock in source warehouse
        if (sourceWarehouse != null) {
            Map<Warehouse, Integer> stockQuantities = product.getStockQuantities();
            Integer currentStock = stockQuantities.getOrDefault(sourceWarehouse, 0);
            if (currentStock < quantity) {
                throw new InsufficientStockException("Insufficient stock in source warehouse");
            }
            product.updateStock(sourceWarehouse, currentStock - quantity);
        }

        // Update stock in destination warehouse
        if (destinationWarehouse != null) {
            Map<Warehouse, Integer> stockQuantities = product.getStockQuantities();
            Integer currentStock = stockQuantities.getOrDefault(destinationWarehouse, 0);
            product.updateStock(destinationWarehouse, currentStock + quantity);
        }

        movement.setStatus(MovementStatus.COMPLETED);
        productRepository.save(product);
        StockMovement updatedMovement = stockMovementRepository.save(movement);
        return convertToDTO(updatedMovement);
    }

    @Transactional
    public StockMovementDTO cancelStockMovement(Long id) {
        StockMovement movement = stockMovementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Stock movement not found with id: " + id));

        if (movement.getStatus() != MovementStatus.PENDING) {
            throw new IllegalStateException("Stock movement is not in PENDING state");
        }

        movement.setStatus(MovementStatus.CANCELLED);
        StockMovement updatedMovement = stockMovementRepository.save(movement);
        return convertToDTO(updatedMovement);
    }

    private StockMovementDTO convertToDTO(StockMovement movement) {
        StockMovementDTO dto = new StockMovementDTO();
        dto.setId(movement.getId());

        if (movement.getProduct() != null) {
            dto.setProductId(movement.getProduct().getId());
            dto.setProductName(movement.getProduct().getName());
        }

        if (movement.getSourceWarehouse() != null) {
            dto.setSourceWarehouseId(movement.getSourceWarehouse().getId());
            dto.setSourceWarehouseName(movement.getSourceWarehouse().getName());
        }

        if (movement.getDestinationWarehouse() != null) {
            dto.setDestinationWarehouseId(movement.getDestinationWarehouse().getId());
            dto.setDestinationWarehouseName(movement.getDestinationWarehouse().getName());
        }

        dto.setQuantity(movement.getQuantity());

        if (movement.getInitiatedBy() != null) {
            dto.setInitiatedById(movement.getInitiatedBy().getId());
            dto.setInitiatedByName(movement.getInitiatedBy().getFirstName() + " " + movement.getInitiatedBy().getLastName());
        }

        dto.setMovementDate(movement.getMovementDate());
        dto.setStatus(movement.getStatus());
        dto.setNotes(movement.getNotes());

        return dto;
    }
}
