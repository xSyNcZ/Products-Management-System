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
@CrossOrigin(origins = "*") // Add this if you need CORS support
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
        try {
            return paymentRepository.findAll().stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            System.err.println("Error in getAllPayments: " + e.getMessage());
            e.printStackTrace();
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to retrieve payments");
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<PaymentDTO> getPaymentById(@PathVariable Long id) {
        try {
            return paymentRepository.findById(id)
                    .map(this::convertToDTO)
                    .map(ResponseEntity::ok)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            System.err.println("Error in getPaymentById: " + e.getMessage());
            e.printStackTrace();
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to retrieve payment");
        }
    }

    @GetMapping("/invoice/{invoiceId}")
    public List<PaymentDTO> getPaymentsByInvoiceId(@PathVariable Long invoiceId) {
        try {
            return paymentRepository.findByInvoiceId(invoiceId).stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            System.err.println("Error in getPaymentsByInvoiceId: " + e.getMessage());
            e.printStackTrace();
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to retrieve payments by invoice");
        }
    }

    @GetMapping("/method/{method}")
    public List<PaymentDTO> getPaymentsByMethod(@PathVariable PaymentMethod method) {
        try {
            return paymentRepository.findByMethod(method).stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            System.err.println("Error in getPaymentsByMethod: " + e.getMessage());
            e.printStackTrace();
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to retrieve payments by method");
        }
    }

    @GetMapping("/status/{status}")
    public List<PaymentDTO> getPaymentsByStatus(@PathVariable PaymentStatus status) {
        try {
            return paymentRepository.findByPaymentStatus(status).stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            System.err.println("Error in getPaymentsByStatus: " + e.getMessage());
            e.printStackTrace();
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to retrieve payments by status");
        }
    }

    @GetMapping("/transaction/{transactionId}")
    public ResponseEntity<PaymentDTO> getPaymentByTransactionId(@PathVariable String transactionId) {
        try {
            return paymentRepository.findByTransactionId(transactionId)
                    .map(this::convertToDTO)
                    .map(ResponseEntity::ok)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            System.err.println("Error in getPaymentByTransactionId: " + e.getMessage());
            e.printStackTrace();
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to retrieve payment by transaction ID");
        }
    }

    @PostMapping
    public ResponseEntity<PaymentDTO> createPayment(@RequestBody PaymentDTO paymentDTO) {
        try {
            Payment payment = convertToEntity(paymentDTO);
            Payment savedPayment = paymentRepository.save(payment);
            return new ResponseEntity<>(convertToDTO(savedPayment), HttpStatus.CREATED);
        } catch (Exception e) {
            System.err.println("Error in createPayment: " + e.getMessage());
            e.printStackTrace();
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to create payment: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<PaymentDTO> updatePayment(@PathVariable Long id, @RequestBody PaymentDTO paymentDTO) {
        try {
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
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            System.err.println("Error in updatePayment: " + e.getMessage());
            e.printStackTrace();
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to update payment: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePayment(@PathVariable Long id) {
        try {
            return paymentRepository.findById(id)
                    .map(payment -> {
                        paymentRepository.delete(payment);
                        return new ResponseEntity<Void>(HttpStatus.NO_CONTENT);
                    })
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            System.err.println("Error in deletePayment: " + e.getMessage());
            e.printStackTrace();
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to delete payment");
        }
    }

    // Helper methods with null safety
    private PaymentDTO convertToDTO(Payment payment) {
        if (payment == null) {
            return null;
        }

        PaymentDTO dto = new PaymentDTO();
        dto.setId(payment.getId());

        // Null-safe invoice ID extraction
        if (payment.getInvoice() != null) {
            dto.setInvoiceId(payment.getInvoice().getId());
        }

        dto.setAmount(payment.getAmount());
        dto.setMethod(payment.getMethod());
        dto.setPaymentDate(payment.getPaymentDate());
        dto.setTransactionId(payment.getTransactionId());
        dto.setNotes(payment.getNotes());
        dto.setPaymentStatus(payment.getPaymentStatus());

        return dto;
    }

    private Payment convertToEntity(PaymentDTO dto) {
        if (dto == null) {
            throw new IllegalArgumentException("PaymentDTO cannot be null");
        }

        Payment entity = new Payment();

        if (dto.getId() != null) {
            entity.setId(dto.getId());
        }

        // Only set invoice if invoiceId is provided and valid
        if (dto.getInvoiceId() != null) {
            Invoice invoice = invoiceRepository.findById(dto.getInvoiceId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invoice not found with ID: " + dto.getInvoiceId()));
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