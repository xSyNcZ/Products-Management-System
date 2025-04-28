package com.dev.productmanagementsystem.controllers;

import com.dev.productmanagementsystem.dto.PaymentDTO;
import com.dev.productmanagementsystem.entities.Payment;
import com.dev.productmanagementsystem.entities.Invoice;
import com.dev.productmanagementsystem.enums.PaymentMethod;
import com.dev.productmanagementsystem.enums.PaymentStatus;
import com.dev.productmanagementsystem.repositories.PaymentRepository;
import com.dev.productmanagementsystem.repositories.InvoiceRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentRepository paymentRepository;
    private final InvoiceRepository invoiceRepository;

    @Autowired
    public PaymentController(PaymentRepository paymentRepository, InvoiceRepository invoiceRepository) {
        this.paymentRepository = paymentRepository;
        this.invoiceRepository = invoiceRepository;
    }

    @GetMapping
    public List<PaymentDTO> getAllPayments() {
        return paymentRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PaymentDTO> getPaymentById(@PathVariable Long id) {
        return paymentRepository.findById(id)
                .map(this::convertToDTO)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));
    }

    @GetMapping("/invoice/{invoiceId}")
    public List<PaymentDTO> getPaymentsByInvoiceId(@PathVariable Long invoiceId) {
        return paymentRepository.findByInvoiceId(invoiceId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @GetMapping("/method/{method}")
    public List<PaymentDTO> getPaymentsByMethod(@PathVariable PaymentMethod method) {
        return paymentRepository.findByMethod(method).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @GetMapping("/status/{status}")
    public List<PaymentDTO> getPaymentsByStatus(@PathVariable PaymentStatus status) {
        return paymentRepository.findByPaymentStatus(status).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @GetMapping("/transaction/{transactionId}")
    public ResponseEntity<PaymentDTO> getPaymentByTransactionId(@PathVariable String transactionId) {
        return paymentRepository.findByTransactionId(transactionId)
                .map(this::convertToDTO)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));
    }

    @GetMapping("/date-range")
    public List<PaymentDTO> getPaymentsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        return paymentRepository.findByPaymentDateBetween(startDate, endDate).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @GetMapping("/amount/greater-than/{amount}")
    public List<PaymentDTO> getPaymentsByAmountGreaterThan(@PathVariable BigDecimal amount) {
        return paymentRepository.findByAmountGreaterThan(amount).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @GetMapping("/invoice/{invoiceId}/status/{status}")
    public List<PaymentDTO> getPaymentsByInvoiceIdAndStatus(
            @PathVariable Long invoiceId, @PathVariable PaymentStatus status) {
        return paymentRepository.findByInvoiceIdAndPaymentStatus(invoiceId, status).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @GetMapping("/status/{status}/date-range")
    public List<PaymentDTO> getPaymentsByStatusAndDateRange(
            @PathVariable PaymentStatus status,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        return paymentRepository.findByPaymentStatusAndPaymentDateBetween(status, startDate, endDate).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @GetMapping("/invoice/{invoiceId}/total")
    public ResponseEntity<BigDecimal> getTotalPaymentsByInvoiceId(@PathVariable Long invoiceId) {
        BigDecimal total = paymentRepository.sumAmountByInvoiceId(invoiceId);
        return ResponseEntity.ok(total != null ? total : BigDecimal.ZERO);
    }

    @GetMapping("/method/{method}/count")
    public ResponseEntity<Long> getCountByMethod(@PathVariable PaymentMethod method) {
        Long count = paymentRepository.countByMethod(method);
        return ResponseEntity.ok(count);
    }

    @GetMapping("/customer/{customerId}")
    public List<PaymentDTO> getPaymentsByCustomerId(@PathVariable Long customerId) {
        return paymentRepository.findByCustomerId(customerId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @PostMapping
    public ResponseEntity<PaymentDTO> createPayment(@RequestBody PaymentDTO paymentDTO) {
        Payment payment = convertToEntity(paymentDTO);
        Payment savedPayment = paymentRepository.save(payment);
        return new ResponseEntity<>(convertToDTO(savedPayment), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PaymentDTO> updatePayment(@PathVariable Long id, @RequestBody PaymentDTO paymentDTO) {
        return paymentRepository.findById(id)
                .map(existingPayment -> {
                    // Update the existing payment with values from DTO
                    if (paymentDTO.getInvoiceId() != null) {
                        Invoice invoice = invoiceRepository.findById(paymentDTO.getInvoiceId())
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invoice not found"));
                        existingPayment.setInvoice(invoice);
                    }

                    if (paymentDTO.getAmount() != null) {
                        existingPayment.setAmount(paymentDTO.getAmount());
                    }

                    if (paymentDTO.getMethod() != null) {
                        existingPayment.setMethod(paymentDTO.getMethod());
                    }

                    if (paymentDTO.getPaymentDate() != null) {
                        existingPayment.setPaymentDate(paymentDTO.getPaymentDate());
                    }

                    if (paymentDTO.getTransactionId() != null) {
                        existingPayment.setTransactionId(paymentDTO.getTransactionId());
                    }

                    if (paymentDTO.getNotes() != null) {
                        existingPayment.setNotes(paymentDTO.getNotes());
                    }

                    if (paymentDTO.getPaymentStatus() != null) {
                        existingPayment.setPaymentStatus(paymentDTO.getPaymentStatus());
                    }

                    Payment updatedPayment = paymentRepository.save(existingPayment);
                    return ResponseEntity.ok(convertToDTO(updatedPayment));
                })
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePayment(@PathVariable Long id) {
        return paymentRepository.findById(id)
                .map(payment -> {
                    paymentRepository.delete(payment);
                    return new ResponseEntity<Void>(HttpStatus.NO_CONTENT);
                })
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));
    }

    // Helper methods
    private PaymentDTO convertToDTO(Payment payment) {
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

    private Payment convertToEntity(PaymentDTO dto) {
        Payment entity = new Payment();

        if (dto.getId() != null) {
            entity.setId(dto.getId());
        }

        if (dto.getInvoiceId() != null) {
            Invoice invoice = invoiceRepository.findById(dto.getInvoiceId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invoice not found"));
            entity.setInvoice(invoice);
        }

        entity.setAmount(dto.getAmount());
        entity.setMethod(dto.getMethod());
        entity.setPaymentDate(dto.getPaymentDate());
        entity.setTransactionId(dto.getTransactionId());
        entity.setNotes(dto.getNotes());
        entity.setPaymentStatus(dto.getPaymentStatus());

        return entity;
    }
}