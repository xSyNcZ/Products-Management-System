package com.dev.productmanagementsystem.repositories;

import com.dev.productmanagementsystem.entities.Customer;
import com.dev.productmanagementsystem.enums.CustomerType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {

    // Find customer by tax ID
    Optional<Customer> findByTaxId(String taxId);

    // Check if a different customer has the same tax ID
    boolean existsByTaxIdAndIdNot(String taxId, Long id);

    // Find top 10 recent customers
    List<Customer> findTop10ByOrderByRegistrationDateDesc();

    // Flexible search method
    @Query("""
        SELECT c FROM Customer c
        WHERE
          (:name IS NULL OR
             LOWER(CONCAT(c.firstName,' ',c.lastName)) LIKE LOWER(CONCAT('%', :name, '%')) OR
             LOWER(c.companyName) LIKE LOWER(CONCAT('%', :name, '%')))
        AND (:email IS NULL OR LOWER(c.email) = LOWER(:email))
        AND (:customerType IS NULL OR c.customerType = :customerType)
        AND (:isActive IS NULL OR c.isActive = :isActive)
    """)
    List<Customer> findCustomersByCriteria(@Param("name") String name,
                                           @Param("email") String email,
                                           @Param("customerType") CustomerType customerType,
                                           @Param("isActive") Boolean isActive);

    // Existing methods
    Optional<Customer> findByCustomerNumber(String customerNumber);
    Optional<Customer> findByEmail(String email);
    List<Customer> findByIsActiveTrue();
    List<Customer> findByCustomerType(CustomerType customerType);
    List<Customer> findByAssignedSalesManagerId(Long salesManagerId);
    List<Customer> findByRegistrationDateBetween(LocalDateTime startDate, LocalDateTime endDate);
    @Query("SELECT c FROM Customer c WHERE " +
            "LOWER(CONCAT(c.firstName, ' ', c.lastName)) LIKE LOWER(CONCAT('%', :name, '%')) OR " +
            "LOWER(c.companyName) LIKE LOWER(CONCAT('%', :name, '%'))")
    List<Customer> findByNameContainingIgnoreCase(@Param("name") String name);
    @Query("SELECT DISTINCT c FROM Customer c JOIN c.orders o")
    List<Customer> findCustomersWithOrders();
    @Query("SELECT c FROM Customer c WHERE c.orders IS EMPTY")
    List<Customer> findCustomersWithoutOrders();
    long countByCustomerType(CustomerType customerType);
    @Query("SELECT c FROM Customer c WHERE c.creditLimit > :amount")
    List<Customer> findCustomersWithCreditLimitGreaterThan(@Param("amount") BigDecimal amount);
    List<Customer> findByCompanyNameContainingIgnoreCase(String companyName);
    Optional<Customer> findByPhoneNumber(String phoneNumber);
    boolean existsByCustomerNumber(String customerNumber);
    boolean existsByEmail(String email);
}
