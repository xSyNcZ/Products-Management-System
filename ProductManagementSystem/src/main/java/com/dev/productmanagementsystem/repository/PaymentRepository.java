package com.dev.productmanagementsystem.repository;

import com.dev.productmanagementsystem.entities.Payment;
import com.dev.productmanagementsystem.enums.PaymentMethod;
import com.dev.productmanagementsystem.enums.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    // Find payments by invoice id
    List<Payment> findByInvoiceId(Long invoiceId);

    // Find payments by method
    List<Payment> findByMethod(PaymentMethod method);

    // Find payments by status
    List<Payment> findByPaymentStatus(PaymentStatus status);

    // Find payments by transaction id
    Optional<Payment> findByTransactionId(String transactionId);

    // Find payments by date range
    List<Payment> findByPaymentDateBetween(LocalDateTime startDate, LocalDateTime endDate);

    // Find payments by amount greater than
    List<Payment> findByAmountGreaterThan(BigDecimal amount);

    // Sum total payments for an invoice
    @Query("SELECT SUM(p.amount) FROM Payment p WHERE p.invoice.id = ?1")
    BigDecimal sumAmountByInvoiceId(Long invoiceId);

    // Count payments by method
    @Query("SELECT COUNT(p) FROM Payment p WHERE p.method = ?1")
    Long countByMethod(PaymentMethod method);

    // Find payments for a specific customer
    @Query("SELECT p FROM Payment p JOIN p.invoice i JOIN i.order o WHERE o.customer.id = ?1")
    List<Payment> findByCustomerId(Long customerId);
}