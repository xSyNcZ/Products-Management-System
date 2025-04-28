package com.dev.productmanagementsystem.controllers;

import com.dev.productmanagementsystem.dto.OrderDTO;
import com.dev.productmanagementsystem.dto.OrderItemDTO;
import com.dev.productmanagementsystem.enums.OrderStatus;
import com.dev.productmanagementsystem.exceptions.InvalidOperationException;
import com.dev.productmanagementsystem.exceptions.InsufficientStockException;
import com.dev.productmanagementsystem.exceptions.ResourceNotFoundException;
import com.dev.productmanagementsystem.services.OrderService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/orders")
@Validated
public class OrderController {

    private static final Logger log = LoggerFactory.getLogger(OrderController.class);

    @Autowired
    private OrderService orderService;

    @GetMapping
    public ResponseEntity<List<OrderDTO>> getAllOrders() {
        log.info("Retrieving all orders");
        List<OrderDTO> orders = orderService.getAllOrders();
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderDTO> getOrderById(@PathVariable Long id) {
        log.info("Retrieving order with ID: {}", id);
        try {
            OrderDTO order = orderService.getOrderById(id);
            return ResponseEntity.ok(order);
        } catch (ResourceNotFoundException e) {
            log.warn("Order not found with ID: {}", id);
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/number/{orderNumber}")
    public ResponseEntity<OrderDTO> getOrderByNumber(@PathVariable String orderNumber) {
        log.info("Retrieving order with number: {}", orderNumber);
        try {
            OrderDTO order = orderService.findByOrderNumber(orderNumber);
            return ResponseEntity.ok(order);
        } catch (ResourceNotFoundException e) {
            log.warn("Order not found with number: {}", orderNumber);
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<OrderDTO>> getOrdersByCustomerId(@PathVariable Long customerId) {
        log.info("Retrieving orders for customer ID: {}", customerId);
        List<OrderDTO> orders = orderService.getOrdersByCustomer(customerId);
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/sales-manager/{salesManagerId}")
    public ResponseEntity<List<OrderDTO>> getOrdersBySalesManagerId(@PathVariable Long salesManagerId) {
        log.info("Retrieving orders for sales manager ID: {}", salesManagerId);
        // Note: OrderService doesn't have this method yet, but we're assuming it would be added
        // For now, we'll return an empty list
        return ResponseEntity.ok(List.of());
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<OrderDTO>> getOrdersByStatus(@PathVariable OrderStatus status) {
        log.info("Retrieving orders with status: {}", status);
        List<OrderDTO> orders = orderService.getOrdersByStatus(status);
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/date-range")
    public ResponseEntity<List<OrderDTO>> getOrdersByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        log.info("Retrieving orders between {} and {}", start, end);
        List<OrderDTO> orders = orderService.getOrdersBetweenDates(start, end);
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/product/{productId}")
    public ResponseEntity<List<OrderDTO>> getOrdersByProductId(@PathVariable Long productId) {
        log.info("Retrieving orders containing product ID: {}", productId);
        // Note: OrderService doesn't have this method yet, but we're assuming it would be added
        // For now, we'll return an empty list
        return ResponseEntity.ok(List.of());
    }

    @GetMapping("/recent")
    public ResponseEntity<List<OrderDTO>> getRecentOrders() {
        log.info("Retrieving recent orders");
        // Note: OrderService doesn't have this method yet, but we're assuming it would be added
        // For now, we'll return all orders
        List<OrderDTO> orders = orderService.getAllOrders();
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/status-count/{status}")
    public ResponseEntity<Long> getOrderCountByStatus(@PathVariable OrderStatus status) {
        log.info("Counting orders with status: {}", status);
        // Note: OrderService doesn't have this method yet, but we're assuming it would be added
        // For now, we'll return 0
        return ResponseEntity.ok(0L);
    }

    @GetMapping("/to-ship")
    public ResponseEntity<List<OrderDTO>> getOrdersToShip() {
        log.info("Retrieving orders to ship");
        List<OrderDTO> orders = orderService.getOrdersToShip();
        return ResponseEntity.ok(orders);
    }

    @PostMapping
    public ResponseEntity<OrderDTO> createOrder(@Valid @RequestBody OrderDTO orderDTO) {
        log.info("Creating new order for customer ID: {}", orderDTO.getCustomerId());
        try {
            OrderDTO createdOrder = orderService.createOrder(orderDTO);
            return new ResponseEntity<>(createdOrder, HttpStatus.CREATED);
        } catch (ResourceNotFoundException e) {
            log.error("Failed to create order: Resource not found - {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (InsufficientStockException e) {
            log.error("Failed to create order: Insufficient stock - {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        } catch (Exception e) {
            log.error("Failed to create order", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<OrderDTO> updateOrderStatus(
            @PathVariable Long id,
            @RequestParam OrderStatus status) {
        log.info("Updating order {} status to {}", id, status);
        try {
            OrderDTO updatedOrder = orderService.updateOrderStatus(id, status);
            return ResponseEntity.ok(updatedOrder);
        } catch (ResourceNotFoundException e) {
            log.warn("Order not found with ID: {}", id);
            return ResponseEntity.notFound().build();
        } catch (InsufficientStockException e) {
            log.error("Failed to update order: Insufficient stock - {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        } catch (InvalidOperationException e) {
            log.error("Failed to update order: Invalid operation - {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (Exception e) {
            log.error("Failed to update order", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/{id}/items")
    public ResponseEntity<OrderDTO> addOrderItem(
            @PathVariable Long id,
            @Valid @RequestBody OrderItemDTO itemDTO) {
        log.info("Adding item to order ID: {}", id);
        try {
            OrderDTO updatedOrder = orderService.addOrderItem(id, itemDTO);
            return ResponseEntity.ok(updatedOrder);
        } catch (ResourceNotFoundException e) {
            log.warn("Order or product not found - {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (InvalidOperationException e) {
            log.error("Failed to add item: Invalid operation - {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (InsufficientStockException e) {
            log.error("Failed to add item: Insufficient stock - {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        } catch (Exception e) {
            log.error("Failed to add item to order", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/{orderId}/items/{itemId}")
    public ResponseEntity<OrderDTO> removeOrderItem(
            @PathVariable Long orderId,
            @PathVariable Long itemId) {
        log.info("Removing item {} from order {}", itemId, orderId);
        try {
            OrderDTO updatedOrder = orderService.removeOrderItem(orderId, itemId);
            return ResponseEntity.ok(updatedOrder);
        } catch (ResourceNotFoundException e) {
            log.warn("Order or item not found - {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (InvalidOperationException e) {
            log.error("Failed to remove item: Invalid operation - {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (Exception e) {
            log.error("Failed to remove item from order", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<OrderDTO> cancelOrder(@PathVariable Long id) {
        log.info("Cancelling order ID: {}", id);
        try {
            OrderDTO cancelledOrder = orderService.cancelOrder(id);
            return ResponseEntity.ok(cancelledOrder);
        } catch (ResourceNotFoundException e) {
            log.warn("Order not found with ID: {}", id);
            return ResponseEntity.notFound().build();
        } catch (InvalidOperationException e) {
            log.error("Failed to cancel order: Invalid operation - {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (Exception e) {
            log.error("Failed to cancel order", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteOrder(@PathVariable Long id) {
        log.info("Deleting order ID: {}", id);
        try {
            orderService.deleteOrder(id);
            return ResponseEntity.noContent().build();
        } catch (ResourceNotFoundException e) {
            log.warn("Order not found with ID: {}", id);
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            log.error("Failed to delete order: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (Exception e) {
            log.error("Failed to delete order", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}