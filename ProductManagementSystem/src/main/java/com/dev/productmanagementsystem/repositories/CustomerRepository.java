package com.dev.productmanagementsystem.repositories;

import com.dev.productmanagementsystem.entities.Customer;
import com.dev.productmanagementsystem.enums.CustomerType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {
    // Find customer by customer number
    Optional<Customer> findByCustomerNumber(String customerNumber);

    // Find customer by email
    Optional<Customer> findByEmail(String email);

    // Find customers by name (case insensitive)
    List<Customer> findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(String firstName, String lastName);

    // Find customers by company name
    List<Customer> findByCompanyNameContainingIgnoreCase(String companyName);

    // Find customers by type
    List<Customer> findByCustomerType(CustomerType customerType);

    // Find active customers
    List<Customer> findByIsActiveTrue();

    // Find inactive customers
    List<Customer> findByIsActiveFalse();

    // Find customers by assigned sales manager
    List<Customer> findByAssignedSalesManagerId(Long salesManagerId);

    // Find customers registered between dates
    List<Customer> findByRegistrationDateBetween(LocalDateTime startDate, LocalDateTime endDate);

    // Find customers by phone number
    Optional<Customer> findByPhoneNumber(String phoneNumber);

    // Find customers by tax ID
    Optional<Customer> findByTaxId(String taxId);

    // Custom query to search customers by multiple criteria
    @Query("SELECT c FROM Customer c WHERE " +
            "(:name IS NULL OR LOWER(c.firstName) LIKE LOWER(CONCAT('%', :name, '%')) OR LOWER(c.lastName) LIKE LOWER(CONCAT('%', :name, '%')) OR LOWER(c.companyName) LIKE LOWER(CONCAT('%', :name, '%'))) AND " +
            "(:email IS NULL OR LOWER(c.email) LIKE LOWER(CONCAT('%', :email, '%'))) AND " +
            "(:customerType IS NULL OR c.customerType = :customerType) AND " +
            "(:isActive IS NULL OR c.isActive = :isActive)")
    List<Customer> findCustomersByCriteria(@Param("name") String name,
                                           @Param("email") String email,
                                           @Param("customerType") CustomerType customerType,
                                           @Param("isActive") Boolean isActive);

    // Find recent customers
    List<Customer> findTop10ByOrderByRegistrationDateDesc();

    // Count customers by type
    @Query("SELECT COUNT(c) FROM Customer c WHERE c.customerType = ?1")
    Long countByCustomerType(CustomerType customerType);

    // Find customers with orders
    @Query("SELECT DISTINCT c FROM Customer c JOIN c.orders o")
    List<Customer> findCustomersWithOrders();

    // Find customers without orders
    @Query("SELECT c FROM Customer c WHERE c.orders IS EMPTY")
    List<Customer> findCustomersWithoutOrders();
}