package com.dev.productmanagementsystem.dto;

import com.dev.productmanagementsystem.enums.OrderStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class OrderDTO {
    private Long id;
    private String orderNumber;
    private Long customerId;
    private String customerName;
    private Long salesManagerId;
    private String salesManagerName;
    private OrderStatus status;
    private LocalDateTime orderDate;
    private LocalDateTime shippingDate;
    private LocalDateTime deliveryDate;
    private List<OrderItemDTO> items;
    private Long shippingAddressId;
    private Long billingAddressId;
    private BigDecimal totalAmount;

    // Constructors
    public OrderDTO() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getOrderNumber() { return orderNumber; }
    public void setOrderNumber(String orderNumber) { this.orderNumber = orderNumber; }

    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public Long getSalesManagerId() { return salesManagerId; }
    public void setSalesManagerId(Long salesManagerId) { this.salesManagerId = salesManagerId; }

    public String getSalesManagerName() { return salesManagerName; }
    public void setSalesManagerName(String salesManagerName) { this.salesManagerName = salesManagerName; }

    public OrderStatus getStatus() { return status; }
    public void setStatus(OrderStatus status) { this.status = status; }

    public LocalDateTime getOrderDate() { return orderDate; }
    public void setOrderDate(LocalDateTime orderDate) { this.orderDate = orderDate; }

    public LocalDateTime getShippingDate() { return shippingDate; }
    public void setShippingDate(LocalDateTime shippingDate) { this.shippingDate = shippingDate; }

    public LocalDateTime getDeliveryDate() { return deliveryDate; }
    public void setDeliveryDate(LocalDateTime deliveryDate) { this.deliveryDate = deliveryDate; }

    public List<OrderItemDTO> getItems() { return items; }
    public void setItems(List<OrderItemDTO> items) { this.items = items; }

    public Long getShippingAddressId() { return shippingAddressId; }
    public void setShippingAddressId(Long shippingAddressId) { this.shippingAddressId = shippingAddressId; }

    public Long getBillingAddressId() { return billingAddressId; }
    public void setBillingAddressId(Long billingAddressId) { this.billingAddressId = billingAddressId; }

    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
}