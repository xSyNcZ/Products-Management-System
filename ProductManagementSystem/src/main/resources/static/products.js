// Products Management JavaScript
// Updated version that connects to Spring Boot API

// Global variables
let products = [];
let categories = [];
let currentProductId = null;

// API Base URL
const API_BASE_URL = 'http://localhost:8080/api';

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    loadCategories();
    loadProducts();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Remove any existing event listeners to prevent duplicates
    const form = document.getElementById('productForm');
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);

    // Product form submission
    document.getElementById('productForm').addEventListener('submit', saveProduct);

    // Modal close on outside click
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('productModal');
        if (event.target === modal) {
            closeModal();
        }
    });

    // Search input real-time filtering
    document.getElementById('searchInput').addEventListener('input', filterProducts);
}

// API Helper function
async function apiCall(url, options = {}) {
    try {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        // Check if response has content
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        }
        return null;
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}

// Load categories from API
async function loadCategories() {
    try {
        const response = await apiCall(`${API_BASE_URL}/categories`);
        categories = response || [];
        populateCategories();
    } catch (error) {
        console.error('Error loading categories:', error);
        showNotification('Failed to load categories', 'error');
        // Fallback to sample categories for demo
        categories = getSampleCategories();
        populateCategories();
    }
}

// Load products from API
async function loadProducts() {
    try {
        showLoading(true);
        const response = await apiCall(`${API_BASE_URL}/products`);
        products = response || [];
        renderProductsTable();
    } catch (error) {
        console.error('Error loading products:', error);
        showNotification('Failed to load products', 'error');
        products = [];
        renderProductsTable();
    } finally {
        showLoading(false);
    }
}

// Get sample categories (fallback)
function getSampleCategories() {
    return [
        { id: 1, name: 'Electronics', description: 'Electronic devices and accessories' },
        { id: 2, name: 'Clothing', description: 'Apparel and fashion items' },
        { id: 3, name: 'Books', description: 'Books and educational materials' },
        { id: 4, name: 'Home & Garden', description: 'Home improvement and gardening supplies' },
        { id: 5, name: 'Sports', description: 'Sports equipment and accessories' }
    ];
}

// Render products table
function renderProductsTable() {
    const tbody = document.getElementById('productsTableBody');

    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No products found</td></tr>';
        return;
    }

    tbody.innerHTML = products.map(product => {
        const categoryName = product.categoryName || 'Uncategorized';
        return `
            <tr>
                <td>${product.id}</td>
                <td>${escapeHtml(product.name)}</td>
                <td>${escapeHtml(product.description || 'No description')}</td>
                <td>$${product.price ? product.price.toFixed(2) : '0.00'}</td>
                <td>${escapeHtml(categoryName)}</td>
                <td class="actions">
                    <button onclick="editProduct(${product.id})" class="btn btn-sm btn-primary" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteProduct(${product.id})" class="btn btn-sm btn-danger" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Populate category dropdowns
function populateCategories() {
    const categoryFilter = document.getElementById('categoryFilter');
    const productCategory = document.getElementById('productCategory');

    // Clear existing options (except "All Categories" for filter)
    categoryFilter.innerHTML = '<option value="">All Categories</option>';
    productCategory.innerHTML = '<option value="">Select Category</option>';

    // Add category options
    categories.forEach(category => {
        // For filter dropdown
        const filterOption = document.createElement('option');
        filterOption.value = category.id;
        filterOption.textContent = category.name;
        categoryFilter.appendChild(filterOption);

        // For product form dropdown
        const formOption = document.createElement('option');
        formOption.value = category.id;
        formOption.textContent = category.name;
        productCategory.appendChild(formOption);
    });
}

// Show add product modal
function showAddProductModal() {
    currentProductId = null;
    document.getElementById('modalTitle').textContent = 'Add Product';
    document.getElementById('productForm').reset();
    document.getElementById('productModal').style.display = 'block';
}

// Edit product
async function editProduct(id) {
    try {
        showLoading(true);
        const product = await apiCall(`${API_BASE_URL}/products/${id}`);

        if (!product) {
            showNotification('Product not found', 'error');
            return;
        }

        currentProductId = id;
        document.getElementById('modalTitle').textContent = 'Edit Product';
        document.getElementById('productName').value = product.name || '';
        document.getElementById('productDescription').value = product.description || '';
        document.getElementById('productPrice').value = product.price || '';
        document.getElementById('productCategory').value = product.categoryId || '';
        document.getElementById('productModal').style.display = 'block';
    } catch (error) {
        console.error('Error loading product:', error);
        showNotification('Failed to load product details', 'error');
    } finally {
        showLoading(false);
    }
}

// Save product (create or update)
async function saveProduct(event) {
    event.preventDefault();

    const name = document.getElementById('productName').value.trim();
    const description = document.getElementById('productDescription').value.trim();
    const price = parseFloat(document.getElementById('productPrice').value);
    const categoryId = parseInt(document.getElementById('productCategory').value) || null;

    // Validation
    if (!name) {
        showNotification('Product name is required', 'error');
        return;
    }

    if (isNaN(price) || price < 0) {
        showNotification('Please enter a valid price', 'error');
        return;
    }

    const productData = {
        name,
        description,
        price,
        categoryId
    };

    try {
        showLoading(true);

        if (currentProductId) {
            // Update existing product
            await apiCall(`${API_BASE_URL}/products/${currentProductId}`, {
                method: 'PUT',
                body: JSON.stringify(productData)
            });
            showNotification('Product updated successfully', 'success');
        } else {
            // Create new product
            await apiCall(`${API_BASE_URL}/products`, {
                method: 'POST',
                body: JSON.stringify(productData)
            });
            showNotification('Product created successfully', 'success');
        }

        await loadProducts(); // Reload products
        closeModal();
    } catch (error) {
        console.error('Error saving product:', error);
        if (error.message.includes('409')) {
            showNotification('Product with this SKU already exists', 'error');
        } else if (error.message.includes('400')) {
            showNotification('Invalid product data', 'error');
        } else {
            showNotification('Failed to save product', 'error');
        }
    } finally {
        showLoading(false);
    }
}

// Delete product
async function deleteProduct(id) {
    const product = products.find(p => p.id === id);
    if (!product) {
        showNotification('Product not found', 'error');
        return;
    }

    if (!confirm(`Are you sure you want to delete "${product.name}"?`)) {
        return;
    }

    try {
        showLoading(true);
        await apiCall(`${API_BASE_URL}/products/${id}`, {
            method: 'DELETE'
        });

        showNotification('Product deleted successfully', 'success');
        await loadProducts(); // Reload products
    } catch (error) {
        console.error('Error deleting product:', error);
        showNotification('Failed to delete product', 'error');
    } finally {
        showLoading(false);
    }
}

// Filter products based on search and category
async function filterProducts() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    const selectedCategoryId = parseInt(document.getElementById('categoryFilter').value) || null;

    try {
        showLoading(true);
        let url = `${API_BASE_URL}/products`;
        let filteredProducts = [];

        if (searchTerm && selectedCategoryId) {
            // If both search and category are specified, we need to fetch all and filter locally
            // since the API doesn't support combined search
            const allProducts = await apiCall(url);
            filteredProducts = allProducts.filter(product => {
                const matchesSearch = product.name.toLowerCase().includes(searchTerm) ||
                    (product.description && product.description.toLowerCase().includes(searchTerm));
                const matchesCategory = product.categoryId === selectedCategoryId;
                return matchesSearch && matchesCategory;
            });
        } else if (searchTerm) {
            // Search by name
            filteredProducts = await apiCall(`${url}/search?name=${encodeURIComponent(searchTerm)}`);
        } else if (selectedCategoryId) {
            // Filter by category
            filteredProducts = await apiCall(`${url}/category/${selectedCategoryId}`);
        } else {
            // No filters, show all products
            filteredProducts = await apiCall(url);
        }

        renderFilteredProducts(filteredProducts || []);
    } catch (error) {
        console.error('Error filtering products:', error);
        showNotification('Failed to filter products', 'error');
        // Fallback to local filtering
        filterProductsLocally();
    } finally {
        showLoading(false);
    }
}

// Fallback local filtering when API fails
function filterProductsLocally() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const selectedCategoryId = parseInt(document.getElementById('categoryFilter').value) || null;

    let filteredProducts = products;

    // Filter by search term
    if (searchTerm) {
        filteredProducts = filteredProducts.filter(product =>
            product.name.toLowerCase().includes(searchTerm) ||
            (product.description && product.description.toLowerCase().includes(searchTerm))
        );
    }

    // Filter by category
    if (selectedCategoryId) {
        filteredProducts = filteredProducts.filter(product =>
            product.categoryId === selectedCategoryId
        );
    }

    renderFilteredProducts(filteredProducts);
}

// Render filtered products
function renderFilteredProducts(filteredProducts) {
    const tbody = document.getElementById('productsTableBody');

    if (filteredProducts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No products match your search criteria</td></tr>';
        return;
    }

    tbody.innerHTML = filteredProducts.map(product => {
        const categoryName = product.categoryName || 'Uncategorized';
        return `
            <tr>
                <td>${product.id}</td>
                <td>${escapeHtml(product.name)}</td>
                <td>${escapeHtml(product.description || 'No description')}</td>
                <td>$${product.price ? product.price.toFixed(2) : '0.00'}</td>
                <td>${escapeHtml(categoryName)}</td>
                <td class="actions">
                    <button onclick="editProduct(${product.id})" class="btn btn-sm btn-primary" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteProduct(${product.id})" class="btn btn-sm btn-danger" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Close modal
function closeModal() {
    document.getElementById('productModal').style.display = 'none';
    currentProductId = null;
}

// Show/hide loading indicator
function showLoading(show) {
    // Create loading overlay if it doesn't exist
    let loadingOverlay = document.getElementById('loadingOverlay');
    if (!loadingOverlay) {
        loadingOverlay = document.createElement('div');
        loadingOverlay.id = 'loadingOverlay';
        loadingOverlay.innerHTML = `
            <div class="loading-spinner">
                <i class="fas fa-spinner fa-spin"></i>
                <span>Loading...</span>
            </div>
        `;
        loadingOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
        `;

        const spinner = loadingOverlay.querySelector('.loading-spinner');
        spinner.style.cssText = `
            background: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            color: #333;
        `;

        document.body.appendChild(loadingOverlay);
    }

    loadingOverlay.style.display = show ? 'flex' : 'none';
}

// Utility function to escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // Add styles for notification
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 24px;
        border-radius: 4px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        opacity: 0;
        transform: translateX(100px);
        transition: all 0.3s ease;
        max-width: 300px;
        word-wrap: break-word;
    `;

    // Set background color based on type
    switch (type) {
        case 'success':
            notification.style.backgroundColor = '#4CAF50';
            break;
        case 'error':
            notification.style.backgroundColor = '#f44336';
            break;
        case 'warning':
            notification.style.backgroundColor = '#ff9800';
            break;
        default:
            notification.style.backgroundColor = '#2196F3';
    }

    // Add to page
    document.body.appendChild(notification);

    // Show notification
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 100);

    // Remove notification after 4 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100px)';
        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 4000);
}