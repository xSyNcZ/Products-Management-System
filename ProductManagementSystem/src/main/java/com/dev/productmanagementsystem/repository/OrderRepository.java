package com.dev.productmanagementsystem.repository;

import com.dev.productmanagementsystem.entities.Order;
import com.dev.productmanagementsystem.enums.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    // Find order by order number
    Optional<Order> findByOrderNumber(String orderNumber);

    // Find orders by customer id
    List<Order> findByCustomerId(Long customerId);

    // Find orders by sales manager id
    List<Order> findBySalesManagerId(Long salesManagerId);

    // Find orders by status
    List<Order> findByStatus(OrderStatus status);

    // Find orders by order date range
    List<Order> findByOrderDateBetween(LocalDateTime startDate, LocalDateTime endDate);

    // Find orders by shipping address id
    List<Order> findByShippingAddressId(Long addressId);

    // Find orders by billing address id
    List<Order> findByBillingAddressId(Long addressId);

    // Find recent orders
    List<Order> findTop10ByOrderByOrderDateDesc();

    // Find count of orders by status
    @Query("SELECT COUNT(o) FROM Order o WHERE o.status = ?1")
    Long countByStatus(OrderStatus status);

    // Find orders that contain a specific product
    @Query("SELECT o FROM Order o JOIN o.items i WHERE i.product.id = ?1")
    List<Order> findByProductId(Long productId);

    // Find orders with total amount greater than
    @Query("SELECT o FROM Order o WHERE o.totalAmount > ?1")
    List<Order> findByTotalAmountGreaterThan(Double amount);
}