package com.dev.productmanagementsystem.repositories;

import com.dev.productmanagementsystem.entities.Address;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface AddressRepository extends JpaRepository<Address, Long> {
    // Find addresses by user id
    Address findAddressByUserId(Long userId);

    // Find addresses by city
    List<Address> findByCity(String city);

    // Find addresses by postal code
    List<Address> findByPostalCode(String postalCode);

    // Find addresses by country
    List<Address> findByCountry(String country);

    // Find addresses by state (case insensitive)
    List<Address> findByStateContainingIgnoreCase(String state);

    // Find address by user ID
    Optional<Address> findByUserId(Long userId);

    // Find addresses by city (case insensitive)
    List<Address> findByCityContainingIgnoreCase(String city);

    // Find addresses by country (case insensitive)
    List<Address> findByCountryContainingIgnoreCase(String country);
}