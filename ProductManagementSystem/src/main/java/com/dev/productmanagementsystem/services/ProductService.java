package com.dev.productmanagementsystem.services;

import com.dev.productmanagementsystem.dto.ProductDTO;
import com.dev.productmanagementsystem.entities.Category;
import com.dev.productmanagementsystem.entities.Product;
import com.dev.productmanagementsystem.entities.Warehouse;
import com.dev.productmanagementsystem.exceptions.ResourceNotFoundException;
import com.dev.productmanagementsystem.exceptions.InsufficientStockException;
import com.dev.productmanagementsystem.repositories.CategoryRepository;
import com.dev.productmanagementsystem.repositories.ProductRepository;
import com.dev.productmanagementsystem.repositories.WarehouseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final WarehouseRepository warehouseRepository;

    @Autowired
    public ProductService(ProductRepository productRepository,
                          CategoryRepository categoryRepository,
                          WarehouseRepository warehouseRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.warehouseRepository = warehouseRepository;
    }

    public List<ProductDTO> getAllProducts() {
        return productRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public ProductDTO getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
        return convertToDTO(product);
    }

    public List<ProductDTO> getProductsByCategory(Long categoryId) {
        return productRepository.findByCategoryId(categoryId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<ProductDTO> getLowStockProducts(int threshold) {
        return productRepository.findAll().stream()
                .filter(p -> p.getTotalStock() < threshold)
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public List<ProductDTO> findByNameContaining(String name) {
        return productRepository.findByNameContainingIgnoreCase(name).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public ProductDTO findBySku(String sku) {
        Product product = productRepository.findBySku(sku)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with SKU: " + sku));
        return convertToDTO(product);
    }

    @Transactional
    public ProductDTO transferStock(Long productId, Long sourceWarehouseId, Long destinationWarehouseId, Integer quantity) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));

        Warehouse sourceWarehouse = warehouseRepository.findById(sourceWarehouseId)
                .orElseThrow(() -> new ResourceNotFoundException("Source warehouse not found with id: " + sourceWarehouseId));

        Warehouse destinationWarehouse = warehouseRepository.findById(destinationWarehouseId)
                .orElseThrow(() -> new ResourceNotFoundException("Destination warehouse not found with id: " + destinationWarehouseId));

        // Check if there's enough stock in source warehouse
        Integer currentStock = product.getStockQuantities().getOrDefault(sourceWarehouse, 0);
        if (currentStock < quantity) {
            throw new InsufficientStockException("Insufficient stock in source warehouse. Available: " + currentStock + ", Requested: " + quantity);
        }

        // Update source warehouse stock
        product.updateStock(sourceWarehouse, currentStock - quantity);

        // Update destination warehouse stock
        Integer destinationStock = product.getStockQuantities().getOrDefault(destinationWarehouse, 0);
        product.updateStock(destinationWarehouse, destinationStock + quantity);

        Product updatedProduct = productRepository.save(product);
        return convertToDTO(updatedProduct);
    }

    public boolean isStockBelowThreshold(Long productId, int threshold) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));
        return product.getTotalStock() < threshold;
    }

    public Integer getStockInWarehouse(Long productId, Long warehouseId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));

        Warehouse warehouse = warehouseRepository.findById(warehouseId)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found with id: " + warehouseId));

        return product.getStockQuantities().getOrDefault(warehouse, 0);
    }

    @Transactional
    public ProductDTO createProduct(ProductDTO productDTO) {
        Product product = convertToEntity(productDTO);
        Product savedProduct = productRepository.save(product);
        return convertToDTO(savedProduct);
    }

    @Transactional
    public ProductDTO updateProduct(Long id, ProductDTO productDTO) {
        Product existingProduct = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));

        existingProduct.setName(productDTO.getName());
        existingProduct.setDescription(productDTO.getDescription());
        existingProduct.setSku(productDTO.getSku());
        existingProduct.setPrice(productDTO.getPrice());

        Category category = categoryRepository.findById(productDTO.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + productDTO.getCategoryId()));
        existingProduct.setCategory(category);

        Product updatedProduct = productRepository.save(existingProduct);
        return convertToDTO(updatedProduct);
    }

    @Transactional
    public void deleteProduct(Long id) {
        if (!productRepository.existsById(id)) {
            throw new ResourceNotFoundException("Product not found with id: " + id);
        }
        productRepository.deleteById(id);
    }

    @Transactional
    public ProductDTO updateStock(Long productId, Long warehouseId, Integer quantity) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));

        Warehouse warehouse = warehouseRepository.findById(warehouseId)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found with id: " + warehouseId));

        product.updateStock(warehouse, quantity);
        Product updatedProduct = productRepository.save(product);
        return convertToDTO(updatedProduct);
    }

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
                stockMap.put(warehouse.getId(), quantity)
        );
        dto.setStockQuantities(stockMap);

        dto.setCreatedAt(product.getCreatedAt());
        dto.setUpdatedAt(product.getUpdatedAt());

        return dto;
    }

    private Product convertToEntity(ProductDTO dto) {
        Product product = new Product();
        product.setName(dto.getName());
        product.setDescription(dto.getDescription());
        product.setSku(dto.getSku());
        product.setPrice(dto.getPrice());

        if (dto.getCategoryId() != null) {
            Category category = categoryRepository.findById(dto.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + dto.getCategoryId()));
            product.setCategory(category);
        }

        if (dto.getStockQuantities() != null) {
            dto.getStockQuantities().forEach((warehouseId, quantity) -> {
                Warehouse warehouse = warehouseRepository.findById(warehouseId)
                        .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found with id: " + warehouseId));
                product.getStockQuantities().put(warehouse, quantity);
            });
        }

        return product;
    }

    // Finds a product by its id
    public Optional<Product> findById(Long id) {
        return productRepository.findById(id);
    }
}
