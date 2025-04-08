package com.dev.productmanagementsystem.repository;

import com.dev.productmanagementsystem.entities.Invoice;
import com.dev.productmanagementsystem.enums.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    // Find invoice by invoice number
    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);

    // Find invoices by order id
    Optional<Invoice> findByOrderId(Long orderId);

    // Find invoices by accountant id
    List<Invoice> findByAccountantId(Long accountantId);

    // Find invoices by payment status
    List<Invoice> findByPaymentStatus(PaymentStatus paymentStatus);

    // Find invoices with due date before specified date
    List<Invoice> findByDueDateBefore(LocalDateTime date);

    // Find invoices with total amount greater than specified amount
    List<Invoice> findByTotalAmountGreaterThan(BigDecimal amount);

    // Find invoices for a specific customer using query
    @Query("SELECT i FROM Invoice i JOIN i.order o WHERE o.customer.id = ?1")
    List<Invoice> findByCustomerId(Long customerId);

    // Find overdue invoices
    @Query("SELECT i FROM Invoice i WHERE i.dueDate < CURRENT_DATE AND i.paymentStatus != 'PAID'")
    List<Invoice> findOverdueInvoices();

    // Find total invoice amount by customer id
    @Query("SELECT SUM(i.totalAmount) FROM Invoice i JOIN i.order o WHERE o.customer.id = ?1")
    BigDecimal sumTotalAmountByCustomerId(Long customerId);


}