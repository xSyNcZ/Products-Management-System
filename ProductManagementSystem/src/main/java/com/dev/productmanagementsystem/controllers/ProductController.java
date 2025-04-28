package com.dev.productmanagementsystem.controllers;

import com.dev.productmanagementsystem.dto.ProductDTO;
import com.dev.productmanagementsystem.entities.Product;
import com.dev.productmanagementsystem.entities.Category;
import com.dev.productmanagementsystem.entities.Warehouse;
import com.dev.productmanagementsystem.repositories.ProductRepository;
import com.dev.productmanagementsystem.repositories.CategoryRepository;
import com.dev.productmanagementsystem.repositories.WarehouseRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final WarehouseRepository warehouseRepository;

    @Autowired
    public ProductController(
            ProductRepository productRepository,
            CategoryRepository categoryRepository,
            WarehouseRepository warehouseRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.warehouseRepository = warehouseRepository;
    }

    @GetMapping
    public List<ProductDTO> getAllProducts() {
        return productRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductDTO> getProductById(@PathVariable Long id) {
        return productRepository.findById(id)
                .map(this::convertToDTO)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
    }

    @GetMapping("/sku/{sku}")
    public ResponseEntity<ProductDTO> getProductBySku(@PathVariable String sku) {
        return productRepository.findBySku(sku)
                .map(this::convertToDTO)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
    }

    @GetMapping("/category/{categoryId}")
    public List<ProductDTO> getProductsByCategoryId(@PathVariable Long categoryId) {
        return productRepository.findByCategoryId(categoryId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @GetMapping("/price/less-than/{price}")
    public List<ProductDTO> getProductsByPriceLessThan(@PathVariable BigDecimal price) {
        return productRepository.findByPriceLessThan(price).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @GetMapping("/price/greater-than/{price}")
    public List<ProductDTO> getProductsByPriceGreaterThan(@PathVariable BigDecimal price) {
        return productRepository.findByPriceGreaterThan(price).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @GetMapping("/price/between")
    public List<ProductDTO> getProductsByPriceBetween(
            @RequestParam BigDecimal minPrice, @RequestParam BigDecimal maxPrice) {
        return productRepository.findByPriceBetween(minPrice, maxPrice).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @GetMapping("/search")
    public List<ProductDTO> getProductsByNameContaining(@RequestParam String name) {
        return productRepository.findByNameContainingIgnoreCase(name).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @GetMapping("/warehouse/{warehouseId}/in-stock")
    public List<ProductDTO> getProductsInStockAtWarehouse(@PathVariable Long warehouseId) {
        return productRepository.findInStockAtWarehouse(warehouseId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @GetMapping("/out-of-stock")
    public List<ProductDTO> getOutOfStockProducts() {
        return productRepository.findOutOfStockProducts().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @GetMapping("/stock/below/{threshold}")
    public List<ProductDTO> getProductsWithStockBelow(@PathVariable Integer threshold) {
        return productRepository.findProductsWithStockBelow(threshold).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @GetMapping("/category/{categoryId}/count")
    public ResponseEntity<Long> getProductCountByCategoryId(@PathVariable Long categoryId) {
        Long count = productRepository.countByCategoryId(categoryId);
        return ResponseEntity.ok(count);
    }

    @PostMapping
    public ResponseEntity<ProductDTO> createProduct(@RequestBody ProductDTO productDTO) {
        // Check if product with the same SKU already exists
        if (productDTO.getSku() != null && productRepository.findBySku(productDTO.getSku()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Product with this SKU already exists");
        }

        Product product = convertToEntity(productDTO);
        Product savedProduct = productRepository.save(product);
        return new ResponseEntity<>(convertToDTO(savedProduct), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProductDTO> updateProduct(@PathVariable Long id, @RequestBody ProductDTO productDTO) {
        return productRepository.findById(id)
                .map(existingProduct -> {
                    // Check if SKU is being changed and if new SKU already exists
                    if (productDTO.getSku() != null &&
                            !productDTO.getSku().equals(existingProduct.getSku()) &&
                            productRepository.findBySku(productDTO.getSku()).isPresent()) {
                        throw new ResponseStatusException(HttpStatus.CONFLICT, "Product with this SKU already exists");
                    }

                    // Update the existing product with values from DTO
                    if (productDTO.getName() != null) {
                        existingProduct.setName(productDTO.getName());
                    }

                    if (productDTO.getDescription() != null) {
                        existingProduct.setDescription(productDTO.getDescription());
                    }

                    if (productDTO.getSku() != null) {
                        existingProduct.setSku(productDTO.getSku());
                    }

                    if (productDTO.getPrice() != null) {
                        existingProduct.setPrice(productDTO.getPrice());
                    }

                    if (productDTO.getCategoryId() != null) {
                        Category category = categoryRepository.findById(productDTO.getCategoryId())
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category not found"));
                        existingProduct.setCategory(category);
                    }

                    Product updatedProduct = productRepository.save(existingProduct);
                    return ResponseEntity.ok(convertToDTO(updatedProduct));
                })
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
    }

    @PatchMapping("/{id}/stock")
    public ResponseEntity<ProductDTO> updateProductStock(
            @PathVariable Long id,
            @RequestBody Map<Long, Integer> stockQuantities) {
        return productRepository.findById(id)
                .map(existingProduct -> {
                    Map<Warehouse, Integer> warehouses = new HashMap<>();

                    stockQuantities.forEach((warehouseId, quantity) -> {
                        Warehouse warehouse = warehouseRepository.findById(warehouseId)
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                        "Warehouse with ID " + warehouseId + " not found"));
                        warehouses.put(warehouse, quantity);
                    });

                    existingProduct.setStockQuantities(warehouses);
                    Product updatedProduct = productRepository.save(existingProduct);
                    return ResponseEntity.ok(convertToDTO(updatedProduct));
                })
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        return productRepository.findById(id)
                .map(product -> {
                    productRepository.delete(product);
                    return new ResponseEntity<Void>(HttpStatus.NO_CONTENT);
                })
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
    }

    // Helper methods
    private ProductDTO convertToDTO(Product product) {
        ProductDTO dto = new ProductDTO();
        dto.setId(product.getId());
        dto.setName(product.getName());
        dto.setDescription(product.getDescription());
        dto.setSku(product.getSku());
        dto.setPrice(product.getPrice());

        if (product.getCategory() != null) {
            dto.setCategoryId(product.getCategory().getId());
            dto.setCategoryName(product.getCategory().getName());
        }

        Map<Long, Integer> stockMap = new HashMap<>();
        product.getStockQuantities().forEach((warehouse, quantity) ->
                stockMap.put(warehouse.getId(), quantity));
        dto.setStockQuantities(stockMap);

        dto.setCreatedAt(product.getCreatedAt());
        dto.setUpdatedAt(product.getUpdatedAt());

        return dto;
    }

    private Product convertToEntity(ProductDTO dto) {
        Product entity = new Product();

        if (dto.getId() != null) {
            entity.setId(dto.getId());
        }

        entity.setName(dto.getName());
        entity.setDescription(dto.getDescription());
        entity.setSku(dto.getSku());
        entity.setPrice(dto.getPrice());

        if (dto.getCategoryId() != null) {
            Category category = categoryRepository.findById(dto.getCategoryId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category not found"));
            entity.setCategory(category);
        }

        if (dto.getStockQuantities() != null && !dto.getStockQuantities().isEmpty()) {
            Map<Warehouse, Integer> warehouses = new HashMap<>();
            dto.getStockQuantities().forEach((warehouseId, quantity) -> {
                Warehouse warehouse = warehouseRepository.findById(warehouseId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                "Warehouse with ID " + warehouseId + " not found"));
                warehouses.put(warehouse, quantity);
            });
            entity.setStockQuantities(warehouses);
        }

        return entity;
    }
}