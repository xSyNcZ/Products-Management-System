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

    /**
     * Get all stock movements
     */
    public List<StockMovementDTO> getAllStockMovements() {
        return stockMovementRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get stock movement by ID
     */
    public StockMovementDTO getStockMovementById(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("Movement ID cannot be null");
        }

        StockMovement movement = stockMovementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Stock movement not found with id: " + id));
        return convertToDTO(movement);
    }

    /**
     * Get stock movements by product ID
     */
    public List<StockMovementDTO> getStockMovementsByProduct(Long productId) {
        if (productId == null) {
            throw new IllegalArgumentException("Product ID cannot be null");
        }

        return stockMovementRepository.findByProductId(productId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get stock movements by warehouse ID (both source and destination)
     */
    public List<StockMovementDTO> getStockMovementsByWarehouse(Long warehouseId) {
        if (warehouseId == null) {
            throw new IllegalArgumentException("Warehouse ID cannot be null");
        }

        return stockMovementRepository.findByWarehouseId(warehouseId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get stock movements by status
     */
    public List<StockMovementDTO> getStockMovementsByStatus(MovementStatus status) {
        if (status == null) {
            throw new IllegalArgumentException("Movement status cannot be null");
        }

        return stockMovementRepository.findByStatus(status).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get recent stock movements (last 10)
     */
    public List<StockMovementDTO> getRecentStockMovements() {
        return stockMovementRepository.findTop10ByOrderByMovementDateDesc().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get count of movements by status
     */
    public Long getMovementCountByStatus(MovementStatus status) {
        if (status == null) {
            throw new IllegalArgumentException("Movement status cannot be null");
        }

        return stockMovementRepository.countByStatus(status);
    }

    /**
     * Create a new stock movement
     */
    @Transactional
    public StockMovementDTO createStockMovement(StockMovementDTO movementDTO) {
        validateStockMovementDTO(movementDTO);

        // Get and validate product
        Product product = productRepository.findById(movementDTO.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + movementDTO.getProductId()));

        // Handle source warehouse
        Warehouse sourceWarehouse = null;
        if (movementDTO.getSourceWarehouseId() != null) {
            sourceWarehouse = warehouseRepository.findById(movementDTO.getSourceWarehouseId())
                    .orElseThrow(() -> new ResourceNotFoundException("Source warehouse not found with id: " + movementDTO.getSourceWarehouseId()));

            // Check if there's enough stock in source warehouse for outbound movements
            if (movementDTO.getQuantity() != null && movementDTO.getQuantity() > 0) {
                validateStockAvailability(product, sourceWarehouse, movementDTO.getQuantity());
            }
        }

        // Handle destination warehouse
        Warehouse destinationWarehouse = null;
        if (movementDTO.getDestinationWarehouseId() != null) {
            destinationWarehouse = warehouseRepository.findById(movementDTO.getDestinationWarehouseId())
                    .orElseThrow(() -> new ResourceNotFoundException("Destination warehouse not found with id: " + movementDTO.getDestinationWarehouseId()));
        }

        // Validate that we have at least one warehouse
        if (sourceWarehouse == null && destinationWarehouse == null) {
            throw new IllegalArgumentException("At least one warehouse (source or destination) must be specified");
        }

        // Handle user - either use provided ID or get a default user
        User initiatedBy = getInitiatingUser(movementDTO.getInitiatedById());

        // Create the stock movement entity
        StockMovement movement = new StockMovement();
        movement.setProduct(product);
        movement.setSourceWarehouse(sourceWarehouse);
        movement.setDestinationWarehouse(destinationWarehouse);
        movement.setQuantity(movementDTO.getQuantity());
        movement.setInitiatedBy(initiatedBy);
        movement.setMovementDate(movementDTO.getMovementDate() != null ? movementDTO.getMovementDate() : LocalDateTime.now());
        movement.setStatus(MovementStatus.PENDING); // Always start as PENDING
        movement.setNotes(movementDTO.getNotes());

        StockMovement savedMovement = stockMovementRepository.save(movement);
        return convertToDTO(savedMovement);
    }

    /**
     * Update an existing stock movement
     */
    @Transactional
    public StockMovementDTO updateStockMovement(Long id, StockMovementDTO movementDTO) {
        if (id == null) {
            throw new IllegalArgumentException("Movement ID cannot be null");
        }

        StockMovement existingMovement = stockMovementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Stock movement not found with id: " + id));

        // Only allow updates if movement is still PENDING
        if (existingMovement.getStatus() != MovementStatus.PENDING) {
            throw new IllegalStateException("Cannot update stock movement that is not in PENDING state");
        }

        // Update fields if provided
        if (movementDTO.getQuantity() != null) {
            // Validate stock availability if changing quantity
            if (existingMovement.getSourceWarehouse() != null && movementDTO.getQuantity() > 0) {
                validateStockAvailability(existingMovement.getProduct(), existingMovement.getSourceWarehouse(), movementDTO.getQuantity());
            }
            existingMovement.setQuantity(movementDTO.getQuantity());
        }

        if (movementDTO.getNotes() != null) {
            existingMovement.setNotes(movementDTO.getNotes());
        }

        if (movementDTO.getMovementDate() != null) {
            existingMovement.setMovementDate(movementDTO.getMovementDate());
        }

        StockMovement updatedMovement = stockMovementRepository.save(existingMovement);
        return convertToDTO(updatedMovement);
    }

    /**
     * Complete a stock movement - this actually moves the stock
     */
    @Transactional
    public StockMovementDTO completeStockMovement(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("Movement ID cannot be null");
        }

        StockMovement movement = stockMovementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Stock movement not found with id: " + id));

        if (movement.getStatus() != MovementStatus.PENDING) {
            throw new IllegalStateException("Stock movement is not in PENDING state. Current status: " + movement.getStatus());
        }

        Product product = movement.getProduct();
        Warehouse sourceWarehouse = movement.getSourceWarehouse();
        Warehouse destinationWarehouse = movement.getDestinationWarehouse();
        Integer quantity = movement.getQuantity();

        if (quantity == null || quantity == 0) {
            throw new IllegalArgumentException("Cannot complete movement with null or zero quantity");
        }

        // Update stock in source warehouse (decrease stock)
        if (sourceWarehouse != null) {
            Map<Warehouse, Integer> stockQuantities = product.getStockQuantities();
            Integer currentStock = stockQuantities.getOrDefault(sourceWarehouse, 0);

            if (currentStock < quantity) {
                throw new InsufficientStockException(
                        String.format("Insufficient stock in source warehouse '%s'. Available: %d, Required: %d",
                                sourceWarehouse.getName(), currentStock, quantity));
            }

            product.updateStock(sourceWarehouse, currentStock - quantity);
        }

        // Update stock in destination warehouse (increase stock)
        if (destinationWarehouse != null) {
            Map<Warehouse, Integer> stockQuantities = product.getStockQuantities();
            Integer currentStock = stockQuantities.getOrDefault(destinationWarehouse, 0);
            product.updateStock(destinationWarehouse, currentStock + quantity);
        }

        // Update movement status
        movement.setStatus(MovementStatus.COMPLETED);

        // Save both product and movement
        productRepository.save(product);
        StockMovement updatedMovement = stockMovementRepository.save(movement);

        return convertToDTO(updatedMovement);
    }

    /**
     * Cancel a stock movement
     */
    @Transactional
    public StockMovementDTO cancelStockMovement(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("Movement ID cannot be null");
        }

        StockMovement movement = stockMovementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Stock movement not found with id: " + id));

        if (movement.getStatus() != MovementStatus.PENDING) {
            throw new IllegalStateException("Can only cancel movements in PENDING state. Current status: " + movement.getStatus());
        }

        movement.setStatus(MovementStatus.CANCELLED);
        StockMovement updatedMovement = stockMovementRepository.save(movement);
        return convertToDTO(updatedMovement);
    }

    /**
     * Delete a stock movement (only if PENDING or CANCELLED)
     */
    @Transactional
    public void deleteStockMovement(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("Movement ID cannot be null");
        }

        StockMovement movement = stockMovementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Stock movement not found with id: " + id));

        if (movement.getStatus() == MovementStatus.COMPLETED) {
            throw new IllegalStateException("Cannot delete completed stock movements");
        }

        stockMovementRepository.delete(movement);
    }

    /**
     * Validate stock movement DTO
     */
    private void validateStockMovementDTO(StockMovementDTO movementDTO) {
        if (movementDTO == null) {
            throw new IllegalArgumentException("Stock movement data cannot be null");
        }

        if (movementDTO.getProductId() == null) {
            throw new IllegalArgumentException("Product ID is required");
        }

        if (movementDTO.getQuantity() == null) {
            throw new IllegalArgumentException("Quantity is required");
        }

        if (movementDTO.getQuantity() <= 0) {
            throw new IllegalArgumentException("Quantity must be greater than zero");
        }

        // Validate that at least one warehouse is specified
        if (movementDTO.getSourceWarehouseId() == null && movementDTO.getDestinationWarehouseId() == null) {
            throw new IllegalArgumentException("At least one warehouse (source or destination) must be specified");
        }
    }

    /**
     * Validate stock availability in warehouse
     */
    private void validateStockAvailability(Product product, Warehouse warehouse, Integer requiredQuantity) {
        Map<Warehouse, Integer> stockQuantities = product.getStockQuantities();
        Integer currentStock = stockQuantities.getOrDefault(warehouse, 0);

        if (currentStock < requiredQuantity) {
            throw new InsufficientStockException(
                    String.format("Insufficient stock in warehouse '%s'. Available: %d, Required: %d",
                            warehouse.getName(), currentStock, requiredQuantity));
        }
    }

    /**
     * Get initiating user - either provided or default
     */
    private User getInitiatingUser(Long initiatedById) {
        if (initiatedById != null) {
            return userRepository.findById(initiatedById)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + initiatedById));
        } else {
            // Get default user (you might want to implement proper authentication instead)
            return userRepository.findAll().stream()
                    .findFirst()
                    .orElseThrow(() -> new ResourceNotFoundException("No users found in the system. Please create at least one user."));
        }
    }

    /**
     * Convert StockMovement entity to DTO
     */
    private StockMovementDTO convertToDTO(StockMovement movement) {
        if (movement == null) {
            return null;
        }

        StockMovementDTO dto = new StockMovementDTO();
        dto.setId(movement.getId());

        // Product information
        if (movement.getProduct() != null) {
            dto.setProductId(movement.getProduct().getId());
            dto.setProductName(movement.getProduct().getName());
        }

        // Source warehouse information
        if (movement.getSourceWarehouse() != null) {
            dto.setSourceWarehouseId(movement.getSourceWarehouse().getId());
            dto.setSourceWarehouseName(movement.getSourceWarehouse().getName());
        }

        // Destination warehouse information
        if (movement.getDestinationWarehouse() != null) {
            dto.setDestinationWarehouseId(movement.getDestinationWarehouse().getId());
            dto.setDestinationWarehouseName(movement.getDestinationWarehouse().getName());
        }

        dto.setQuantity(movement.getQuantity());

        // Initiating user information
        if (movement.getInitiatedBy() != null) {
            dto.setInitiatedById(movement.getInitiatedBy().getId());
            dto.setInitiatedByName(movement.getInitiatedBy().getFirstName() + " " + movement.getInitiatedBy().getLastName());
        }

        dto.setMovementDate(movement.getMovementDate());
        dto.setStatus(movement.getStatus());
        dto.setNotes(movement.getNotes());

        return dto;
    }

    /**
     * Convert DTO to StockMovement entity (for updates)
     */
    private StockMovement convertToEntity(StockMovementDTO dto) {
        if (dto == null) {
            return null;
        }

        StockMovement movement = new StockMovement();
        movement.setId(dto.getId());
        movement.setQuantity(dto.getQuantity());
        movement.setMovementDate(dto.getMovementDate());
        movement.setStatus(dto.getStatus());
        movement.setNotes(dto.getNotes());

        // Note: Product, warehouses, and user should be set separately using their repositories

        return movement;
    }

    /**
     * Get movement statistics
     */
    public Map<String, Object> getMovementStatistics() {
        long totalMovements = stockMovementRepository.count();
        long pendingMovements = stockMovementRepository.countByStatus(MovementStatus.PENDING);
        long completedMovements = stockMovementRepository.countByStatus(MovementStatus.COMPLETED);
        long cancelledMovements = stockMovementRepository.countByStatus(MovementStatus.CANCELLED);

        return Map.of(
                "totalMovements", totalMovements,
                "pendingMovements", pendingMovements,
                "completedMovements", completedMovements,
                "cancelledMovements", cancelledMovements
        );
    }
}