package com.dev.productmanagementsystem.services;

import com.dev.productmanagementsystem.entities.Address;
import com.dev.productmanagementsystem.entities.User;
import com.dev.productmanagementsystem.repositories.AddressRepository;
import com.dev.productmanagementsystem.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class AddressService {

    private final AddressRepository addressRepository;
    private final UserRepository userRepository;

    @Autowired
    public AddressService(AddressRepository addressRepository, UserRepository userRepository) {
        this.addressRepository = addressRepository;
        this.userRepository = userRepository;
    }

    public List<Address> findAll() {
        return addressRepository.findAll();
    }

    public Optional<Address> findById(Long id) {
        return addressRepository.findById(id);
    }

    public Address save(Address address) {
        return addressRepository.save(address);
    }

    public void delete(Long id) {
        addressRepository.deleteById(id);
    }

    public Address assignAddressToUser(Long addressId, Long userId) {
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new IllegalArgumentException("Address not found"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        address.setUser(user);
        return addressRepository.save(address);
    }

    public List<Address> findByCity(String city) {
        return addressRepository.findByCityContainingIgnoreCase(city);
    }

    public List<Address> findByState(String state) {
        return addressRepository.findByStateContainingIgnoreCase(state);
    }

    public List<Address> findByCountry(String country) {
        return addressRepository.findByCountryContainingIgnoreCase(country);
    }

    public Optional<Address> findUserAddress(Long userId) {
        return addressRepository.findByUserId(userId);
    }
}
