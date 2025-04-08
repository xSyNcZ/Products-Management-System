package com.dev.productmanagementsystem.repository;

import com.dev.productmanagementsystem.entity.Address;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AddressRepository extends JpaRepository<Address, Long> {
    // Find addresses by user id
    Address findByUserId(Long userId);

    // Find addresses by city
    java.util.List<Address> findByCity(String city);

    // Find addresses by postal code
    java.util.List<Address> findByPostalCode(String postalCode);

    // Find addresses by country
    java.util.List<Address> findByCountry(String country);
}