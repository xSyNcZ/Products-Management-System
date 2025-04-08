package com.dev.productmanagementsystem.entities;

import com.dev.productmanagementsystem.enums.PaymentStatus;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "invoices")
public class Invoice {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "invoice_number", unique = true)
    private String invoiceNumber;

    @OneToOne
    @JoinColumn(name = "order_id")
    private Order order;

    @ManyToOne
    @JoinColumn(name = "accountant_id")
    private User accountant;

    @Column(name = "issue_date")
    private LocalDateTime issueDate;

    @Column(name = "due_date")
    private LocalDateTime dueDate;

    @Column(name = "total_amount", precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "tax", precision = 10, scale = 2)
    private BigDecimal tax;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status")
    private PaymentStatus paymentStatus;

    @OneToMany(mappedBy = "invoice")
    private Set<Payment> payments = new HashSet<>();

    // Constructors
    public Invoice() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getInvoiceNumber() { return invoiceNumber; }
    public void setInvoiceNumber(String invoiceNumber) { this.invoiceNumber = invoiceNumber; }

    public Order getOrder() { return order; }
    public void setOrder(Order order) { this.order = order; }

    public User getAccountant() { return accountant; }
    public void setAccountant(User accountant) { this.accountant = accountant; }

    public LocalDateTime getIssueDate() { return issueDate; }

    public LocalDateTime getDueDate() { return dueDate; }
    public void setDueDate(LocalDateTime dueDate) { this.dueDate = dueDate; }

    public BigDecimal getTotalAmount() { return totalAmount; }

    public BigDecimal getTax() { return tax; }
    public void setTax(BigDecimal tax) { this.tax = tax; }

    public PaymentStatus getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(PaymentStatus paymentStatus) { this.paymentStatus = paymentStatus; }

    public Set<Payment> getPayments() { return payments; }

    // Additional methods
    public void addPayment(Payment payment) {
        payments.add(payment);
        payment.setInvoice(this);
    }

    public BigDecimal getRemainingAmount() {
        BigDecimal paidAmount = BigDecimal.ZERO;
        for (Payment payment : payments) {
            paidAmount = paidAmount.add(payment.getAmount());
        }
        return totalAmount.subtract(paidAmount);
    }

    // Auditing methods
    @PrePersist
    protected void onCreate() {
        this.issueDate = LocalDateTime.now();
    }
}