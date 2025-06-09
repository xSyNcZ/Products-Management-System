package com.dev.productmanagementsystem.services;

import com.dev.productmanagementsystem.entities.Invoice;
import com.dev.productmanagementsystem.entities.Order;
import com.dev.productmanagementsystem.entities.Payment;
import com.dev.productmanagementsystem.entities.User;
import com.dev.productmanagementsystem.enums.PaymentStatus;
import com.dev.productmanagementsystem.repositories.InvoiceRepository;
import com.dev.productmanagementsystem.repositories.OrderRepository;
import com.dev.productmanagementsystem.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;

    @Autowired
    public InvoiceService(InvoiceRepository invoiceRepository, OrderRepository orderRepository, UserRepository userRepository) {
        this.invoiceRepository = invoiceRepository;
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
    }

    public List<Invoice> findAll() {
        return invoiceRepository.findAll();
    }

    public Optional<Invoice> findById(Long id) {
        return invoiceRepository.findById(id);
    }

    public Invoice save(Invoice invoice) {
        return invoiceRepository.save(invoice);
    }

    public void delete(Long id) {
        invoiceRepository.deleteById(id);
    }

    public Invoice generateInvoiceFromOrder(Long orderId, Long accountantId, BigDecimal tax, LocalDateTime dueDate) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        User accountant = userRepository.findById(accountantId)
                .orElseThrow(() -> new IllegalArgumentException("Accountant not found"));

        Invoice invoice = new Invoice();
        invoice.setOrder(order);
        invoice.setAccountant(accountant);
        invoice.setInvoiceNumber("INV-" + generateUniqueCode());
        invoice.setDueDate(dueDate);
        invoice.setTax(tax);
        invoice.setPaymentStatus(PaymentStatus.PENDING);

        // Calculate total amount based on order total and tax
        BigDecimal orderTotal = order.getTotalAmount();
        BigDecimal taxAmount = orderTotal.multiply(tax.divide(new BigDecimal("100")));
        BigDecimal totalAmount = orderTotal.add(taxAmount);

        return invoiceRepository.save(invoice);
    }

    public List<Invoice> findByPaymentStatus(PaymentStatus status) {
        return invoiceRepository.findByPaymentStatus(status);
    }

    public List<Invoice> findOverdueInvoices() {
        return invoiceRepository.findByDueDateBeforeAndPaymentStatusNot(
                LocalDateTime.now(), PaymentStatus.PAID);
    }

    public Optional<Invoice> findByInvoiceNumber(String invoiceNumber) {
        return invoiceRepository.findByInvoiceNumber(invoiceNumber);
    }

    public List<Invoice> findByCustomerId(Long customerId) {
        return invoiceRepository.findByOrder_Customer_Id(customerId);
    }

    public BigDecimal getInvoiceTotalAmount(Long invoiceId) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new IllegalArgumentException("Invoice not found"));

        BigDecimal orderTotal = invoice.getOrder().getTotalAmount();
        BigDecimal taxAmount = orderTotal.multiply(invoice.getTax().divide(new BigDecimal("100")));

        return orderTotal.add(taxAmount);
    }

    public List<Invoice> findByDueDateBetween(LocalDateTime startDate, LocalDateTime endDate) {
        return invoiceRepository.findByDueDateBetween(startDate, endDate);
    }

    @Transactional
    public Invoice sendInvoiceReminder(Long invoiceId) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new IllegalArgumentException("Invoice not found"));

        // Only send reminders for pending or partially paid invoices
        if (invoice.getPaymentStatus() == PaymentStatus.PAID) {
            throw new IllegalStateException("Cannot send reminder for fully paid invoice");
        }

        // Logic to send reminder (e.g., email service would be called here)
        // For now, just update the last reminder date
        invoice.setLastReminderDate(LocalDateTime.now());

        return invoiceRepository.save(invoice);
    }

    public List<Invoice> findInvoicesDueInDays(int days) {
        LocalDateTime startDate = LocalDateTime.now();
        LocalDateTime endDate = LocalDateTime.now().plusDays(days);

        return invoiceRepository.findByDueDateBetweenAndPaymentStatusNot(
                startDate, endDate, PaymentStatus.PAID);
    }

    public BigDecimal calculateRevenue(LocalDateTime startDate, LocalDateTime endDate) {
        List<Invoice> paidInvoices = invoiceRepository.findByPaymentStatusAndDueDateBetween(
                PaymentStatus.PAID, startDate, endDate);

        return paidInvoices.stream()
                .map(this::getInvoiceTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public BigDecimal calculateRemainingAmount(Long invoiceId) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new IllegalArgumentException("Invoice not found"));

        BigDecimal totalAmount = getInvoiceTotalAmount(invoiceId);
        BigDecimal paidAmount = invoice.getPayments().stream()
                .filter(payment -> payment.getPaymentStatus() == PaymentStatus.COMPLETED)
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return totalAmount.subtract(paidAmount);
    }

    private BigDecimal getInvoiceTotalAmount(Invoice invoice) {
        BigDecimal orderTotal = invoice.getOrder().getTotalAmount();
        BigDecimal taxAmount = orderTotal.multiply(invoice.getTax().divide(new BigDecimal("100")));

        return orderTotal.add(taxAmount);
    }

    public Invoice updatePaymentStatus(Long invoiceId, PaymentStatus status) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new IllegalArgumentException("Invoice not found"));
        invoice.setPaymentStatus(status);
        return invoiceRepository.save(invoice);
    }

    private String generateUniqueCode() {
        return UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
}
