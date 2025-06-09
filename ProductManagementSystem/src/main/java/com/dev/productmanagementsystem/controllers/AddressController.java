package com.dev.productmanagementsystem.controllers;

import com.dev.productmanagementsystem.dto.AddressDTO;
import com.dev.productmanagementsystem.entities.Address;
import com.dev.productmanagementsystem.entities.User;
import com.dev.productmanagementsystem.repositories.AddressRepository;
import com.dev.productmanagementsystem.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/addresses")
public class AddressController {

    @Autowired
    private AddressRepository addressRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<AddressDTO>> getAllAddresses() {
        List<Address> addresses = addressRepository.findAll();
        List<AddressDTO> addressDTOs = addresses.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(addressDTOs);
    }

    @GetMapping("/{id}")
    public ResponseEntity<AddressDTO> getAddressById(@PathVariable Long id) {
        Optional<Address> addressOptional = addressRepository.findById(id);
        return addressOptional.map(address -> ResponseEntity.ok(convertToDTO(address)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<AddressDTO> getAddressByUserId(@PathVariable Long userId) {
        Optional<Address> addressOptional = addressRepository.findByUserId(userId);
        return addressOptional.map(address -> ResponseEntity.ok(convertToDTO(address)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/city/{city}")
    public ResponseEntity<List<AddressDTO>> getAddressesByCity(@PathVariable String city) {
        List<Address> addresses = addressRepository.findByCityContainingIgnoreCase(city);
        List<AddressDTO> addressDTOs = addresses.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(addressDTOs);
    }

    @GetMapping("/country/{country}")
    public ResponseEntity<List<AddressDTO>> getAddressesByCountry(@PathVariable String country) {
        List<Address> addresses = addressRepository.findByCountryContainingIgnoreCase(country);
        List<AddressDTO> addressDTOs = addresses.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(addressDTOs);
    }

    @GetMapping("/state/{state}")
    public ResponseEntity<List<AddressDTO>> getAddressesByState(@PathVariable String state) {
        List<Address> addresses = addressRepository.findByStateContainingIgnoreCase(state);
        List<AddressDTO> addressDTOs = addresses.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(addressDTOs);
    }

    @PostMapping
    public ResponseEntity<AddressDTO> createAddress(@RequestBody AddressDTO addressDTO) {
        Address address = convertToEntity(addressDTO);

        // If this address is linked to a user, we need to ensure the user is set properly
        if (addressDTO.getUserId() != null) {
            Optional<User> userOptional = userRepository.findById(addressDTO.getUserId());
            if (userOptional.isPresent()) {
                address.setUser(userOptional.get());
            } else {
                return ResponseEntity.badRequest().build();
            }
        }

        Address savedAddress = addressRepository.save(address);
        return new ResponseEntity<>(convertToDTO(savedAddress), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<AddressDTO> updateAddress(@PathVariable Long id, @RequestBody AddressDTO addressDTO) {
        if (!addressRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        // Fetch the existing address to preserve relationships
        Optional<Address> existingAddressOpt = addressRepository.findById(id);
        if (existingAddressOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Address existingAddress = existingAddressOpt.get();
        Address updatedAddress = convertToEntity(addressDTO);
        updatedAddress.setId(id);

        // Preserve the user relationship
        updatedAddress.setUser(existingAddress.getUser());

        // If there's a new userId in the DTO, update the user relationship
        if (addressDTO.getUserId() != null) {
            Optional<User> userOptional = userRepository.findById(addressDTO.getUserId());
            if (userOptional.isPresent()) {
                updatedAddress.setUser(userOptional.get());
            } else {
                return ResponseEntity.badRequest().build();
            }
        }

        Address savedAddress = addressRepository.save(updatedAddress);
        return ResponseEntity.ok(convertToDTO(savedAddress));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAddress(@PathVariable Long id) {
        if (!addressRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        addressRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private AddressDTO convertToDTO(Address address) {
        AddressDTO dto = new AddressDTO();
        dto.setId(address.getId());
        dto.setStreet(address.getStreet());
        dto.setCity(address.getCity());
        dto.setState(address.getState());
        dto.setPostalCode(address.getPostalCode());
        dto.setCountry(address.getCountry());
        dto.setPhoneNumber(address.getPhoneNumber());

        // Include the userId in the DTO if there's a related user
        if (address.getUser() != null) {
            dto.setUserId(address.getUser().getId());
        }

        return dto;
    }

    private Address convertToEntity(AddressDTO dto) {
        Address address = new Address();
        address.setId(dto.getId());
        address.setStreet(dto.getStreet());
        address.setCity(dto.getCity());
        address.setState(dto.getState());
        address.setPostalCode(dto.getPostalCode());
        address.setCountry(dto.getCountry());
        address.setPhoneNumber(dto.getPhoneNumber());
        return address;
    }
}