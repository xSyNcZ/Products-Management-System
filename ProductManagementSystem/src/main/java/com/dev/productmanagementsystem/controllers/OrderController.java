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
import org.springframework.validation.BindingResult;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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
    public ResponseEntity<?> createOrder(@RequestBody Map<String, Object> orderRequest) {
        log.info("Creating new order with data: {}", orderRequest);

        try {
            // Extract data from request
            Long customerId = getLongFromMap(orderRequest, "customerId");
            Long billingAddressId = getLongFromMap(orderRequest, "billingAddressId");
            Long shippingAddressId = getLongFromMap(orderRequest, "shippingAddressId");

            // Handle orderItems from frontend
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> orderItemsData = (List<Map<String, Object>>) orderRequest.get("orderItems");

            // Validate required fields
            if (customerId == null) {
                Map<String, String> error = Map.of("error", "Customer ID is required");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
            }

            if (billingAddressId == null) {
                Map<String, String> error = Map.of("error", "Billing address ID is required");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
            }

            if (shippingAddressId == null) {
                Map<String, String> error = Map.of("error", "Shipping address ID is required");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
            }

            if (orderItemsData == null || orderItemsData.isEmpty()) {
                Map<String, String> error = Map.of("error", "Order must contain at least one item");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
            }

            // Create OrderDTO
            OrderDTO orderDTO = new OrderDTO();
            orderDTO.setCustomerId(customerId);
            orderDTO.setBillingAddressId(billingAddressId);
            orderDTO.setShippingAddressId(shippingAddressId);

            // Convert orderItems to OrderItemDTO list
            List<OrderItemDTO> items = orderItemsData.stream()
                    .map(this::convertToOrderItemDTO)
                    .collect(Collectors.toList());

            orderDTO.setItems(items);

            // Log the final DTO
            log.info("Converted OrderDTO: customerId={}, billingAddressId={}, shippingAddressId={}, items count={}",
                    orderDTO.getCustomerId(), orderDTO.getBillingAddressId(),
                    orderDTO.getShippingAddressId(), orderDTO.getItems().size());

            OrderDTO createdOrder = orderService.createOrder(orderDTO);
            log.info("Order created successfully with ID: {}", createdOrder.getId());
            return new ResponseEntity<>(createdOrder, HttpStatus.CREATED);

        } catch (IllegalArgumentException e) {
            log.error("Failed to create order: Invalid input - {}", e.getMessage());
            Map<String, String> error = Map.of("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (ResourceNotFoundException e) {
            log.error("Failed to create order: Resource not found - {}", e.getMessage());
            Map<String, String> error = Map.of("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        } catch (InsufficientStockException e) {
            log.error("Failed to create order: Insufficient stock - {}", e.getMessage());
            Map<String, String> error = Map.of("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
        } catch (Exception e) {
            log.error("Failed to create order", e);
            Map<String, String> error = Map.of("error", "Internal server error occurred while creating order: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // Helper method to safely extract Long values from Map
    private Long getLongFromMap(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (value == null) {
            return null;
        }
        if (value instanceof Number) {
            return ((Number) value).longValue();
        }
        if (value instanceof String) {
            try {
                return Long.parseLong((String) value);
            } catch (NumberFormatException e) {
                log.warn("Invalid number format for key {}: {}", key, value);
                return null;
            }
        }
        return null;
    }

    // Helper method to convert Map to OrderItemDTO
    private OrderItemDTO convertToOrderItemDTO(Map<String, Object> itemData) {
        OrderItemDTO item = new OrderItemDTO();

        Long productId = getLongFromMap(itemData, "productId");
        if (productId == null) {
            throw new IllegalArgumentException("Product ID is required for order item");
        }
        item.setProductId(productId);

        Object quantityObj = itemData.get("quantity");
        if (quantityObj == null) {
            throw new IllegalArgumentException("Quantity is required for order item");
        }

        Integer quantity;
        if (quantityObj instanceof Number) {
            quantity = ((Number) quantityObj).intValue();
        } else if (quantityObj instanceof String) {
            try {
                quantity = Integer.parseInt((String) quantityObj);
            } catch (NumberFormatException e) {
                throw new IllegalArgumentException("Invalid quantity format");
            }
        } else {
            throw new IllegalArgumentException("Invalid quantity format");
        }

        if (quantity <= 0) {
            throw new IllegalArgumentException("Quantity must be positive");
        }
        item.setQuantity(quantity);

        // Note: unitPrice from frontend is not used in service,
        // as it's set from the product's current price

        return item;
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateOrderStatus(
            @PathVariable Long id,
            @RequestParam OrderStatus status) {
        log.info("Updating order {} status to {}", id, status);
        try {
            OrderDTO updatedOrder = orderService.updateOrderStatus(id, status);
            return ResponseEntity.ok(updatedOrder);
        } catch (ResourceNotFoundException e) {
            log.warn("Order not found with ID: {}", id);
            Map<String, String> error = Map.of("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        } catch (InsufficientStockException e) {
            log.error("Failed to update order: Insufficient stock - {}", e.getMessage());
            Map<String, String> error = Map.of("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
        } catch (InvalidOperationException e) {
            log.error("Failed to update order: Invalid operation - {}", e.getMessage());
            Map<String, String> error = Map.of("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (Exception e) {
            log.error("Failed to update order", e);
            Map<String, String> error = Map.of("error", "Internal server error occurred while updating order");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @PostMapping("/{id}/items")
    public ResponseEntity<?> addOrderItem(
            @PathVariable Long id,
            @Valid @RequestBody OrderItemDTO itemDTO,
            BindingResult bindingResult) {
        log.info("Adding item to order ID: {}", id);

        // Check for validation errors
        if (bindingResult.hasErrors()) {
            Map<String, String> errors = new HashMap<>();
            bindingResult.getFieldErrors().forEach(error -> {
                errors.put(error.getField(), error.getDefaultMessage());
            });
            log.error("Validation errors in add order item: {}", errors);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errors);
        }

        try {
            OrderDTO updatedOrder = orderService.addOrderItem(id, itemDTO);
            return ResponseEntity.ok(updatedOrder);
        } catch (ResourceNotFoundException e) {
            log.warn("Order or product not found - {}", e.getMessage());
            Map<String, String> error = Map.of("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        } catch (InvalidOperationException e) {
            log.error("Failed to add item: Invalid operation - {}", e.getMessage());
            Map<String, String> error = Map.of("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (InsufficientStockException e) {
            log.error("Failed to add item: Insufficient stock - {}", e.getMessage());
            Map<String, String> error = Map.of("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
        } catch (Exception e) {
            log.error("Failed to add item to order", e);
            Map<String, String> error = Map.of("error", "Internal server error occurred while adding item");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @DeleteMapping("/{orderId}/items/{itemId}")
    public ResponseEntity<?> removeOrderItem(
            @PathVariable Long orderId,
            @PathVariable Long itemId) {
        log.info("Removing item {} from order {}", itemId, orderId);
        try {
            OrderDTO updatedOrder = orderService.removeOrderItem(orderId, itemId);
            return ResponseEntity.ok(updatedOrder);
        } catch (ResourceNotFoundException e) {
            log.warn("Order or item not found - {}", e.getMessage());
            Map<String, String> error = Map.of("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        } catch (InvalidOperationException e) {
            log.error("Failed to remove item: Invalid operation - {}", e.getMessage());
            Map<String, String> error = Map.of("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (Exception e) {
            log.error("Failed to remove item from order", e);
            Map<String, String> error = Map.of("error", "Internal server error occurred while removing item");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<?> cancelOrder(@PathVariable Long id) {
        log.info("Cancelling order ID: {}", id);
        try {
            OrderDTO cancelledOrder = orderService.cancelOrder(id);
            return ResponseEntity.ok(cancelledOrder);
        } catch (ResourceNotFoundException e) {
            log.warn("Order not found with ID: {}", id);
            Map<String, String> error = Map.of("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        } catch (InvalidOperationException e) {
            log.error("Failed to cancel order: Invalid operation - {}", e.getMessage());
            Map<String, String> error = Map.of("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (Exception e) {
            log.error("Failed to cancel order", e);
            Map<String, String> error = Map.of("error", "Internal server error occurred while cancelling order");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteOrder(@PathVariable Long id) {
        log.info("Deleting order ID: {}", id);
        try {
            orderService.deleteOrder(id);
            return ResponseEntity.noContent().build();
        } catch (ResourceNotFoundException e) {
            log.warn("Order not found with ID: {}", id);
            Map<String, String> error = Map.of("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        } catch (IllegalStateException e) {
            log.error("Failed to delete order: {}", e.getMessage());
            Map<String, String> error = Map.of("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (Exception e) {
            log.error("Failed to delete order", e);
            Map<String, String> error = Map.of("error", "Internal server error occurred while deleting order");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // Global exception handler for validation errors
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error -> {
            errors.put(error.getField(), error.getDefaultMessage());
        });
        log.error("Validation errors: {}", errors);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errors);
    }
}