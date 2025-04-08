package com.dev.productmanagementsystem.repository;

import com.dev.productmanagementsystem.entities.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    // Find order items by order id
    List<OrderItem> findByOrderId(Long orderId);

    // Find order items by product id
    List<OrderItem> findByProductId(Long productId);

    // Find order items by source warehouse id
    List<OrderItem> findBySourceWarehouseId(Long warehouseId);

    // Find order items with quantity greater than specified
    List<OrderItem> findByQuantityGreaterThan(Integer quantity);

    // Sum of quantities for a specific product
    @Query("SELECT SUM(oi.quantity) FROM OrderItem oi WHERE oi.product.id = ?1")
    Integer sumQuantityByProductId(Long productId);

    // Find most ordered products
    @Query("SELECT oi.product.id, SUM(oi.quantity) as totalQty FROM OrderItem oi GROUP BY oi.product.id ORDER BY totalQty DESC")
    List<Object[]> findMostOrderedProducts();

    // Count number of times a product has been ordered
    @Query("SELECT COUNT(oi) FROM OrderItem oi WHERE oi.product.id = ?1")
    Long countByProductId(Long productId);
}