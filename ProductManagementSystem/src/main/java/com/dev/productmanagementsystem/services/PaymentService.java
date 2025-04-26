package com.dev.productmanagementsystem.services;

import com.dev.productmanagementsystem.entities.Invoice;
import com.dev.productmanagementsystem.entities.Payment;
import com.dev.productmanagementsystem.enums.PaymentMethod;
import com.dev.productmanagementsystem.enums.PaymentStatus;
import com.dev.productmanagementsystem.repositories.InvoiceRepository;
import com.dev.productmanagementsystem.repositories.PaymentRepository;
import com.dev.productmanagementsystem.exceptions.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final InvoiceRepository invoiceRepository;

    @Autowired
    public PaymentService(PaymentRepository paymentRepository, InvoiceRepository invoiceRepository) {
        this.paymentRepository = paymentRepository;
        this.invoiceRepository = invoiceRepository;
    }

    public List<Payment> getAllPayments() {
        return paymentRepository.findAll();
    }

    public Payment getPaymentById(Long id) {
        return paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with id: " + id));
    }

    public List<Payment> getPaymentsByInvoiceId(Long invoiceId) {
        return paymentRepository.findByInvoiceId(invoiceId);
    }

    @Transactional
    public Payment createPayment(Long invoiceId, BigDecimal amount, PaymentMethod method, String notes) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with id: " + invoiceId));

        // Validate payment amount
        BigDecimal remainingAmount = invoice.getRemainingAmount();
        if (amount.compareTo(remainingAmount) > 0) {
            throw new IllegalArgumentException("Payment amount exceeds the remaining invoice amount");
        }

        Payment payment = new Payment();
        payment.setInvoice(invoice);
        payment.setAmount(amount);
        payment.setMethod(method);
        payment.setTransactionId(generateTransactionId());
        payment.setNotes(notes);
        payment.setPaymentStatus(PaymentStatus.COMPLETED);

        Payment savedPayment = paymentRepository.save(payment);

        // Update invoice payment status
        updateInvoicePaymentStatus(invoice);

        return savedPayment;
    }

    @Transactional
    public Payment updatePayment(Long id, PaymentStatus status, String notes) {
        Payment payment = getPaymentById(id);
        payment.setPaymentStatus(status);

        if (notes != null) {
            payment.setNotes(notes);
        }

        Payment updatedPayment = paymentRepository.save(payment);

        // Update invoice payment status
        updateInvoicePaymentStatus(updatedPayment.getInvoice());

        return updatedPayment;
    }

    @Transactional
    public void deletePayment(Long id) {
        Payment payment = getPaymentById(id);
        Invoice invoice = payment.getInvoice();

        paymentRepository.deleteById(id);

        // Update invoice payment status
        updateInvoicePaymentStatus(invoice);
    }

    private void updateInvoicePaymentStatus(Invoice invoice) {
        BigDecimal remainingAmount = invoice.getRemainingAmount();

        if (remainingAmount.compareTo(BigDecimal.ZERO) == 0) {
            invoice.setPaymentStatus(PaymentStatus.PAID);
        } else if (remainingAmount.compareTo(invoice.getTotalAmount()) < 0) {
            invoice.setPaymentStatus(PaymentStatus.PARTIALLY_PAID);
        } else {
            invoice.setPaymentStatus(PaymentStatus.PENDING);
        }

        invoiceRepository.save(invoice);
    }

    private String generateTransactionId() {
        return "TXN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
}