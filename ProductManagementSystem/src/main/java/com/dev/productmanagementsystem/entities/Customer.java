package com.dev.productmanagementsystem.entities;

import com.dev.productmanagementsystem.enums.CustomerType;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "customers")
public class Customer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "customer_number", unique = true, nullable = false)
    private String customerNumber;

    @Column(name = "first_name", nullable = false)
    private String firstName;

    @Column(name = "last_name", nullable = false)
    private String lastName;

    @Column(name = "email", unique = true, nullable = false)
    private String email;

    @Column(name = "phone_number")
    private String phoneNumber;

    @Column(name = "company_name")
    private String companyName;

    @Column(name = "tax_id")
    private String taxId;

    @Column(name = "registration_date")
    private LocalDateTime registrationDate;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "customer_type")
    @Enumerated(EnumType.STRING)
    private CustomerType customerType = CustomerType.INDIVIDUAL;

    @Column(name = "credit_limit", precision = 10, scale = 2)
    private java.math.BigDecimal creditLimit;

    @Column(name = "payment_terms")
    private String paymentTerms;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    // Relationships
    @OneToOne(cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JoinColumn(name = "address_id")
    private Address address;

    // Updated relationship with orders - should reference Customer, not User
    @OneToMany(mappedBy = "customer", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Set<Order> orders = new HashSet<>();

    // Assigned sales manager relationship
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_sales_manager_id")
    private User assignedSalesManager;

    // Constructors
    public Customer() {}

    public Customer(String firstName, String lastName, String email) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.registrationDate = LocalDateTime.now();
        this.customerNumber = generateCustomerNumber();
        this.orders = new HashSet<>();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCustomerNumber() { return customerNumber; }
    public void setCustomerNumber(String customerNumber) { this.customerNumber = customerNumber; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }

    public String getTaxId() { return taxId; }
    public void setTaxId(String taxId) { this.taxId = taxId; }

    public LocalDateTime getRegistrationDate() { return registrationDate; }
    public void setRegistrationDate(LocalDateTime registrationDate) { this.registrationDate = registrationDate; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public CustomerType getCustomerType() { return customerType; }
    public void setCustomerType(CustomerType customerType) { this.customerType = customerType; }

    public java.math.BigDecimal getCreditLimit() { return creditLimit; }
    public void setCreditLimit(java.math.BigDecimal creditLimit) { this.creditLimit = creditLimit; }

    public String getPaymentTerms() { return paymentTerms; }
    public void setPaymentTerms(String paymentTerms) { this.paymentTerms = paymentTerms; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public Address getAddress() { return address; }
    public void setAddress(Address address) { this.address = address; }

    public Set<Order> getOrders() { return orders; }
    public void setOrders(Set<Order> orders) {
        this.orders = orders != null ? orders : new HashSet<>();
    }

    public User getAssignedSalesManager() { return assignedSalesManager; }
    public void setAssignedSalesManager(User assignedSalesManager) { this.assignedSalesManager = assignedSalesManager; }

    // Helper methods for managing orders
    public void addOrder(Order order) {
        if (orders == null) {
            orders = new HashSet<>();
        }
        orders.add(order);
        order.setCustomer(this);
    }

    public void removeOrder(Order order) {
        if (orders != null) {
            orders.remove(order);
            order.setCustomer(null);
        }
    }

    // Utility methods
    public String getFullName() {
        return firstName + " " + lastName;
    }

    public String getDisplayName() {
        if (customerType == CustomerType.BUSINESS && companyName != null && !companyName.trim().isEmpty()) {
            return companyName;
        }
        return getFullName();
    }

    /**
     * Get the total number of orders for this customer
     */
    public int getOrderCount() {
        return orders != null ? orders.size() : 0;
    }

    /**
     * Check if customer has any pending orders
     */
    public boolean hasPendingOrders() {
        if (orders == null) return false;
        return orders.stream()
                .anyMatch(order -> order.getStatus() == com.dev.productmanagementsystem.enums.OrderStatus.PENDING);
    }

    /**
     * Get total amount spent by customer across all orders
     */
    public java.math.BigDecimal getTotalSpent() {
        if (orders == null) return java.math.BigDecimal.ZERO;
        return orders.stream()
                .filter(order -> order.getTotalAmount() != null)
                .map(Order::getTotalAmount)
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
    }

    private String generateCustomerNumber() {
        return "CUST-" + System.currentTimeMillis();
    }

    // Auditing methods
    @PrePersist
    protected void onCreate() {
        if (registrationDate == null) {
            registrationDate = LocalDateTime.now();
        }
        if (customerNumber == null) {
            customerNumber = generateCustomerNumber();
        }
        if (orders == null) {
            orders = new HashSet<>();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        if (orders == null) {
            orders = new HashSet<>();
        }
    }

    // Override equals and hashCode for proper entity comparison
    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (obj == null || getClass() != obj.getClass()) return false;
        Customer customer = (Customer) obj;
        return id != null && id.equals(customer.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }

    @Override
    public String toString() {
        return "Customer{" +
                "id=" + id +
                ", customerNumber='" + customerNumber + '\'' +
                ", firstName='" + firstName + '\'' +
                ", lastName='" + lastName + '\'' +
                ", email='" + email + '\'' +
                ", customerType=" + customerType +
                ", isActive=" + isActive +
                '}';
    }
}