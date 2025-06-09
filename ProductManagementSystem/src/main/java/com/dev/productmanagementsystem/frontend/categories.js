// Category Management JavaScript
// This file handles all category-related operations

// Global variables
let categories = [];
let currentCategoryId = null;

// Initialize the page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    loadCategories();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Category form submission
    document.getElementById('categoryForm').addEventListener('submit', handleCategorySubmit);

    // Modal close on outside click
    window.addEventListener('click', function(event) {
        const categoryModal = document.getElementById('categoryModal');
        const productsModal = document.getElementById('productsModal');

        if (event.target === categoryModal) {
            closeCategoryModal();
        }
        if (event.target === productsModal) {
            closeProductsModal();
        }
    });

    // Search input real-time filtering
    document.getElementById('categorySearch').addEventListener('input', filterCategories);
}

// Load categories from localStorage
function loadCategories() {
    try {
        const storedCategories = localStorage.getItem('categories');
        categories = storedCategories ? JSON.parse(storedCategories) : getSampleCategories();

        // If no stored categories, save sample data
        if (!storedCategories) {
            saveCategories();
        }

        renderCategoriesTable();
    } catch (error) {
        console.error('Error loading categories:', error);
        categories = getSampleCategories();
        renderCategoriesTable();
    }
}

// Get sample categories data
function getSampleCategories() {
    return [
        {
            id: 1,
            name: 'Electronics',
            description: 'Electronic devices and accessories',
            productCount: 15
        },
        {
            id: 2,
            name: 'Clothing',
            description: 'Apparel and fashion items',
            productCount: 8
        },
        {
            id: 3,
            name: 'Books',
            description: 'Books and educational materials',
            productCount: 12
        },
        {
            id: 4,
            name: 'Home & Garden',
            description: 'Home improvement and gardening supplies',
            productCount: 6
        },
        {
            id: 5,
            name: 'Sports',
            description: 'Sports equipment and accessories',
            productCount: 9
        }
    ];
}

// Save categories to localStorage
function saveCategories() {
    try {
        localStorage.setItem('categories', JSON.stringify(categories));
    } catch (error) {
        console.error('Error saving categories:', error);
        showNotification('Error saving categories', 'error');
    }
}

// Render categories table
function renderCategoriesTable() {
    const tbody = document.getElementById('categoriesTableBody');

    if (categories.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">No categories found</td></tr>';
        return;
    }

    tbody.innerHTML = categories.map(category => `
        <tr>
            <td>${category.id}</td>
            <td>${escapeHtml(category.name)}</td>
            <td>${escapeHtml(category.description || 'No description')}</td>
            <td>
                <span class="badge">${category.productCount || 0}</span>
                <button onclick="viewCategoryProducts(${category.id})" class="btn btn-sm btn-info" title="View Products">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
            <td class="actions">
                <button onclick="editCategory(${category.id})" class="btn btn-sm btn-primary" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteCategory(${category.id})" class="btn btn-sm btn-danger" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Show create category modal
function showCreateCategoryModal() {
    currentCategoryId = null;
    document.getElementById('modalTitle').textContent = 'Create Category';
    document.getElementById('categoryForm').reset();
    document.getElementById('categoryModal').style.display = 'block';
}

// Show edit category modal
function editCategory(id) {
    const category = categories.find(c => c.id === id);
    if (!category) {
        showNotification('Category not found', 'error');
        return;
    }

    currentCategoryId = id;
    document.getElementById('modalTitle').textContent = 'Edit Category';
    document.getElementById('categoryName').value = category.name;
    document.getElementById('categoryDescription').value = category.description || '';
    document.getElementById('categoryModal').style.display = 'block';
}

// Handle category form submission
function handleCategorySubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const categoryData = {
        name: formData.get('name').trim(),
        description: formData.get('description').trim()
    };

    // Validation
    if (!categoryData.name) {
        showNotification('Category name is required', 'error');
        return;
    }

    // Check for duplicate names (excluding current category when editing)
    const duplicateCategory = categories.find(c =>
        c.name.toLowerCase() === categoryData.name.toLowerCase() &&
        c.id !== currentCategoryId
    );

    if (duplicateCategory) {
        showNotification('Category name already exists', 'error');
        return;
    }

    if (currentCategoryId) {
        // Update existing category
        const categoryIndex = categories.findIndex(c => c.id === currentCategoryId);
        if (categoryIndex !== -1) {
            categories[categoryIndex] = {
                ...categories[categoryIndex],
                ...categoryData
            };
            showNotification('Category updated successfully', 'success');
        }
    } else {
        // Create new category
        const newCategory = {
            id: Math.max(...categories.map(c => c.id), 0) + 1,
            ...categoryData,
            productCount: 0
        };
        categories.push(newCategory);
        showNotification('Category created successfully', 'success');
    }

    saveCategories();
    renderCategoriesTable();
    closeCategoryModal();
}

// Delete category
function deleteCategory(id) {
    const category = categories.find(c => c.id === id);
    if (!category) {
        showNotification('Category not found', 'error');
        return;
    }

    if (category.productCount > 0) {
        if (!confirm(`This category contains ${category.productCount} products. Are you sure you want to delete it?`)) {
            return;
        }
    } else {
        if (!confirm('Are you sure you want to delete this category?')) {
            return;
        }
    }

    categories = categories.filter(c => c.id !== id);
    saveCategories();
    renderCategoriesTable();
    showNotification('Category deleted successfully', 'success');
}

// View products in category
function viewCategoryProducts(categoryId) {
    const category = categories.find(c => c.id === categoryId);
    if (!category) {
        showNotification('Category not found', 'error');
        return;
    }

    document.getElementById('productsModalTitle').textContent = `Products in "${category.name}"`;
    loadCategoryProducts(categoryId);
    document.getElementById('productsModal').style.display = 'block';
}

// Load products for a specific category
function loadCategoryProducts(categoryId) {
    // This would typically load from your products data
    // For now, we'll show sample products
    const sampleProducts = getSampleProductsForCategory(categoryId);
    renderCategoryProducts(sampleProducts);
}

// Get sample products for a category
function getSampleProductsForCategory(categoryId) {
    const productsByCategory = {
        1: [ // Electronics
            { id: 1, name: 'Smartphone', price: 699.99, description: 'Latest smartphone with advanced features' },
            { id: 2, name: 'Laptop', price: 1299.99, description: 'High-performance laptop for work and gaming' },
            { id: 3, name: 'Headphones', price: 199.99, description: 'Wireless noise-canceling headphones' }
        ],
        2: [ // Clothing
            { id: 4, name: 'T-Shirt', price: 29.99, description: 'Comfortable cotton t-shirt' },
            { id: 5, name: 'Jeans', price: 79.99, description: 'Classic denim jeans' }
        ],
        3: [ // Books
            { id: 6, name: 'Programming Book', price: 49.99, description: 'Learn programming fundamentals' },
            { id: 7, name: 'Fiction Novel', price: 14.99, description: 'Bestselling fiction novel' }
        ],
        4: [ // Home & Garden
            { id: 8, name: 'Garden Tools Set', price: 89.99, description: 'Complete set of garden tools' },
            { id: 9, name: 'Indoor Plant', price: 24.99, description: 'Beautiful indoor plant for decoration' }
        ],
        5: [ // Sports
            { id: 10, name: 'Basketball', price: 34.99, description: 'Professional basketball' },
            { id: 11, name: 'Running Shoes', price: 129.99, description: 'Comfortable running shoes' }
        ]
    };

    return productsByCategory[categoryId] || [];
}

// Render category products
function renderCategoryProducts(products) {
    const tbody = document.getElementById('categoryProductsBody');

    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">No products found in this category</td></tr>';
        return;
    }

    tbody.innerHTML = products.map(product => `
        <tr>
            <td>${product.id}</td>
            <td>${escapeHtml(product.name)}</td>
            <td>$${product.price.toFixed(2)}</td>
            <td>${escapeHtml(product.description || 'No description')}</td>
            <td class="actions">
                <button onclick="editProduct(${product.id})" class="btn btn-sm btn-primary" title="Edit Product">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="removeFromCategory(${product.id})" class="btn btn-sm btn-warning" title="Remove from Category">
                    <i class="fas fa-unlink"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Filter categories based on search input
function filterCategories() {
    const searchTerm = document.getElementById('categorySearch').value.toLowerCase();
    const filteredCategories = categories.filter(category =>
        category.name.toLowerCase().includes(searchTerm) ||
        (category.description && category.description.toLowerCase().includes(searchTerm))
    );

    // Temporarily replace categories array for rendering
    const originalCategories = categories;
    categories = filteredCategories;
    renderCategoriesTable();
    categories = originalCategories;
}

// Refresh categories
function refreshCategories() {
    loadCategories();
    document.getElementById('categorySearch').value = '';
    showNotification('Categories refreshed', 'info');
}

// Close category modal
function closeCategoryModal() {
    document.getElementById('categoryModal').style.display = 'none';
    currentCategoryId = null;
}

// Close products modal
function closeProductsModal() {
    document.getElementById('productsModal').style.display = 'none';
}

// Placeholder functions for product operations
function editProduct(productId) {
    showNotification(`Edit product ${productId} - This would redirect to products page`, 'info');
}

function removeFromCategory(productId) {
    if (confirm('Remove this product from the category?')) {
        showNotification(`Product ${productId} removed from category`, 'success');
        // Refresh the products list
        const currentCategoryId = getCurrentCategoryIdFromModal();
        if (currentCategoryId) {
            loadCategoryProducts(currentCategoryId);
        }
    }
}

// Helper function to get current category ID from modal title
function getCurrentCategoryIdFromModal() {
    const title = document.getElementById('productsModalTitle').textContent;
    const match = title.match(/Products in "(.+)"/);
    if (match) {
        const categoryName = match[1];
        const category = categories.find(c => c.name === categoryName);
        return category ? category.id : null;
    }
    return null;
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

    // Add to page
    document.body.appendChild(notification);

    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);

    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        // Clear any session data if needed
        window.location.href = 'login.html';
    }
}