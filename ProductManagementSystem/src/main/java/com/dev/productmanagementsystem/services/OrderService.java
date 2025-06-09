package com.dev.productmanagementsystem.services;

import com.dev.productmanagementsystem.dto.OrderDTO;
import com.dev.productmanagementsystem.dto.OrderItemDTO;
import com.dev.productmanagementsystem.entities.*;
import com.dev.productmanagementsystem.enums.OrderStatus;
import com.dev.productmanagementsystem.exceptions.InvalidOperationException;
import com.dev.productmanagementsystem.exceptions.InsufficientStockException;
import com.dev.productmanagementsystem.exceptions.ResourceNotFoundException;
import com.dev.productmanagementsystem.repositories.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final AddressRepository addressRepository;
    private final WarehouseRepository warehouseRepository;

    @Autowired
    public OrderService(OrderRepository orderRepository,
                        OrderItemRepository orderItemRepository,
                        UserRepository userRepository,
                        ProductRepository productRepository,
                        AddressRepository addressRepository,
                        WarehouseRepository warehouseRepository) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
        this.addressRepository = addressRepository;
        this.warehouseRepository = warehouseRepository;
    }

    public List<OrderDTO> getAllOrders() {
        return orderRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public OrderDTO getOrderById(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + id));
        return convertToDTO(order);
    }

    public List<OrderDTO> getOrdersByCustomer(Long customerId) {
        return orderRepository.findByCustomerId(customerId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<OrderDTO> getOrdersByStatus(OrderStatus status) {
        return orderRepository.findByStatus(status).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public OrderDTO createOrder(OrderDTO orderDTO) {
        User customer = userRepository.findById(orderDTO.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + orderDTO.getCustomerId()));

        User salesManager = null;
        if (orderDTO.getSalesManagerId() != null) {
            salesManager = userRepository.findById(orderDTO.getSalesManagerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Sales manager not found with id: " + orderDTO.getSalesManagerId()));
        }

        Address shippingAddress = addressRepository.findById(orderDTO.getShippingAddressId())
                .orElseThrow(() -> new ResourceNotFoundException("Shipping address not found with id: " + orderDTO.getShippingAddressId()));

        Address billingAddress = addressRepository.findById(orderDTO.getBillingAddressId())
                .orElseThrow(() -> new ResourceNotFoundException("Billing address not found with id: " + orderDTO.getBillingAddressId()));

        Order order = new Order();
        order.setOrderNumber(generateOrderNumber());
        order.setCustomer(customer);
        order.setSalesManager(salesManager);
        order.setStatus(OrderStatus.PENDING);
        order.setShippingAddress(shippingAddress);
        order.setBillingAddress(billingAddress);
        order.setTotalAmount(BigDecimal.ZERO);

        Order savedOrder = orderRepository.save(order);

        // Process order items
        BigDecimal totalAmount = BigDecimal.ZERO;
        for (OrderItemDTO itemDTO : orderDTO.getItems()) {
            Product product = productRepository.findById(itemDTO.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + itemDTO.getProductId()));

            // Find the best warehouse with enough stock
            Warehouse sourceWarehouse = findBestWarehouse(product, itemDTO.getQuantity());
            if (sourceWarehouse == null) {
                throw new InsufficientStockException("Insufficient stock for product: " + product.getName());
            }

            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(savedOrder);
            orderItem.setProduct(product);
            orderItem.setQuantity(itemDTO.getQuantity());
            orderItem.setPricePerUnit(product.getPrice());
            orderItem.setSourceWarehouse(sourceWarehouse);

            orderItemRepository.save(orderItem);
            savedOrder.addItem(orderItem);

            totalAmount = totalAmount.add(orderItem.getTotalPrice());
        }

        savedOrder.setTotalAmount(totalAmount);
        Order updatedOrder = orderRepository.save(savedOrder);

        return convertToDTO(updatedOrder);
    }

    @Transactional
    public OrderDTO updateOrderStatus(Long id, OrderStatus status) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + id));

        order.setStatus(status);

        // If the order is shipped, set the shipping date
        if (status == OrderStatus.SHIPPED) {
            order.setShippingDate(LocalDateTime.now());
        }

        // If the order is delivered, set the delivery date
        if (status == OrderStatus.DELIVERED) {
            order.setDeliveryDate(LocalDateTime.now());
        }

        // If the order is confirmed, reserve the stock
        if (status == OrderStatus.CONFIRMED) {
            reserveStock(order);
        }

        // If the order is cancelled, release the reserved stock
        if (status == OrderStatus.CANCELLED) {
            releaseStock(order);
        }

        Order updatedOrder = orderRepository.save(order);
        return convertToDTO(updatedOrder);
    }

    @Transactional
    public void deleteOrder(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + id));

        // Only allow deletion of pending orders
        if (order.getStatus() != OrderStatus.PENDING) {
            throw new IllegalStateException("Cannot delete non-pending order");
        }

        orderRepository.deleteById(id);
    }

    public OrderDTO findByOrderNumber(String orderNumber) {
        Order order = orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with number: " + orderNumber));
        return convertToDTO(order);
    }

    public List<OrderDTO> getOrdersBetweenDates(LocalDateTime startDate, LocalDateTime endDate) {
        return orderRepository.findByOrderDateBetween(startDate, endDate).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public OrderDTO cancelOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        // Only allow cancellation of PENDING and CONFIRMED orders
        if (order.getStatus() != OrderStatus.PENDING && order.getStatus() != OrderStatus.CONFIRMED) {
            throw new InvalidOperationException("Cannot cancel order with status: " + order.getStatus());
        }

        // If order was confirmed, release the stock
        if (order.getStatus() == OrderStatus.CONFIRMED) {
            releaseStock(order);
        }

        order.setStatus(OrderStatus.CANCELLED);
        Order updatedOrder = orderRepository.save(order);
        return convertToDTO(updatedOrder);
    }

    @Transactional
    public OrderDTO addOrderItem(Long orderId, OrderItemDTO orderItemDTO) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        // Can only add items to pending orders
        if (order.getStatus() != OrderStatus.PENDING) {
            throw new InvalidOperationException("Cannot add items to order with status: " + order.getStatus());
        }

        Product product = productRepository.findById(orderItemDTO.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + orderItemDTO.getProductId()));

        // Find the best warehouse with enough stock
        Warehouse sourceWarehouse = findBestWarehouse(product, orderItemDTO.getQuantity());
        if (sourceWarehouse == null) {
            throw new InsufficientStockException("Insufficient stock for product: " + product.getName());
        }

        OrderItem orderItem = new OrderItem();
        orderItem.setOrder(order);
        orderItem.setProduct(product);
        orderItem.setQuantity(orderItemDTO.getQuantity());
        orderItem.setPricePerUnit(product.getPrice());
        orderItem.setSourceWarehouse(sourceWarehouse);

        orderItemRepository.save(orderItem);
        order.addItem(orderItem);

        // Update total amount
        BigDecimal totalAmount = order.getTotalAmount().add(orderItem.getTotalPrice());
        order.setTotalAmount(totalAmount);

        Order updatedOrder = orderRepository.save(order);
        return convertToDTO(updatedOrder);
    }

    @Transactional
    public OrderDTO removeOrderItem(Long orderId, Long orderItemId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        // Can only remove items from pending orders
        if (order.getStatus() != OrderStatus.PENDING) {
            throw new InvalidOperationException("Cannot remove items from order with status: " + order.getStatus());
        }

        OrderItem orderItem = orderItemRepository.findById(orderItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Order item not found with id: " + orderItemId));

        // Check if item belongs to the order
        if (!orderItem.getOrder().getId().equals(orderId)) {
            throw new InvalidOperationException("Order item does not belong to this order");
        }

        // Update total amount
        BigDecimal totalAmount = order.getTotalAmount().subtract(orderItem.getTotalPrice());
        order.setTotalAmount(totalAmount);

        // Remove item from order and delete it
        order.removeItem(orderItem);
        orderItemRepository.delete(orderItem);

        Order updatedOrder = orderRepository.save(order);
        return convertToDTO(updatedOrder);
    }

    public List<OrderDTO> getOrdersToShip() {
        return orderRepository.findByStatus(OrderStatus.CONFIRMED).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    private String generateOrderNumber() {
        return "ORD-" + System.currentTimeMillis();
    }

    private Warehouse findBestWarehouse(Product product, Integer requiredQuantity) {
        Map<Warehouse, Integer> stockQuantities = product.getStockQuantities();

        for (Map.Entry<Warehouse, Integer> entry : stockQuantities.entrySet()) {
            if (entry.getValue() >= requiredQuantity) {
                return entry.getKey();
            }
        }

        return null;
    }

    private void reserveStock(Order order) {
        for (OrderItem item : order.getItems()) {
            Product product = item.getProduct();
            Warehouse warehouse = item.getSourceWarehouse();
            Integer currentStock = product.getStockQuantities().getOrDefault(warehouse, 0);

            if (currentStock < item.getQuantity()) {
                throw new InsufficientStockException("Insufficient stock for product: " + product.getName());
            }

            product.updateStock(warehouse, currentStock - item.getQuantity());
            productRepository.save(product);
        }
    }

    private void releaseStock(Order order) {
        for (OrderItem item : order.getItems()) {
            Product product = item.getProduct();
            Warehouse warehouse = item.getSourceWarehouse();
            Integer currentStock = product.getStockQuantities().getOrDefault(warehouse, 0);

            product.updateStock(warehouse, currentStock + item.getQuantity());
            productRepository.save(product);
        }
    }

    private OrderDTO convertToDTO(Order order) {
        OrderDTO dto = new OrderDTO();
        dto.setId(order.getId());
        dto.setOrderNumber(order.getOrderNumber());

        if (order.getCustomer() != null) {
            dto.setCustomerId(order.getCustomer().getId());
            dto.setCustomerName(order.getCustomer().getFirstName() + " " + order.getCustomer().getLastName());
        }

        if (order.getSalesManager() != null) {
            dto.setSalesManagerId(order.getSalesManager().getId());
            dto.setSalesManagerName(order.getSalesManager().getFirstName() + " " + order.getSalesManager().getLastName());
        }

        dto.setStatus(order.getStatus());
        dto.setOrderDate(order.getOrderDate());
        dto.setShippingDate(order.getShippingDate());
        dto.setDeliveryDate(order.getDeliveryDate());

        if (order.getShippingAddress() != null) {
            dto.setShippingAddressId(order.getShippingAddress().getId());
        }

        if (order.getBillingAddress() != null) {
            dto.setBillingAddressId(order.getBillingAddress().getId());
        }

        dto.setTotalAmount(order.getTotalAmount());

        List<OrderItemDTO> itemDTOs = new ArrayList<>();
        for (OrderItem item : order.getItems()) {
            OrderItemDTO itemDTO = new OrderItemDTO();
            itemDTO.setId(item.getId());

            if (item.getProduct() != null) {
                itemDTO.setProductId(item.getProduct().getId());
                itemDTO.setProductName(item.getProduct().getName());
            }

            itemDTO.setQuantity(item.getQuantity());
            itemDTO.setPricePerUnit(item.getPricePerUnit());

            if (item.getSourceWarehouse() != null) {
                itemDTO.setSourceWarehouseId(item.getSourceWarehouse().getId());
                itemDTO.setSourceWarehouseName(item.getSourceWarehouse().getName());
            }

            itemDTOs.add(itemDTO);
        }

        dto.setItems(itemDTOs);

        return dto;
    }
}
