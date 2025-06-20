package com.dev.productmanagementsystem.dto;

import com.dev.productmanagementsystem.enums.CustomerType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class CustomerDTO {
    private Long id;
    private String customerNumber;

    @NotBlank(message = "First name is required")
    private String firstName;

    @NotBlank(message = "Last name is required")
    private String lastName;

    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    private String email;

    private String phoneNumber;
    private String companyName;
    private String taxId;
    private LocalDateTime registrationDate;
    private Boolean isActive = true;

    @NotNull(message = "Customer type is required")
    private CustomerType customerType = CustomerType.INDIVIDUAL;

    private BigDecimal creditLimit;
    private String paymentTerms;
    private String notes;

    // Related entity IDs
    private Long addressId;
    private Long assignedSalesManagerId;

    // Display fields
    private String assignedSalesManagerName;
    private AddressDTO address;

    // Constructors
    public CustomerDTO() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCustomerNumber() { return customerNumber; }
    public void setCustomerNumber(String customerNumber) { this.customerNumber = customerNumber; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }

    public String getTaxId() { return taxId; }
    public void setTaxId(String taxId) { this.taxId = taxId; }

    public LocalDateTime getRegistrationDate() { return registrationDate; }
    public void setRegistrationDate(LocalDateTime registrationDate) { this.registrationDate = registrationDate; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public CustomerType getCustomerType() { return customerType; }
    public void setCustomerType(CustomerType customerType) { this.customerType = customerType; }

    public BigDecimal getCreditLimit() { return creditLimit; }
    public void setCreditLimit(BigDecimal creditLimit) { this.creditLimit = creditLimit; }

    public String getPaymentTerms() { return paymentTerms; }
    public void setPaymentTerms(String paymentTerms) { this.paymentTerms = paymentTerms; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public Long getAddressId() { return addressId; }
    public void setAddressId(Long addressId) { this.addressId = addressId; }

    public Long getAssignedSalesManagerId() { return assignedSalesManagerId; }
    public void setAssignedSalesManagerId(Long assignedSalesManagerId) { this.assignedSalesManagerId = assignedSalesManagerId; }

    public String getAssignedSalesManagerName() { return assignedSalesManagerName; }
    public void setAssignedSalesManagerName(String assignedSalesManagerName) { this.assignedSalesManagerName = assignedSalesManagerName; }

    public AddressDTO getAddress() { return address; }
    public void setAddress(AddressDTO address) { this.address = address; }

    // Utility methods
    public String getFullName() {
        return firstName + " " + lastName;
    }

    public String getDisplayName() {
        if (customerType == CustomerType.BUSINESS && companyName != null && !companyName.trim().isEmpty()) {
            return companyName;
        }
        return getFullName();
    }
}