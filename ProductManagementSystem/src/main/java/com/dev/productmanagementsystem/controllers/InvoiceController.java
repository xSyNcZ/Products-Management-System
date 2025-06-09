package com.dev.productmanagementsystem.controllers;

import com.dev.productmanagementsystem.dto.InvoiceDTO;
import com.dev.productmanagementsystem.dto.PaymentDTO;
import com.dev.productmanagementsystem.entities.Invoice;
import com.dev.productmanagementsystem.entities.Order;
import com.dev.productmanagementsystem.entities.Payment;
import com.dev.productmanagementsystem.entities.User;
import com.dev.productmanagementsystem.enums.PaymentStatus;
import com.dev.productmanagementsystem.repositories.InvoiceRepository;
import com.dev.productmanagementsystem.repositories.OrderRepository;
import com.dev.productmanagementsystem.repositories.PaymentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/invoices")
public class InvoiceController {

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @GetMapping
    public ResponseEntity<List<InvoiceDTO>> getAllInvoices() {
        List<Invoice> invoices = invoiceRepository.findAll();
        List<InvoiceDTO> invoiceDTOs = invoices.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(invoiceDTOs);
    }

    @GetMapping("/{id}")
    public ResponseEntity<InvoiceDTO> getInvoiceById(@PathVariable Long id) {
        Optional<Invoice> invoiceOptional = invoiceRepository.findById(id);
        return invoiceOptional.map(invoice -> ResponseEntity.ok(convertToDTO(invoice)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/number/{invoiceNumber}")
    public ResponseEntity<InvoiceDTO> getInvoiceByNumber(@PathVariable String invoiceNumber) {
        Optional<Invoice> invoiceOptional = invoiceRepository.findByInvoiceNumber(invoiceNumber);
        return invoiceOptional.map(invoice -> ResponseEntity.ok(convertToDTO(invoice)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/order/{orderId}")
    public ResponseEntity<InvoiceDTO> getInvoiceByOrderId(@PathVariable Long orderId) {
        Optional<Invoice> invoiceOptional = invoiceRepository.findByOrderId(orderId);
        return invoiceOptional.map(invoice -> ResponseEntity.ok(convertToDTO(invoice)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/accountant/{accountantId}")
    public ResponseEntity<List<InvoiceDTO>> getInvoicesByAccountantId(@PathVariable Long accountantId) {
        List<Invoice> invoices = invoiceRepository.findByAccountantId(accountantId);
        List<InvoiceDTO> invoiceDTOs = invoices.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(invoiceDTOs);
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<InvoiceDTO>> getInvoicesByCustomerId(@PathVariable Long customerId) {
        List<Invoice> invoices = invoiceRepository.findByCustomerId(customerId);
        List<InvoiceDTO> invoiceDTOs = invoices.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(invoiceDTOs);
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<InvoiceDTO>> getInvoicesByStatus(@PathVariable PaymentStatus status) {
        List<Invoice> invoices = invoiceRepository.findByPaymentStatus(status);
        List<InvoiceDTO> invoiceDTOs = invoices.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(invoiceDTOs);
    }

    @GetMapping("/overdue")
    public ResponseEntity<List<InvoiceDTO>> getOverdueInvoices() {
        List<Invoice> invoices = invoiceRepository.findOverdueInvoices();
        List<InvoiceDTO> invoiceDTOs = invoices.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(invoiceDTOs);
    }

    @GetMapping("/due-date-range")
    public ResponseEntity<List<InvoiceDTO>> getInvoicesByDueDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        List<Invoice> invoices = invoiceRepository.findByDueDateBetween(start, end);
        List<InvoiceDTO> invoiceDTOs = invoices.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(invoiceDTOs);
    }

    @GetMapping("/total/{customerId}")
    public ResponseEntity<BigDecimal> getTotalInvoiceAmountByCustomer(@PathVariable Long customerId) {
        BigDecimal totalAmount = invoiceRepository.sumTotalAmountByCustomerId(customerId);
        return ResponseEntity.ok(totalAmount);
    }

    @PostMapping
    public ResponseEntity<InvoiceDTO> createInvoice(@RequestBody InvoiceDTO invoiceDTO) {
        Invoice invoice = new Invoice();

        // Set basic invoice properties
        invoice.setInvoiceNumber(invoiceDTO.getInvoiceNumber());
        invoice.setDueDate(invoiceDTO.getDueDate());
        invoice.setTax(invoiceDTO.getTax());
        invoice.setPaymentStatus(invoiceDTO.getPaymentStatus());

        // Set relationships
        if (invoiceDTO.getOrderId() != null) {
            Optional<Order> orderOptional = orderRepository.findById(invoiceDTO.getOrderId());
            if (orderOptional.isPresent()) {
                Order order = orderOptional.get();
                invoice.setOrder(order);

                // Calculate total amount with tax
                BigDecimal orderTotal = order.getTotalAmount();
                BigDecimal taxAmount = orderTotal.multiply(invoice.getTax().divide(new BigDecimal("100")));
                // Use the method from Invoice entity to set the total amount
                invoice.setTotalAmount(orderTotal.add(taxAmount));
            } else {
                return ResponseEntity.badRequest().build();
            }
        }

        Invoice savedInvoice = invoiceRepository.save(invoice);
        return new ResponseEntity<>(convertToDTO(savedInvoice), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<InvoiceDTO> updateInvoice(@PathVariable Long id, @RequestBody InvoiceDTO invoiceDTO) {
        if (!invoiceRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        Optional<Invoice> existingInvoiceOpt = invoiceRepository.findById(id);
        if (existingInvoiceOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Invoice invoice = existingInvoiceOpt.get();
        invoice.setInvoiceNumber(invoiceDTO.getInvoiceNumber());
        invoice.setDueDate(invoiceDTO.getDueDate());
        invoice.setTax(invoiceDTO.getTax());
        invoice.setPaymentStatus(invoiceDTO.getPaymentStatus());

        // Update order if provided
        if (invoiceDTO.getOrderId() != null &&
                (invoice.getOrder() == null || !invoice.getOrder().getId().equals(invoiceDTO.getOrderId()))) {
            Optional<Order> orderOptional = orderRepository.findById(invoiceDTO.getOrderId());
            if (orderOptional.isPresent()) {
                Order order = orderOptional.get();
                invoice.setOrder(order);

                // Recalculate total amount with tax
                BigDecimal orderTotal = order.getTotalAmount();
                BigDecimal taxAmount = orderTotal.multiply(invoice.getTax().divide(new BigDecimal("100")));
                invoice.setTotalAmount(orderTotal.add(taxAmount));
            }
        } else if (invoice.getOrder() != null) {
            // Recalculate total with current order and tax
            BigDecimal orderTotal = invoice.getOrder().getTotalAmount();
            BigDecimal taxAmount = orderTotal.multiply(invoice.getTax().divide(new BigDecimal("100")));
            invoice.setTotalAmount(orderTotal.add(taxAmount));
        }

        Invoice updatedInvoice = invoiceRepository.save(invoice);
        return ResponseEntity.ok(convertToDTO(updatedInvoice));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteInvoice(@PathVariable Long id) {
        if (!invoiceRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        invoiceRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private InvoiceDTO convertToDTO(Invoice invoice) {
        InvoiceDTO dto = new InvoiceDTO();
        dto.setId(invoice.getId());
        dto.setInvoiceNumber(invoice.getInvoiceNumber());

        if (invoice.getOrder() != null) {
            dto.setOrderId(invoice.getOrder().getId());
        }

        if (invoice.getAccountant() != null) {
            dto.setAccountantId(invoice.getAccountant().getId());
        }

        dto.setIssueDate(invoice.getIssueDate());
        dto.setDueDate(invoice.getDueDate());
        dto.setTotalAmount(invoice.getTotalAmount());
        dto.setTax(invoice.getTax());
        dto.setPaymentStatus(invoice.getPaymentStatus());

        // Convert payments if they exist
        if (invoice.getPayments() != null && !invoice.getPayments().isEmpty()) {
            dto.setPayments(invoice.getPayments().stream()
                    .map(this::convertPaymentToDTO)
                    .collect(Collectors.toList()));
        }

        return dto;
    }

    private PaymentDTO convertPaymentToDTO(Payment payment) {
        PaymentDTO dto = new PaymentDTO();
        dto.setId(payment.getId());
        dto.setInvoiceId(payment.getInvoice().getId());
        dto.setAmount(payment.getAmount());
        dto.setMethod(payment.getMethod());
        dto.setPaymentDate(payment.getPaymentDate());
        dto.setTransactionId(payment.getTransactionId());
        dto.setNotes(payment.getNotes());
        dto.setPaymentStatus(payment.getPaymentStatus());
        return dto;
    }
}