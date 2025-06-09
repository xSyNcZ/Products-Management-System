// Products Management JavaScript
// Fixed version that works with the HTML structure and uses localStorage

// Global variables
let products = [];
let categories = [];
let currentProductId = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    loadCategories();
    loadProducts();
    setupEventListeners();
    populateCategories();
});

// Setup event listeners
function setupEventListeners() {
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

// Load categories from localStorage (or get sample data)
function loadCategories() {
    try {
        const storedCategories = localStorage.getItem('categories');
        categories = storedCategories ? JSON.parse(storedCategories) : getSampleCategories();
    } catch (error) {
        console.error('Error loading categories:', error);
        categories = getSampleCategories();
    }
}

// Load products from localStorage (or get sample data)
function loadProducts() {
    try {
        const storedProducts = localStorage.getItem('products');
        products = storedProducts ? JSON.parse(storedProducts) : getSampleProducts();

        // If no stored products, save sample data
        if (!storedProducts) {
            saveProducts();
        }

        renderProductsTable();
    } catch (error) {
        console.error('Error loading products:', error);
        products = getSampleProducts();
        renderProductsTable();
    }
}

// Get sample categories
function getSampleCategories() {
    return [
        { id: 1, name: 'Electronics', description: 'Electronic devices and accessories' },
        { id: 2, name: 'Clothing', description: 'Apparel and fashion items' },
        { id: 3, name: 'Books', description: 'Books and educational materials' },
        { id: 4, name: 'Home & Garden', description: 'Home improvement and gardening supplies' },
        { id: 5, name: 'Sports', description: 'Sports equipment and accessories' }
    ];
}

// Get sample products
function getSampleProducts() {
    return [
        {
            id: 1,
            name: 'Smartphone Pro',
            description: 'Latest flagship smartphone with advanced camera and AI features',
            price: 999.99,
            categoryId: 1
        },
        {
            id: 2,
            name: 'Gaming Laptop',
            description: 'High-performance laptop for gaming and professional work',
            price: 1599.99,
            categoryId: 1
        },
        {
            id: 3,
            name: 'Wireless Headphones',
            description: 'Premium noise-canceling wireless headphones',
            price: 299.99,
            categoryId: 1
        },
        {
            id: 4,
            name: 'Cotton T-Shirt',
            description: 'Comfortable 100% cotton t-shirt in various colors',
            price: 24.99,
            categoryId: 2
        },
        {
            id: 5,
            name: 'Denim Jeans',
            description: 'Classic straight-fit denim jeans',
            price: 79.99,
            categoryId: 2
        },
        {
            id: 6,
            name: 'Programming Guide',
            description: 'Comprehensive guide to modern programming languages',
            price: 49.99,
            categoryId: 3
        },
        {
            id: 7,
            name: 'Mystery Novel',
            description: 'Bestselling mystery thriller novel',
            price: 16.99,
            categoryId: 3
        },
        {
            id: 8,
            name: 'Garden Tool Set',
            description: 'Complete 12-piece garden tool set with storage bag',
            price: 89.99,
            categoryId: 4
        },
        {
            id: 9,
            name: 'Indoor Plant Pot',
            description: 'Decorative ceramic pot perfect for indoor plants',
            price: 34.99,
            categoryId: 4
        },
        {
            id: 10,
            name: 'Basketball',
            description: 'Official size basketball for indoor and outdoor play',
            price: 39.99,
            categoryId: 5
        }
    ];
}

// Save products to localStorage
function saveProducts() {
    try {
        localStorage.setItem('products', JSON.stringify(products));
    } catch (error) {
        console.error('Error saving products:', error);
        showNotification('Error saving products', 'error');
    }
}

// Render products table
function renderProductsTable() {
    const tbody = document.getElementById('productsTableBody');

    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No products found</td></tr>';
        return;
    }

    tbody.innerHTML = products.map(product => {
        const category = categories.find(c => c.id === product.categoryId);
        return `
            <tr>
                <td>${product.id}</td>
                <td>${escapeHtml(product.name)}</td>
                <td>${escapeHtml(product.description || 'No description')}</td>
                <td>$${product.price ? product.price.toFixed(2) : '0.00'}</td>
                <td>${category ? escapeHtml(category.name) : 'Uncategorized'}</td>
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
function editProduct(id) {
    const product = products.find(p => p.id === id);
    if (!product) {
        showNotification('Product not found', 'error');
        return;
    }

    currentProductId = id;
    document.getElementById('modalTitle').textContent = 'Edit Product';
    document.getElementById('productName').value = product.name;
    document.getElementById('productDescription').value = product.description || '';
    document.getElementById('productPrice').value = product.price || '';
    document.getElementById('productCategory').value = product.categoryId || '';
    document.getElementById('productModal').style.display = 'block';
}

// Save product (create or update)
function saveProduct(event) {
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

    // Check for duplicate names (excluding current product when editing)
    const duplicateProduct = products.find(p =>
        p.name.toLowerCase() === name.toLowerCase() &&
        p.id !== currentProductId
    );

    if (duplicateProduct) {
        showNotification('Product name already exists', 'error');
        return;
    }

    const productData = {
        name,
        description,
        price,
        categoryId
    };

    if (currentProductId) {
        // Update existing product
        const productIndex = products.findIndex(p => p.id === currentProductId);
        if (productIndex !== -1) {
            products[productIndex] = {
                ...products[productIndex],
                ...productData
            };
            showNotification('Product updated successfully', 'success');
        }
    } else {
        // Create new product
        const newProduct = {
            id: Math.max(...products.map(p => p.id), 0) + 1,
            ...productData
        };
        products.push(newProduct);
        showNotification('Product created successfully', 'success');
    }

    saveProducts();
    renderProductsTable();
    closeModal();
}

// Delete product
function deleteProduct(id) {
    const product = products.find(p => p.id === id);
    if (!product) {
        showNotification('Product not found', 'error');
        return;
    }

    if (!confirm(`Are you sure you want to delete "${product.name}"?`)) {
        return;
    }

    products = products.filter(p => p.id !== id);
    saveProducts();
    renderProductsTable();
    showNotification('Product deleted successfully', 'success');
}

// Filter products based on search and category
function filterProducts() {
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

    // Render filtered results
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
        const category = categories.find(c => c.id === product.categoryId);
        return `
            <tr>
                <td>${product.id}</td>
                <td>${escapeHtml(product.name)}</td>
                <td>${escapeHtml(product.description || 'No description')}</td>
                <td>$${product.price ? product.price.toFixed(2) : '0.00'}</td>
                <td>${category ? escapeHtml(category.name) : 'Uncategorized'}</td>
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

// Utility function to escape HTML
function escapeHtml(text) {
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

    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100px)';
        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}