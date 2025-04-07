package com.dev.productmanagementsystem.dto;

import com.dev.productmanagementsystem.*;
import com.dev.productmanagementsystem.dto.*;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

public class EntityDTOMapperUtil {

    // Address mapping
    public static AddressDTO toAddressDTO(Address address) {
        if (address == null) return null;

        AddressDTO dto = new AddressDTO();
        dto.setId(address.getId());
        dto.setStreetAddress(address.getStreetAddress());
        dto.setCity(address.getCity());
        dto.setState(address.getState());
        dto.setPostalCode(address.getPostalCode());
        dto.setCountry(address.getCountry());
        return dto;
    }

    public static Address toAddress(AddressDTO dto) {
        if (dto == null) return null;

        Address address = new Address();
        address.setId(dto.getId());
        address.setStreetAddress(dto.getStreetAddress());
        address.setCity(dto.getCity());
        address.setState(dto.getState());
        address.setPostalCode(dto.getPostalCode());
        address.setCountry(dto.getCountry());
        return address;
    }

    // Category mapping
    public static CategoryDTO toCategoryDTO(Category category) {
        if (category == null) return null;

        CategoryDTO dto = new CategoryDTO();
        dto.setId(category.getId());
        dto.setName(category.getName());
        dto.setDescription(category.getDescription());

        if (category.getProducts() != null) {
            dto.setProducts(category.getProducts().stream()
                    .map(product -> new ProductSummaryDTO(product.getId(), product.getName(), product.getPrice()))
                    .collect(Collectors.toList()));
        }

        return dto;
    }

    // User mapping
    public static UserDTO toUserDTO(User user) {
        if (user == null) return null;

        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        dto.setAddress(toAddressDTO(user.getAddress()));

        if (user.getRoles() != null) {
            dto.setRoles(user.getRoles().stream()
                    .map(Role::getName)
                    .collect(Collectors.toSet()));
        }

        return dto;
    }

    public static User toUser(UserCreateDTO dto) {
        if (dto == null) return null;

        User user = new User();
        user.setUsername(dto.getUsername());
        user.setPassword(dto.getPassword());  // Note: This should be encrypted before saving
        user.setEmail(dto.getEmail());
        user.setFirstName(dto.getFirstName());
        user.setLastName(dto.getLastName());
        user.setAddress(toAddress(dto.getAddress()));

        return user;
    }

    // Product mapping
    public static ProductDTO toProductDTO(Product product) {
        if (product == null) return null;

        ProductDTO dto = new ProductDTO();
        dto.setId(product.getId());
        dto.setName(product.getName());
        dto.setDescription(product.getDescription());
        dto.setPrice(product.getPrice());

        if (product.getCategory() != null) {
            dto.setCategory(new CategorySummaryDTO(product.getCategory().getId(), product.getCategory().getName()));
        }

        return dto;
    }

    // More mappers can be added here as needed...
}