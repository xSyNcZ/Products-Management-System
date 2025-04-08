package com.dev.productmanagementsystem.entities;

import com.dev.productmanagementsystem.enums.OrderStatus;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "orders")
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_number", unique = true)
    private String orderNumber;

    @ManyToOne
    @JoinColumn(name = "customer_id")
    private User customer;

    @ManyToOne
    @JoinColumn(name = "sales_manager_id")
    private User salesManager;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private OrderStatus status;

    @Column(name = "order_date")
    private LocalDateTime orderDate;

    @Column(name = "shipping_date")
    private LocalDateTime shippingDate;

    @Column(name = "delivery_date")
    private LocalDateTime deliveryDate;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL)
    private Set<OrderItem> items = new HashSet<>();

    @ManyToOne
    @JoinColumn(name = "shipping_address_id")
    private Address shippingAddress;

    @ManyToOne
    @JoinColumn(name = "billing_address_id")
    private Address billingAddress;

    @Column(name = "total_amount", precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @OneToOne(mappedBy = "order")
    private Invoice invoice;

    // Constructors
    public Order() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getOrderNumber() { return orderNumber; }
    public void setOrderNumber(String orderNumber) { this.orderNumber = orderNumber; }

    public User getCustomer() { return customer; }
    public void setCustomer(User customer) { this.customer = customer; }

    public User getSalesManager() { return salesManager; }
    public void setSalesManager(User salesManager) { this.salesManager = salesManager; }

    public OrderStatus getStatus() { return status; }
    public void setStatus(OrderStatus status) { this.status = status; }

    public LocalDateTime getOrderDate() { return orderDate; }
    public void setOrderDate(LocalDateTime orderDate) { this.orderDate = orderDate; }

    public LocalDateTime getShippingDate() { return shippingDate; }
    public void setShippingDate(LocalDateTime shippingDate) { this.shippingDate = shippingDate; }

    public LocalDateTime getDeliveryDate() { return deliveryDate; }
    public void setDeliveryDate(LocalDateTime deliveryDate) { this.deliveryDate = deliveryDate; }

    public Set<OrderItem> getItems() { return items; }
    public void setItems(Set<OrderItem> items) { this.items = items; }

    public Address getShippingAddress() { return shippingAddress; }
    public void setShippingAddress(Address shippingAddress) { this.shippingAddress = shippingAddress; }

    public Address getBillingAddress() { return billingAddress; }
    public void setBillingAddress(Address billingAddress) { this.billingAddress = billingAddress; }

    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }

    public Invoice getInvoice() { return invoice; }
    public void setInvoice(Invoice invoice) { this.invoice = invoice; }

    // Additional methods
    public void addItem(OrderItem item) {
        items.add(item);
        item.setOrder(this);
    }

    public void removeItem(OrderItem item) {
        items.remove(item);
        item.setOrder(null);
    }

    // Auditing methods
    @PrePersist
    protected void onCreate() {
        this.orderDate = LocalDateTime.now();
    }
}