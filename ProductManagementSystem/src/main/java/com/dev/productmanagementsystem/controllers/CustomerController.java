package com.dev.productmanagementsystem.controllers;

import com.dev.productmanagementsystem.dto.CustomerDTO;
import com.dev.productmanagementsystem.enums.CustomerType;
import com.dev.productmanagementsystem.services.CustomerService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customers")
@CrossOrigin(origins = "*")
public class CustomerController {

    private final CustomerService customerService;

    @Autowired
    public CustomerController(CustomerService customerService) {
        this.customerService = customerService;
    }

    /**
     * Get all customers
     */
    @GetMapping
    public ResponseEntity<List<CustomerDTO>> getAllCustomers() {
        List<CustomerDTO> customers = customerService.getAllCustomers();
        return ResponseEntity.ok(customers);
    }

    /**
     * Get all active customers
     */
    @GetMapping("/active")
    public ResponseEntity<List<CustomerDTO>> getActiveCustomers() {
        List<CustomerDTO> customers = customerService.getActiveCustomers();
        return ResponseEntity.ok(customers);
    }

    /**
     * Get customer by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<CustomerDTO> getCustomerById(@PathVariable Long id) {
        CustomerDTO customer = customerService.getCustomerById(id);
        return ResponseEntity.ok(customer);
    }

    /**
     * Get customer by customer number
     */
    @GetMapping("/number/{customerNumber}")
    public ResponseEntity<CustomerDTO> getCustomerByNumber(@PathVariable String customerNumber) {
        CustomerDTO customer = customerService.getCustomerByNumber(customerNumber);
        return ResponseEntity.ok(customer);
    }

    /**
     * Get customer by email
     */
    @GetMapping("/email/{email}")
    public ResponseEntity<CustomerDTO> getCustomerByEmail(@PathVariable String email) {
        CustomerDTO customer = customerService.getCustomerByEmail(email);
        return ResponseEntity.ok(customer);
    }

    /**
     * Get customers by type
     */
    @GetMapping("/type/{customerType}")
    public ResponseEntity<List<CustomerDTO>> getCustomersByType(@PathVariable CustomerType customerType) {
        List<CustomerDTO> customers = customerService.getCustomersByType(customerType);
        return ResponseEntity.ok(customers);
    }

    /**
     * Get customers by sales manager
     */
    @GetMapping("/sales-manager/{salesManagerId}")
    public ResponseEntity<List<CustomerDTO>> getCustomersBySalesManager(@PathVariable Long salesManagerId) {
        List<CustomerDTO> customers = customerService.getCustomersBySalesManager(salesManagerId);
        return ResponseEntity.ok(customers);
    }

    /**
     * Search customers by criteria
     */
    @GetMapping("/search")
    public ResponseEntity<List<CustomerDTO>> searchCustomers(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) CustomerType customerType,
            @RequestParam(required = false) Boolean isActive) {
        List<CustomerDTO> customers = customerService.searchCustomers(name, email, customerType, isActive);
        return ResponseEntity.ok(customers);
    }

    /**
     * Get recent customers (top 10)
     */
    @GetMapping("/recent")
    public ResponseEntity<List<CustomerDTO>> getRecentCustomers() {
        List<CustomerDTO> customers = customerService.getRecentCustomers();
        return ResponseEntity.ok(customers);
    }

    /**
     * Get customers with orders
     */
    @GetMapping("/with-orders")
    public ResponseEntity<List<CustomerDTO>> getCustomersWithOrders() {
        List<CustomerDTO> customers = customerService.getCustomersWithOrders();
        return ResponseEntity.ok(customers);
    }

    /**
     * Get customers without orders
     */
    @GetMapping("/without-orders")
    public ResponseEntity<List<CustomerDTO>> getCustomersWithoutOrders() {
        List<CustomerDTO> customers = customerService.getCustomersWithoutOrders();
        return ResponseEntity.ok(customers);
    }

    /**
     * Create a new customer
     */
    @PostMapping
    public ResponseEntity<CustomerDTO> createCustomer(@Valid @RequestBody CustomerDTO customerDTO) {
        CustomerDTO createdCustomer = customerService.createCustomer(customerDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdCustomer);
    }

    /**
     * Update an existing customer
     */
    @PutMapping("/{id}")
    public ResponseEntity<CustomerDTO> updateCustomer(@PathVariable Long id,
                                                      @Valid @RequestBody CustomerDTO customerDTO) {
        CustomerDTO updatedCustomer = customerService.updateCustomer(id, customerDTO);
        return ResponseEntity.ok(updatedCustomer);
    }

    /**
     * Activate a customer
     */
    @PatchMapping("/{id}/activate")
    public ResponseEntity<CustomerDTO> activateCustomer(@PathVariable Long id) {
        CustomerDTO activatedCustomer = customerService.activateCustomer(id);
        return ResponseEntity.ok(activatedCustomer);
    }

    /**
     * Deactivate a customer
     */
    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<CustomerDTO> deactivateCustomer(@PathVariable Long id) {
        CustomerDTO deactivatedCustomer = customerService.deactivateCustomer(id);
        return ResponseEntity.ok(deactivatedCustomer);
    }

    /**
     * Assign sales manager to customer
     */
    @PatchMapping("/{customerId}/assign-sales-manager/{salesManagerId}")
    public ResponseEntity<CustomerDTO> assignSalesManager(@PathVariable Long customerId,
                                                          @PathVariable Long salesManagerId) {
        CustomerDTO updatedCustomer = customerService.assignSalesManager(customerId, salesManagerId);
        return ResponseEntity.ok(updatedCustomer);
    }

    /**
     * Delete a customer
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCustomer(@PathVariable Long id) {
        customerService.deleteCustomer(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Get customer count by type
     */
    @GetMapping("/count/type/{customerType}")
    public ResponseEntity<Long> getCustomerCountByType(@PathVariable CustomerType customerType) {
        Long count = customerService.getCustomerCountByType(customerType);
        return ResponseEntity.ok(count);
    }

    /**
     * Get customer statistics
     */
    @GetMapping("/statistics")
    public ResponseEntity<CustomerStatistics> getCustomerStatistics() {
        CustomerStatistics stats = new CustomerStatistics();
        stats.setTotalCustomers(customerService.getAllCustomers().size());
        stats.setActiveCustomers(customerService.getActiveCustomers().size());
        stats.setIndividualCustomers(customerService.getCustomerCountByType(CustomerType.INDIVIDUAL));
        stats.setBusinessCustomers(customerService.getCustomerCountByType(CustomerType.BUSINESS));
        stats.setGovernmentCustomers(customerService.getCustomerCountByType(CustomerType.GOVERNMENT));
        stats.setNonProfitCustomers(customerService.getCustomerCountByType(CustomerType.NON_PROFIT));
        stats.setCustomersWithOrders(customerService.getCustomersWithOrders().size());
        stats.setCustomersWithoutOrders(customerService.getCustomersWithoutOrders().size());

        return ResponseEntity.ok(stats);
    }

    /**
     * Inner class for customer statistics
     */
    public static class CustomerStatistics {
        private int totalCustomers;
        private int activeCustomers;
        private long individualCustomers;
        private long businessCustomers;
        private long governmentCustomers;
        private long nonProfitCustomers;
        private int customersWithOrders;
        private int customersWithoutOrders;

        // Constructors
        public CustomerStatistics() {}

        // Getters and Setters
        public int getTotalCustomers() { return totalCustomers; }
        public void setTotalCustomers(int totalCustomers) { this.totalCustomers = totalCustomers; }

        public int getActiveCustomers() { return activeCustomers; }
        public void setActiveCustomers(int activeCustomers) { this.activeCustomers = activeCustomers; }

        public long getIndividualCustomers() { return individualCustomers; }
        public void setIndividualCustomers(long individualCustomers) { this.individualCustomers = individualCustomers; }

        public long getBusinessCustomers() { return businessCustomers; }
        public void setBusinessCustomers(long businessCustomers) { this.businessCustomers = businessCustomers; }

        public long getGovernmentCustomers() { return governmentCustomers; }
        public void setGovernmentCustomers(long governmentCustomers) { this.governmentCustomers = governmentCustomers; }

        public long getNonProfitCustomers() { return nonProfitCustomers; }
        public void setNonProfitCustomers(long nonProfitCustomers) { this.nonProfitCustomers = nonProfitCustomers; }

        public int getCustomersWithOrders() { return customersWithOrders; }
        public void setCustomersWithOrders(int customersWithOrders) { this.customersWithOrders = customersWithOrders; }

        public int getCustomersWithoutOrders() { return customersWithoutOrders; }
        public void setCustomersWithoutOrders(int customersWithoutOrders) { this.customersWithoutOrders = customersWithoutOrders; }
    }
}