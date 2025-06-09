package com.dev.productmanagementsystem.controllers;

import com.dev.productmanagementsystem.dto.OrderItemDTO;
import com.dev.productmanagementsystem.entities.OrderItem;
import com.dev.productmanagementsystem.entities.Product;
import com.dev.productmanagementsystem.entities.Warehouse;
import com.dev.productmanagementsystem.entities.Order;
import com.dev.productmanagementsystem.repositories.OrderItemRepository;
import com.dev.productmanagementsystem.repositories.ProductRepository;
import com.dev.productmanagementsystem.repositories.WarehouseRepository;
import com.dev.productmanagementsystem.repositories.OrderRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/order-items")
public class OrderItemController {

    private final OrderItemRepository orderItemRepository;
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final WarehouseRepository warehouseRepository;

    @Autowired
    public OrderItemController(
            OrderItemRepository orderItemRepository,
            OrderRepository orderRepository,
            ProductRepository productRepository,
            WarehouseRepository warehouseRepository) {
        this.orderItemRepository = orderItemRepository;
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.warehouseRepository = warehouseRepository;
    }

    @GetMapping
    public List<OrderItemDTO> getAllOrderItems() {
        return orderItemRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderItemDTO> getOrderItemById(@PathVariable Long id) {
        return orderItemRepository.findById(id)
                .map(this::convertToDTO)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order item not found"));
    }

    @GetMapping("/order/{orderId}")
    public List<OrderItemDTO> getOrderItemsByOrderId(@PathVariable Long orderId) {
        return orderItemRepository.findByOrderId(orderId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @GetMapping("/product/{productId}")
    public List<OrderItemDTO> getOrderItemsByProductId(@PathVariable Long productId) {
        return orderItemRepository.findByProductId(productId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @GetMapping("/warehouse/{warehouseId}")
    public List<OrderItemDTO> getOrderItemsByWarehouseId(@PathVariable Long warehouseId) {
        return orderItemRepository.findBySourceWarehouseId(warehouseId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @GetMapping("/quantity/greater-than/{quantity}")
    public List<OrderItemDTO> getOrderItemsWithQuantityGreaterThan(@PathVariable Integer quantity) {
        return orderItemRepository.findByQuantityGreaterThan(quantity).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @GetMapping("/most-ordered")
    public List<Object[]> getMostOrderedProducts() {
        return orderItemRepository.findMostOrderedProducts();
    }

    @PostMapping
    public ResponseEntity<OrderItemDTO> createOrderItem(@RequestBody OrderItemDTO orderItemDTO) {
        OrderItem orderItem = convertToEntity(orderItemDTO);
        OrderItem savedOrderItem = orderItemRepository.save(orderItem);
        return new ResponseEntity<>(convertToDTO(savedOrderItem), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<OrderItemDTO> updateOrderItem(@PathVariable Long id, @RequestBody OrderItemDTO orderItemDTO) {
        return orderItemRepository.findById(id)
                .map(existingOrderItem -> {
                    // Update the existing order item with values from DTO
                    if (orderItemDTO.getOrderId() != null) {
                        Order order = orderRepository.findById(orderItemDTO.getOrderId())
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Order not found"));
                        existingOrderItem.setOrder(order);
                    }

                    if (orderItemDTO.getProductId() != null) {
                        Product product = productRepository.findById(orderItemDTO.getProductId())
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Product not found"));
                        existingOrderItem.setProduct(product);
                    }

                    if (orderItemDTO.getQuantity() != null) {
                        existingOrderItem.setQuantity(orderItemDTO.getQuantity());
                    }

                    if (orderItemDTO.getPricePerUnit() != null) {
                        existingOrderItem.setPricePerUnit(orderItemDTO.getPricePerUnit());
                    }

                    if (orderItemDTO.getSourceWarehouseId() != null) {
                        Warehouse warehouse = warehouseRepository.findById(orderItemDTO.getSourceWarehouseId())
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Warehouse not found"));
                        existingOrderItem.setSourceWarehouse(warehouse);
                    }

                    OrderItem updatedOrderItem = orderItemRepository.save(existingOrderItem);
                    return ResponseEntity.ok(convertToDTO(updatedOrderItem));
                })
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order item not found"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteOrderItem(@PathVariable Long id) {
        return orderItemRepository.findById(id)
                .map(orderItem -> {
                    orderItemRepository.delete(orderItem);
                    return new ResponseEntity<Void>(HttpStatus.NO_CONTENT);
                })
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order item not found"));
    }

    @GetMapping("/product/{productId}/total-quantity")
    public ResponseEntity<Integer> getTotalQuantityByProductId(@PathVariable Long productId) {
        Integer totalQuantity = orderItemRepository.sumQuantityByProductId(productId);
        return ResponseEntity.ok(totalQuantity != null ? totalQuantity : 0);
    }

    @GetMapping("/product/{productId}/order-count")
    public ResponseEntity<Long> getOrderCountByProductId(@PathVariable Long productId) {
        Long orderCount = orderItemRepository.countByProductId(productId);
        return ResponseEntity.ok(orderCount);
    }

    // Helper methods
    private OrderItemDTO convertToDTO(OrderItem orderItem) {
        OrderItemDTO dto = new OrderItemDTO();
        dto.setId(orderItem.getId());
        dto.setOrderId(orderItem.getOrder().getId());
        dto.setProductId(orderItem.getProduct().getId());
        dto.setProductName(orderItem.getProduct().getName());
        dto.setQuantity(orderItem.getQuantity());
        dto.setPricePerUnit(orderItem.getPricePerUnit());
        if (orderItem.getSourceWarehouse() != null) {
            dto.setSourceWarehouseId(orderItem.getSourceWarehouse().getId());
            dto.setSourceWarehouseName(orderItem.getSourceWarehouse().getName());
        }
        return dto;
    }

    private OrderItem convertToEntity(OrderItemDTO dto) {
        OrderItem entity = new OrderItem();

        if (dto.getId() != null) {
            entity.setId(dto.getId());
        }

        if (dto.getOrderId() != null) {
            Order order = orderRepository.findById(dto.getOrderId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Order not found"));
            entity.setOrder(order);
        }

        if (dto.getProductId() != null) {
            Product product = productRepository.findById(dto.getProductId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Product not found"));
            entity.setProduct(product);
        }

        entity.setQuantity(dto.getQuantity());
        entity.setPricePerUnit(dto.getPricePerUnit());

        if (dto.getSourceWarehouseId() != null) {
            Warehouse warehouse = warehouseRepository.findById(dto.getSourceWarehouseId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Warehouse not found"));
            entity.setSourceWarehouse(warehouse);
        }

        return entity;
    }
}