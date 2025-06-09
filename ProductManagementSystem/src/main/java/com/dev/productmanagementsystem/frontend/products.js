// Products Management JavaScript

class ProductManager {
    constructor() {
        this.products = [];
        this.categories = [];
        this.apiBaseUrl = '/api';
    }

    // Initialize the product manager
    async init() {
        try {
            await this.loadCategories();
            await this.loadProducts();
            this.setupEventListeners();
        } catch (error) {
            console.error('Error initializing ProductManager:', error);
        }
    }

    // Load all categories
    async loadCategories() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/categories`);
            if (response.ok) {
                this.categories = await response.json();
            }
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }

    // Load all products
    async loadProducts() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/products`);
            if (response.ok) {
                this.products = await response.json();
                this.renderProductList();
            }
        } catch (error) {
            console.error('Error loading products:', error);
        }
    }

    // Create a new product
    async createProduct(productData) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/products`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(productData)
            });

            if (response.ok) {
                const newProduct = await response.json();
                this.products.push(newProduct);
                this.renderProductList();
                return newProduct;
            } else {
                throw new Error('Failed to create product');
            }
        } catch (error) {
            console.error('Error creating product:', error);
            throw error;
        }
    }

    // Update an existing product
    async updateProduct(productId, productData) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/products/${productId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(productData)
            });

            if (response.ok) {
                const updatedProduct = await response.json();
                const index = this.products.findIndex(p => p.id === productId);
                if (index !== -1) {
                    this.products[index] = updatedProduct;
                    this.renderProductList();
                }
                return updatedProduct;
            } else {
                throw new Error('Failed to update product');
            }
        } catch (error) {
            console.error('Error updating product:', error);
            throw error;
        }
    }

    // Delete a product
    async deleteProduct(productId) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/products/${productId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.products = this.products.filter(p => p.id !== productId);
                this.renderProductList();
                return true;
            } else {
                throw new Error('Failed to delete product');
            }
        } catch (error) {
            console.error('Error deleting product:', error);
            throw error;
        }
    }

    // Get product by ID
    getProductById(productId) {
        return this.products.find(p => p.id === productId);
    }

    // Search products
    searchProducts(query) {
        const lowerQuery = query.toLowerCase();
        return this.products.filter(product =>
            product.name.toLowerCase().includes(lowerQuery) ||
            product.description.toLowerCase().includes(lowerQuery)
        );
    }

    // Filter products by category
    filterProductsByCategory(categoryId) {
        if (!categoryId) return this.products;
        return this.products.filter(product => product.category && product.category.id === categoryId);
    }

    // Render product list in the DOM
    renderProductList() {
        const container = document.getElementById('product-list');
        if (!container) return;

        container.innerHTML = '';

        this.products.forEach(product => {
            const productElement = this.createProductElement(product);
            container.appendChild(productElement);
        });
    }

    // Create a product element for display
    createProductElement(product) {
        const div = document.createElement('div');
        div.className = 'product-item';
        div.innerHTML = `
            <div class="product-card">
                <h3>${product.name}</h3>
                <p class="product-description">${product.description || 'No description'}</p>
                <p class="product-price">$${product.price ? product.price.toFixed(2) : '0.00'}</p>
                <p class="product-category">Category: ${product.category ? product.category.name : 'Uncategorized'}</p>
                <div class="product-actions">
                    <button onclick="productManager.editProduct(${product.id})" class="btn btn-edit">Edit</button>
                    <button onclick="productManager.confirmDeleteProduct(${product.id})" class="btn btn-delete">Delete</button>
                </div>
            </div>
        `;
        return div;
    }

    // Setup event listeners
    setupEventListeners() {
        // Product form submission
        const productForm = document.getElementById('product-form');
        if (productForm) {
            productForm.addEventListener('submit', this.handleProductSubmit.bind(this));
        }

        // Search functionality
        const searchInput = document.getElementById('product-search');
        if (searchInput) {
            searchInput.addEventListener('input', this.handleSearch.bind(this));
        }

        // Category filter
        const categoryFilter = document.getElementById('category-filter');
        if (categoryFilter) {
            this.populateCategoryFilter();
            categoryFilter.addEventListener('change', this.handleCategoryFilter.bind(this));
        }
    }

    // Handle product form submission
    async handleProductSubmit(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);

        const productData = {
            name: formData.get('name'),
            description: formData.get('description'),
            price: parseFloat(formData.get('price')),
            category: formData.get('categoryId') ? { id: parseInt(formData.get('categoryId')) } : null
        };

        const productId = formData.get('productId');

        try {
            if (productId) {
                await this.updateProduct(parseInt(productId), productData);
            } else {
                await this.createProduct(productData);
            }
            form.reset();
            this.clearForm();
        } catch (error) {
            alert('Error saving product: ' + error.message);
        }
    }

    // Handle search input
    handleSearch(event) {
        const query = event.target.value;
        const filteredProducts = this.searchProducts(query);
        this.renderFilteredProducts(filteredProducts);
    }

    // Handle category filter
    handleCategoryFilter(event) {
        const categoryId = event.target.value ? parseInt(event.target.value) : null;
        const filteredProducts = this.filterProductsByCategory(categoryId);
        this.renderFilteredProducts(filteredProducts);
    }

    // Render filtered products
    renderFilteredProducts(products) {
        const container = document.getElementById('product-list');
        if (!container) return;

        container.innerHTML = '';
        products.forEach(product => {
            const productElement = this.createProductElement(product);
            container.appendChild(productElement);
        });
    }

    // Populate category filter dropdown
    populateCategoryFilter() {
        const select = document.getElementById('category-filter');
        if (!select) return;

        select.innerHTML = '<option value="">All Categories</option>';
        this.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            select.appendChild(option);
        });
    }

    // Edit product
    editProduct(productId) {
        const product = this.getProductById(productId);
        if (!product) return;

        const form = document.getElementById('product-form');
        if (!form) return;

        form.elements.productId.value = product.id;
        form.elements.name.value = product.name;
        form.elements.description.value = product.description || '';
        form.elements.price.value = product.price || '';
        form.elements.categoryId.value = product.category ? product.category.id : '';
    }

    // Confirm delete product
    confirmDeleteProduct(productId) {
        const product = this.getProductById(productId);
        if (!product) return;

        if (confirm(`Are you sure you want to delete "${product.name}"?`)) {
            this.deleteProduct(productId);
        }
    }

    // Clear form
    clearForm() {
        const form = document.getElementById('product-form');
        if (form) {
            form.elements.productId.value = '';
        }
    }
}

// Initialize the product manager when the DOM is loaded
let productManager;
document.addEventListener('DOMContentLoaded', () => {
    productManager = new ProductManager();
    productManager.init();
});