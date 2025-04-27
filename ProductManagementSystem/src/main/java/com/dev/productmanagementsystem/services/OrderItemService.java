package com.dev.productmanagementsystem.services;

import com.dev.productmanagementsystem.entities.OrderItem;
import com.dev.productmanagementsystem.entities.Product;
import com.dev.productmanagementsystem.entities.Warehouse;
import com.dev.productmanagementsystem.repositories.OrderItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
public class OrderItemService {

    private final OrderItemRepository orderItemRepository;
    private final ProductService productService;
    private final WarehouseService warehouseService;

    @Autowired
    public OrderItemService(OrderItemRepository orderItemRepository,
                            ProductService productService,
                            WarehouseService warehouseService) {
        this.orderItemRepository = orderItemRepository;
        this.productService = productService;
        this.warehouseService = warehouseService;
    }

    public Optional<OrderItem> findById(Long id) {
        return orderItemRepository.findById(id);
    }

    public List<OrderItem> findAll() {
        return orderItemRepository.findAll();
    }

    public List<OrderItem> findByOrderId(Long orderId) {
        return orderItemRepository.findByOrderId(orderId);
    }

    public OrderItem save(OrderItem orderItem) {
        return orderItemRepository.save(orderItem);
    }

    @Transactional
    public OrderItem createOrderItem(OrderItem orderItem) {
        // Validate product exists
        Product product = productService.findById(orderItem.getProduct().getId())
                .orElseThrow(() -> new IllegalArgumentException("Product not found"));

        // Validate warehouse exists
        Warehouse warehouse = warehouseService.findById(orderItem.getSourceWarehouse().getId())
                .orElseThrow(() -> new IllegalArgumentException("Warehouse not found"));

        // Check if product is available in the warehouse with sufficient quantity
        Integer availableStock = warehouseService.getProductStock(product.getId(), warehouse.getId());
        if (availableStock == null || availableStock < orderItem.getQuantity()) {
            throw new IllegalArgumentException(
                    "Insufficient stock for product " + product.getName() +
                            " in warehouse " + warehouse.getName() +
                            ". Available: " + (availableStock == null ? 0 : availableStock) +
                            ", Requested: " + orderItem.getQuantity());
        }

        // Set product current price if not provided
        if (orderItem.getPricePerUnit() == null) {
            orderItem.setPricePerUnit(product.getPrice());
        }

        // Save the order item
        return orderItemRepository.save(orderItem);
    }

    @Transactional
    public OrderItem updateOrderItem(Long id, OrderItem orderItemDetails) {
        OrderItem existingOrderItem = orderItemRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Order item not found"));

        // If quantity is being increased, check stock availability
        if (orderItemDetails.getQuantity() > existingOrderItem.getQuantity()) {
            int additionalQuantity = orderItemDetails.getQuantity() - existingOrderItem.getQuantity();
            Integer availableStock = warehouseService.getProductStock(
                    existingOrderItem.getProduct().getId(),
                    existingOrderItem.getSourceWarehouse().getId());

            if (availableStock < additionalQuantity) {
                throw new IllegalArgumentException("Insufficient stock for requested quantity increase");
            }
        }

        // Update fields
        existingOrderItem.setQuantity(orderItemDetails.getQuantity());
        if (orderItemDetails.getPricePerUnit() != null) {
            existingOrderItem.setPricePerUnit(orderItemDetails.getPricePerUnit());
        }

        // If warehouse changed, validate and update
        if (orderItemDetails.getSourceWarehouse() != null &&
                !existingOrderItem.getSourceWarehouse().getId().equals(orderItemDetails.getSourceWarehouse().getId())) {

            Warehouse newWarehouse = warehouseService.findById(orderItemDetails.getSourceWarehouse().getId())
                    .orElseThrow(() -> new IllegalArgumentException("New warehouse not found"));

            Integer availableStock = warehouseService.getProductStock(
                    existingOrderItem.getProduct().getId(),
                    newWarehouse.getId());

            if (availableStock < existingOrderItem.getQuantity()) {
                throw new IllegalArgumentException("Insufficient stock in new warehouse");
            }

            existingOrderItem.setSourceWarehouse(newWarehouse);
        }

        return orderItemRepository.save(existingOrderItem);
    }

    public void deleteOrderItem(Long id) {
        if (!orderItemRepository.existsById(id)) {
            throw new IllegalArgumentException("Order item not found");
        }
        orderItemRepository.deleteById(id);
    }

    public BigDecimal calculateTotalPrice(Long id) {
        OrderItem orderItem = orderItemRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Order item not found"));
        return orderItem.getTotalPrice();
    }

    public BigDecimal calculateOrderTotal(Long orderId) {
        List<OrderItem> orderItems = orderItemRepository.findByOrderId(orderId);
        return orderItems.stream()
                .map(OrderItem::getTotalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    @Transactional
    public void allocateInventoryForOrder(Long orderId) {
        List<OrderItem> orderItems = orderItemRepository.findByOrderId(orderId);

        for (OrderItem item : orderItems) {
            warehouseService.reduceProductStock(
                    item.getProduct().getId(),
                    item.getSourceWarehouse().getId(),
                    item.getQuantity()
            );
        }
    }

    @Transactional
    public void returnInventoryForCancelledOrder(Long orderId) {
        List<OrderItem> orderItems = orderItemRepository.findByOrderId(orderId);

        for (OrderItem item : orderItems) {
            warehouseService.increaseProductStock(
                    item.getProduct().getId(),
                    item.getSourceWarehouse().getId(),
                    item.getQuantity()
            );
        }
    }
}