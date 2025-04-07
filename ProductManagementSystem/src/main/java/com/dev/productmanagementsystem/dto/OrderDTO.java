package com.dev.productmanagementsystem.dto;

import com.dev.productmanagementsystem.OrderStatus;
import java.time.LocalDateTime;
import java.util.List;

public class OrderDTO {
    private Long id;
    private LocalDateTime orderDate;
    private OrderStatus orderStatus;
    private UserSummaryDTO user;
    private List<OrderItemDTO> orderItems;
    private InvoiceSummaryDTO invoice;

    // Constructors
    public OrderDTO() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public LocalDateTime getOrderDate() { return orderDate; }
    public void setOrderDate(LocalDateTime orderDate) { this.orderDate = orderDate; }

    public OrderStatus getOrderStatus() { return orderStatus; }
    public void setOrderStatus(OrderStatus orderStatus) { this.orderStatus = orderStatus; }

    public UserSummaryDTO getUser() { return user; }
    public void setUser(UserSummaryDTO user) { this.user = user; }

    public List<OrderItemDTO> getOrderItems() { return orderItems; }
    public void setOrderItems(List<OrderItemDTO> orderItems) { this.orderItems = orderItems; }

    public InvoiceSummaryDTO getInvoice() { return invoice; }
    public void setInvoice(InvoiceSummaryDTO invoice) { this.invoice = invoice; }
}

