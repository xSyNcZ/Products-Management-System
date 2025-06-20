package com.dev.productmanagementsystem.services;

import com.dev.productmanagementsystem.dto.AddressDTO;
import com.dev.productmanagementsystem.dto.CustomerDTO;
import com.dev.productmanagementsystem.entities.Address;
import com.dev.productmanagementsystem.entities.Customer;
import com.dev.productmanagementsystem.enums.CustomerType;
import com.dev.productmanagementsystem.entities.User;
import com.dev.productmanagementsystem.exceptions.ResourceNotFoundException;
import com.dev.productmanagementsystem.repositories.AddressRepository;
import com.dev.productmanagementsystem.repositories.CustomerRepository;
import com.dev.productmanagementsystem.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final AddressRepository addressRepository;
    private final UserRepository userRepository;

    @Autowired
    public CustomerService(CustomerRepository customerRepository,
                           AddressRepository addressRepository,
                           UserRepository userRepository) {
        this.customerRepository = customerRepository;
        this.addressRepository = addressRepository;
        this.userRepository = userRepository;
    }

    public List<CustomerDTO> getAllCustomers() {
        return customerRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<CustomerDTO> getActiveCustomers() {
        return customerRepository.findByIsActiveTrue().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public CustomerDTO getCustomerById(Long id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + id));
        return convertToDTO(customer);
    }

    public CustomerDTO getCustomerByNumber(String customerNumber) {
        Customer customer = customerRepository.findByCustomerNumber(customerNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with number: " + customerNumber));
        return convertToDTO(customer);
    }

    public CustomerDTO getCustomerByEmail(String email) {
        Customer customer = customerRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with email: " + email));
        return convertToDTO(customer);
    }

    public List<CustomerDTO> getCustomersByType(CustomerType customerType) {
        return customerRepository.findByCustomerType(customerType).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<CustomerDTO> getCustomersBySalesManager(Long salesManagerId) {
        return customerRepository.findByAssignedSalesManagerId(salesManagerId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<CustomerDTO> searchCustomers(String name, String email, CustomerType customerType, Boolean isActive) {
        return customerRepository.findCustomersByCriteria(name, email, customerType, isActive).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<CustomerDTO> getRecentCustomers() {
        return customerRepository.findTop10ByOrderByRegistrationDateDesc().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<CustomerDTO> getCustomersWithOrders() {
        return customerRepository.findCustomersWithOrders().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<CustomerDTO> getCustomersWithoutOrders() {
        return customerRepository.findCustomersWithoutOrders().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public CustomerDTO createCustomer(CustomerDTO customerDTO) {
        // Validate unique constraints
        validateUniqueFields(customerDTO, null);

        Customer customer = convertToEntity(customerDTO);

        // Set assigned sales manager if provided
        if (customerDTO.getAssignedSalesManagerId() != null) {
            User salesManager = userRepository.findById(customerDTO.getAssignedSalesManagerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Sales manager not found with id: " + customerDTO.getAssignedSalesManagerId()));
            customer.setAssignedSalesManager(salesManager);
        }

        // Handle address if provided
        if (customerDTO.getAddress() != null) {
            Address address = convertAddressDTOToEntity(customerDTO.getAddress());
            address = addressRepository.save(address);
            customer.setAddress(address);
        }

        Customer savedCustomer = customerRepository.save(customer);
        return convertToDTO(savedCustomer);
    }

    @Transactional
    public CustomerDTO updateCustomer(Long id, CustomerDTO customerDTO) {
        Customer existingCustomer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + id));

        // Validate unique constraints
        validateUniqueFields(customerDTO, id);

        // Update fields
        existingCustomer.setFirstName(customerDTO.getFirstName());
        existingCustomer.setLastName(customerDTO.getLastName());
        existingCustomer.setEmail(customerDTO.getEmail());
        existingCustomer.setPhoneNumber(customerDTO.getPhoneNumber());
        existingCustomer.setCompanyName(customerDTO.getCompanyName());
        existingCustomer.setTaxId(customerDTO.getTaxId());
        existingCustomer.setIsActive(customerDTO.getIsActive());
        existingCustomer.setCustomerType(customerDTO.getCustomerType());
        existingCustomer.setCreditLimit(customerDTO.getCreditLimit());
        existingCustomer.setPaymentTerms(customerDTO.getPaymentTerms());
        existingCustomer.setNotes(customerDTO.getNotes());

        // Update assigned sales manager
        if (customerDTO.getAssignedSalesManagerId() != null) {
            User salesManager = userRepository.findById(customerDTO.getAssignedSalesManagerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Sales manager not found with id: " + customerDTO.getAssignedSalesManagerId()));
            existingCustomer.setAssignedSalesManager(salesManager);
        } else {
            existingCustomer.setAssignedSalesManager(null);
        }

        // Update address
        if (customerDTO.getAddress() != null) {
            if (existingCustomer.getAddress() != null) {
                Address existingAddress = existingCustomer.getAddress();
                updateAddressFromDTO(existingAddress, customerDTO.getAddress());
                addressRepository.save(existingAddress);
            } else {
                Address newAddress = convertAddressDTOToEntity(customerDTO.getAddress());
                newAddress = addressRepository.save(newAddress);
                existingCustomer.setAddress(newAddress);
            }
        }

        Customer updatedCustomer = customerRepository.save(existingCustomer);
        return convertToDTO(updatedCustomer);
    }

    @Transactional
    public CustomerDTO activateCustomer(Long id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + id));

        customer.setIsActive(true);
        Customer updatedCustomer = customerRepository.save(customer);
        return convertToDTO(updatedCustomer);
    }

    @Transactional
    public CustomerDTO deactivateCustomer(Long id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + id));

        customer.setIsActive(false);
        Customer updatedCustomer = customerRepository.save(customer);
        return convertToDTO(updatedCustomer);
    }

    @Transactional
    public CustomerDTO assignSalesManager(Long customerId, Long salesManagerId) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + customerId));

        User salesManager = userRepository.findById(salesManagerId)
                .orElseThrow(() -> new ResourceNotFoundException("Sales manager not found with id: " + salesManagerId));

        customer.setAssignedSalesManager(salesManager);
        Customer updatedCustomer = customerRepository.save(customer);
        return convertToDTO(updatedCustomer);
    }

    @Transactional
    public void deleteCustomer(Long id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + id));

        // Check if customer has orders
        if (customer.getOrders() != null && !customer.getOrders().isEmpty()) {
            throw new IllegalStateException("Cannot delete customer with existing orders. Consider deactivating instead.");
        }

        customerRepository.deleteById(id);
    }

    public Long getCustomerCountByType(CustomerType customerType) {
        return customerRepository.countByCustomerType(customerType);
    }

    private void validateUniqueFields(CustomerDTO customerDTO, Long excludeId) {
        // Check email uniqueness
        Optional<Customer> existingByEmail = customerRepository.findByEmail(customerDTO.getEmail());
        if (existingByEmail.isPresent() && (excludeId == null || !existingByEmail.get().getId().equals(excludeId))) {
            throw new DataIntegrityViolationException("Email already exists: " + customerDTO.getEmail());
        }

        // Check phone number uniqueness (if provided)
        if (customerDTO.getPhoneNumber() != null && !customerDTO.getPhoneNumber().trim().isEmpty()) {
            Optional<Customer> existingByPhone = customerRepository.findByPhoneNumber(customerDTO.getPhoneNumber());
            if (existingByPhone.isPresent() && (excludeId == null || !existingByPhone.get().getId().equals(excludeId))) {
                throw new DataIntegrityViolationException("Phone number already exists: " + customerDTO.getPhoneNumber());
            }
        }

        // Check tax ID uniqueness (if provided)
        if (customerDTO.getTaxId() != null && !customerDTO.getTaxId().trim().isEmpty()) {
            Optional<Customer> existingByTaxId = customerRepository.findByTaxId(customerDTO.getTaxId());
            if (existingByTaxId.isPresent() && (excludeId == null || !existingByTaxId.get().getId().equals(excludeId))) {
                throw new DataIntegrityViolationException("Tax ID already exists: " + customerDTO.getTaxId());
            }
        }
    }

    private CustomerDTO convertToDTO(Customer customer) {
        CustomerDTO dto = new CustomerDTO();
        dto.setId(customer.getId());
        dto.setCustomerNumber(customer.getCustomerNumber());
        dto.setFirstName(customer.getFirstName());
        dto.setLastName(customer.getLastName());
        dto.setEmail(customer.getEmail());
        dto.setPhoneNumber(customer.getPhoneNumber());
        dto.setCompanyName(customer.getCompanyName());
        dto.setTaxId(customer.getTaxId());
        dto.setRegistrationDate(customer.getRegistrationDate());
        dto.setIsActive(customer.getIsActive());
        dto.setCustomerType(customer.getCustomerType());
        dto.setCreditLimit(customer.getCreditLimit());
        dto.setPaymentTerms(customer.getPaymentTerms());
        dto.setNotes(customer.getNotes());

        if (customer.getAddress() != null) {
            dto.setAddressId(customer.getAddress().getId());
            dto.setAddress(convertAddressToDTO(customer.getAddress()));
        }

        if (customer.getAssignedSalesManager() != null) {
            dto.setAssignedSalesManagerId(customer.getAssignedSalesManager().getId());
            dto.setAssignedSalesManagerName(customer.getAssignedSalesManager().getFirstName() + " " + customer.getAssignedSalesManager().getLastName());
        }

        return dto;
    }

    private Customer convertToEntity(CustomerDTO dto) {
        Customer customer = new Customer();
        customer.setId(dto.getId());
        customer.setCustomerNumber(dto.getCustomerNumber());
        customer.setFirstName(dto.getFirstName());
        customer.setLastName(dto.getLastName());
        customer.setEmail(dto.getEmail());
        customer.setPhoneNumber(dto.getPhoneNumber());
        customer.setCompanyName(dto.getCompanyName());
        customer.setTaxId(dto.getTaxId());
        customer.setRegistrationDate(dto.getRegistrationDate());
        customer.setIsActive(dto.getIsActive());
        customer.setCustomerType(dto.getCustomerType());
        customer.setCreditLimit(dto.getCreditLimit());
        customer.setPaymentTerms(dto.getPaymentTerms());
        customer.setNotes(dto.getNotes());
        return customer;
    }

    private AddressDTO convertAddressToDTO(Address address) {
        AddressDTO dto = new AddressDTO();
        dto.setId(address.getId());
        dto.setStreet(address.getStreet());
        dto.setCity(address.getCity());
        dto.setState(address.getState());
        dto.setPostalCode(address.getPostalCode());
        dto.setCountry(address.getCountry());
        dto.setPhoneNumber(address.getPhoneNumber());
        return dto;
    }

    private Address convertAddressDTOToEntity(AddressDTO addressDTO) {
        Address address = new Address();
        address.setId(addressDTO.getId());
        address.setStreet(addressDTO.getStreet());
        address.setCity(addressDTO.getCity());
        address.setState(addressDTO.getState());
        address.setPostalCode(addressDTO.getPostalCode());
        address.setCountry(addressDTO.getCountry());
        address.setPhoneNumber(addressDTO.getPhoneNumber());
        return address;
    }

    private void updateAddressFromDTO(Address address, AddressDTO addressDTO) {
        address.setStreet(addressDTO.getStreet());
        address.setCity(addressDTO.getCity());
        address.setState(addressDTO.getState());
        address.setPostalCode(addressDTO.getPostalCode());
        address.setCountry(addressDTO.getCountry());
        address.setPhoneNumber(addressDTO.getPhoneNumber());
    }
}