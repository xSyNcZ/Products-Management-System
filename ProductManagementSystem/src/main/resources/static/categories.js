// Category Management JavaScript - API Connected
// This file handles all category-related operations with backend API

// Global variables
let categories = [];
let currentCategoryId = null;
const API_BASE_URL = 'http://localhost:8080/api';

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

// Get authentication headers
function getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
}

// Load categories from API
async function loadCategories() {
    try {
        const response = await fetch(`${API_BASE_URL}/categories`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        categories = await response.json();
        renderCategoriesTable();
    } catch (error) {
        console.error('Error loading categories:', error);
        showNotification('Failed to load categories. Please check your connection.', 'error');

        // Fallback to sample data for development
        /*categories = getSampleCategories();
        renderCategoriesTable();*/
    }
}

// Get sample categories data (fallback for development)
/*function getSampleCategories() {
    return [
        {
            id: 1,
            name: 'Electronics',
            description: 'Electronic devices and accessories',
            subCategoryIds: []
        },
        {
            id: 2,
            name: 'Clothing',
            description: 'Apparel and fashion items',
            subCategoryIds: []
        },
        {
            id: 3,
            name: 'Books',
            description: 'Books and educational materials',
            subCategoryIds: []
        },
        {
            id: 4,
            name: 'Home & Garden',
            description: 'Home improvement and gardening supplies',
            subCategoryIds: []
        },
        {
            id: 5,
            name: 'Sports',
            description: 'Sports equipment and accessories',
            subCategoryIds: []
        }
    ];
}*/

// Get product count for a category (this would need a products API endpoint)
async function getProductCountForCategory(categoryId) {
    try {
        // This endpoint would need to be implemented in your backend
        const response = await fetch(`${API_BASE_URL}/products/count-by-category/${categoryId}`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const count = await response.json();
            return count;
        }
        return 0;
    } catch (error) {
        console.error('Error getting product count:', error);
        return 0;
    }
}

// Render categories table
async function renderCategoriesTable() {
    const tbody = document.getElementById('categoriesTableBody');

    if (categories.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">No categories found</td></tr>';
        return;
    }

    // Get product counts for all categories
    const categoriesWithCounts = await Promise.all(
        categories.map(async (category) => {
            const productCount = await getProductCountForCategory(category.id);
            return { ...category, productCount };
        })
    );

    tbody.innerHTML = categoriesWithCounts.map(category => `
        <tr>
            <td>${category.id}</td>
            <td>${escapeHtml(category.name)}</td>
            <td>${escapeHtml(category.description || 'No description')}</td>
            <td>
                <div class="product-count-cell">
                    <span class="badge">${category.productCount || 0}</span>
                    <button onclick="viewCategoryProducts(${category.id})" class="btn btn-sm btn-info" title="View Products in this Category">
                        <i class="fas fa-eye"></i> View Products
                    </button>
                </div>
            </td>
            <td class="actions">
                <button onclick="editCategory(${category.id})" class="btn btn-sm btn-primary" title="Edit Category">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button onclick="deleteCategory(${category.id})" class="btn btn-sm btn-danger" title="Delete Category">
                    <i class="fas fa-trash"></i> Delete
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
async function handleCategorySubmit(event) {
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

    try {
        let response;

        if (currentCategoryId) {
            // Update existing category
            categoryData.id = currentCategoryId;
            response = await fetch(`${API_BASE_URL}/categories/${currentCategoryId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(categoryData)
            });
        } else {
            // Create new category
            response = await fetch(`${API_BASE_URL}/categories`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(categoryData)
            });
        }

        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorData}`);
        }

        const savedCategory = await response.json();

        if (currentCategoryId) {
            // Update local categories array
            const categoryIndex = categories.findIndex(c => c.id === currentCategoryId);
            if (categoryIndex !== -1) {
                categories[categoryIndex] = savedCategory;
            }
            showNotification('Category updated successfully', 'success');
        } else {
            // Add new category to local array
            categories.push(savedCategory);
            showNotification('Category created successfully', 'success');
        }

        renderCategoriesTable();
        closeCategoryModal();
    } catch (error) {
        console.error('Error saving category:', error);
        showNotification('Failed to save category: ' + error.message, 'error');
    }
}

// Delete category
async function deleteCategory(id) {
    const category = categories.find(c => c.id === id);
    if (!category) {
        showNotification('Category not found', 'error');
        return;
    }

    // Get product count for confirmation
    const productCount = await getProductCountForCategory(id);

    let confirmMessage = 'Are you sure you want to delete this category?';
    if (productCount > 0) {
        confirmMessage = `This category contains ${productCount} products. Are you sure you want to delete it?`;
    }

    if (!confirm(confirmMessage)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Remove from local categories array
        categories = categories.filter(c => c.id !== id);
        renderCategoriesTable();
        showNotification('Category deleted successfully', 'success');
    } catch (error) {
        console.error('Error deleting category:', error);
        showNotification('Failed to delete category: ' + error.message, 'error');
    }
}

// View products in category
async function viewCategoryProducts(categoryId) {
    const category = categories.find(c => c.id === categoryId);
    if (!category) {
        showNotification('Category not found', 'error');
        return;
    }

    document.getElementById('productsModalTitle').textContent = `Products in "${category.name}"`;
    await loadCategoryProducts(categoryId);
    document.getElementById('productsModal').style.display = 'block';
}

// Load products for a specific category
async function loadCategoryProducts(categoryId) {
    try {
        // This endpoint would need to be implemented in your backend
        const response = await fetch(`${API_BASE_URL}/products/by-category/${categoryId}`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const products = await response.json();
            renderCategoryProducts(products);
        } else {
            // Fallback to sample data
            /*const sampleProducts = getSampleProductsForCategory(categoryId);
            renderCategoryProducts(sampleProducts);*/
        }
    } catch (error) {
        console.error('Error loading category products:', error);
        // Fallback to sample data
        /*const sampleProducts = getSampleProductsForCategory(categoryId);
        renderCategoryProducts(sampleProducts);*/
    }
}

// Get sample products for a category (fallback)
/*function getSampleProductsForCategory(categoryId) {
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
}*/

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
            <td>$${product.price ? product.price.toFixed(2) : '0.00'}</td>
            <td>${escapeHtml(product.description || 'No description')}</td>
            <td class="actions">
                <button onclick="editProduct(${product.id})" class="btn btn-sm btn-primary" title="Edit Product">
                    <i class="fas fa-edit"></i> Edit Product
                </button>
                <button onclick="removeFromCategory(${product.id})" class="btn btn-sm btn-warning" title="Remove from Category">
                    <i class="fas fa-unlink"></i> Remove
                </button>
            </td>
        </tr>
    `).join('');
}

// Filter categories based on search input
async function filterCategories() {
    const searchTerm = document.getElementById('categorySearch').value.trim();

    if (!searchTerm) {
        // If empty search, reload all categories
        await loadCategories();
        return;
    }

    try {
        // Use the search endpoint from your CategoryController
        const response = await fetch(`${API_BASE_URL}/categories/search?query=${encodeURIComponent(searchTerm)}`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const filteredCategories = await response.json();
            // Temporarily replace categories array for rendering
            const originalCategories = categories;
            categories = filteredCategories;
            renderCategoriesTable();
            categories = originalCategories;
        } else {
            throw new Error('Search failed');
        }
    } catch (error) {
        console.error('Error searching categories:', error);
        // Fallback to client-side filtering
        const filteredCategories = categories.filter(category =>
            category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
        );

        const originalCategories = categories;
        categories = filteredCategories;
        renderCategoriesTable();
        categories = originalCategories;
    }
}

// Refresh categories
async function refreshCategories() {
    await loadCategories();
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

async function removeFromCategory(productId) {
    if (confirm('Remove this product from the category?')) {
        try {
            // This would need to be implemented in your backend
            // const response = await fetch(`${API_BASE_URL}/products/${productId}/remove-category`, {
            //     method: 'PUT',
            //     headers: getAuthHeaders()
            // });

            showNotification(`Product ${productId} removed from category`, 'success');

            // Refresh the products list
            const currentCategoryId = getCurrentCategoryIdFromModal();
            if (currentCategoryId) {
                await loadCategoryProducts(currentCategoryId);
            }
        } catch (error) {
            console.error('Error removing product from category:', error);
            showNotification('Failed to remove product from category', 'error');
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
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    }
}