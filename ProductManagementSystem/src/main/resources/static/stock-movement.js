// Stock Movement Management JavaScript with API Integration

let movements = [];
let filteredMovements = [];
let currentPage = 1;
const movementsPerPage = 10;
let products = [];
let warehouses = [];

// API Base URL
const API_BASE_URL = 'http://localhost:8080/api';

// Initialize stock movement page
document.addEventListener('DOMContentLoaded', function() {
    loadMovements();
    loadProducts();
    loadWarehouses();
    setDefaultDateTime();
});

// API Helper function
async function apiCall(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}

// Load stock movements from API
async function loadMovements() {
    try {
        movements = await apiCall('/stock-movements');
        filteredMovements = [...movements];
        displayMovements();
        setupPagination();
        updateSummary();
    } catch (error) {
        console.error('Error loading movements:', error);
        alert('Failed to load stock movements. Please check if the API server is running.');
        // Fallback to mock data for development
        loadMockMovements();
    }
}

// Fallback mock data for development
function loadMockMovements() {
    movements = [
        {
            id: 1,
            product: { id: 1, name: 'Product A' },
            warehouse: { id: 1, name: 'Main Warehouse', location: 'Downtown' },
            movementStatus: 'DELIVERED',
            quantity: 100.0,
            movementDate: '2024-01-15T09:30:00'
        },
        {
            id: 2,
            product: { id: 2, name: 'Product B' },
            warehouse: { id: 1, name: 'Main Warehouse', location: 'Downtown' },
            movementStatus: 'PROCESSING',
            quantity: -25.0,
            movementDate: '2024-01-16T14:20:00'
        },
        {
            id: 3,
            product: { id: 3, name: 'Product C' },
            warehouse: { id: 2, name: 'Secondary Warehouse', location: 'Industrial Area' },
            movementStatus: 'CREATED',
            quantity: 75.0,
            movementDate: '2024-01-17T11:15:00'
        }
    ];
    filteredMovements = [...movements];
    displayMovements();
    setupPagination();
    updateSummary();
}

// Load products from API
async function loadProducts() {
    try {
        products = await apiCall('/products');
        populateProductDropdowns();
    } catch (error) {
        console.error('Error loading products:', error);
        // Fallback to mock data
        products = [
            { id: 1, name: 'Product A' },
            { id: 2, name: 'Product B' },
            { id: 3, name: 'Product C' }
        ];
        populateProductDropdowns();
    }
}

// Load warehouses from API
async function loadWarehouses() {
    try {
        warehouses = await apiCall('/warehouses');
        populateWarehouseDropdowns();
    } catch (error) {
        console.error('Error loading warehouses:', error);
        // Fallback to mock data
        warehouses = [
            { id: 1, name: 'Main Warehouse', location: 'Downtown' },
            { id: 2, name: 'Secondary Warehouse', location: 'Industrial Area' }
        ];
        populateWarehouseDropdowns();
    }
}

// Populate product dropdowns
function populateProductDropdowns() {
    // Populate filter dropdown
    const productFilter = document.getElementById('productFilter');
    productFilter.innerHTML = '<option value="">All Products</option>';
    products.forEach(product => {
        const option = document.createElement('option');
        option.value = product.id;
        option.textContent = product.name;
        productFilter.appendChild(option);
    });

    // Populate movement form dropdown
    const movementProductSelect = document.getElementById('movementProductId');
    movementProductSelect.innerHTML = '<option value="">Select Product</option>';
    products.forEach(product => {
        const option = document.createElement('option');
        option.value = product.id;
        option.textContent = product.name;
        movementProductSelect.appendChild(option);
    });
}

// Populate warehouse dropdowns
function populateWarehouseDropdowns() {
    // Populate filter dropdown
    const warehouseFilter = document.getElementById('warehouseFilter');
    warehouseFilter.innerHTML = '<option value="">All Warehouses</option>';
    warehouses.forEach(warehouse => {
        const option = document.createElement('option');
        option.value = warehouse.id;
        option.textContent = `${warehouse.name} (${warehouse.location || ''})`;
        warehouseFilter.appendChild(option);
    });

    // Populate movement form dropdown
    const movementWarehouseSelect = document.getElementById('movementWarehouseId');
    movementWarehouseSelect.innerHTML = '<option value="">Select Warehouse</option>';
    warehouses.forEach(warehouse => {
        const option = document.createElement('option');
        option.value = warehouse.id;
        option.textContent = `${warehouse.name} (${warehouse.location || ''})`;
        movementWarehouseSelect.appendChild(option);
    });
}

// Display movements in table
function displayMovements() {
    const tbody = document.getElementById('movementsTableBody');
    tbody.innerHTML = '';

    const startIndex = (currentPage - 1) * movementsPerPage;
    const endIndex = startIndex + movementsPerPage;
    const movementsToDisplay = filteredMovements.slice(startIndex, endIndex);

    movementsToDisplay.forEach(movement => {
        const row = document.createElement('tr');

        const movementDate = new Date(movement.movementDate).toLocaleString();
        const quantityClass = movement.quantity >= 0 ? 'quantity-positive' : 'quantity-negative';
        const quantityPrefix = movement.quantity >= 0 ? '+' : '';

        row.innerHTML = `
            <td>#${movement.id}</td>
            <td>${movement.product?.name || 'Unknown Product'}</td>
            <td>${movement.warehouse?.name || 'Unknown Warehouse'}</td>
            <td class="${quantityClass}">${quantityPrefix}${movement.quantity}</td>
            <td><span class="movement-type movement-${getMovementTypeClass(movement)}">${movement.movementStatus}</span></td>
            <td>${movementDate}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="viewMovement(${movement.id})">View</button>
                <button class="btn btn-sm btn-warning" onclick="editMovement(${movement.id})">Edit</button>
                <button class="btn btn-sm btn-danger" onclick="deleteMovement(${movement.id})">Delete</button>
            </td>
        `;

        tbody.appendChild(row);
    });
}

// Get movement type class for styling
function getMovementTypeClass(movement) {
    if (movement.quantity > 0) return 'in';
    if (movement.quantity < 0) return 'out';
    return 'transfer';
}

// Filter movements
function filterMovements() {
    const warehouseFilter = document.getElementById('warehouseFilter').value;
    const productFilter = document.getElementById('productFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    const dateFromFilter = document.getElementById('dateFromFilter').value;
    const dateToFilter = document.getElementById('dateToFilter').value;

    filteredMovements = movements.filter(movement => {
        let matchesWarehouse = !warehouseFilter || movement.warehouse?.id == warehouseFilter;
        let matchesProduct = !productFilter || movement.product?.id == productFilter;
        let matchesStatus = !statusFilter || movement.movementStatus === statusFilter;

        let matchesDateRange = true;
        if (dateFromFilter || dateToFilter) {
            const movementDate = new Date(movement.movementDate);
            if (dateFromFilter) {
                matchesDateRange = matchesDateRange && movementDate >= new Date(dateFromFilter);
            }
            if (dateToFilter) {
                matchesDateRange = matchesDateRange && movementDate <= new Date(dateToFilter + 'T23:59:59');
            }
        }

        return matchesWarehouse && matchesProduct && matchesStatus && matchesDateRange;
    });

    currentPage = 1;
    displayMovements();
    setupPagination();
    updateSummary();
}

// Reset filters
function resetFilters() {
    document.getElementById('warehouseFilter').value = '';
    document.getElementById('productFilter').value = '';
    document.getElementById('statusFilter').value = '';
    document.getElementById('dateFromFilter').value = '';
    document.getElementById('dateToFilter').value = '';

    filteredMovements = [...movements];
    currentPage = 1;
    displayMovements();
    setupPagination();
    updateSummary();
}

// Setup pagination
function setupPagination() {
    const totalPages = Math.ceil(filteredMovements.length / movementsPerPage);
    const pagination = document.getElementById('movementsPagination');

    let paginationHTML = '';

    for (let i = 1; i <= totalPages; i++) {
        paginationHTML += `
            <button class="btn ${i === currentPage ? 'btn-primary' : 'btn-secondary'}" 
                    onclick="changePage(${i})">${i}</button>
        `;
    }

    pagination.innerHTML = paginationHTML;
}

// Change page
function changePage(page) {
    currentPage = page;
    displayMovements();
    setupPagination();
}

// Update summary statistics
function updateSummary() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaysMovements = filteredMovements.filter(movement => {
        const movementDate = new Date(movement.movementDate);
        movementDate.setHours(0, 0, 0, 0);
        return movementDate.getTime() === today.getTime();
    });

    const totalQuantityIn = filteredMovements
        .filter(m => m.quantity > 0)
        .reduce((sum, m) => sum + m.quantity, 0);

    const totalQuantityOut = Math.abs(filteredMovements
        .filter(m => m.quantity < 0)
        .reduce((sum, m) => sum + m.quantity, 0));

    document.getElementById('totalMovements').textContent = filteredMovements.length;
    document.getElementById('movementsToday').textContent = todaysMovements.length;
    document.getElementById('totalQuantityIn').textContent = totalQuantityIn.toFixed(0);
    document.getElementById('totalQuantityOut').textContent = totalQuantityOut.toFixed(0);
}

// Show create movement modal
function showCreateMovementModal() {
    document.getElementById('createMovementModal').style.display = 'block';
}

// Close create movement modal
function closeCreateMovementModal() {
    document.getElementById('createMovementModal').style.display = 'none';
    document.getElementById('createMovementForm').reset();
    setDefaultDateTime();
}

// Set default date time
function setDefaultDateTime() {
    const now = new Date();
    const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    document.getElementById('movementDate').value = localDateTime;
}

// Handle create movement form submission
document.getElementById('createMovementForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const formData = {
        productId: parseInt(document.getElementById('movementProductId').value),
        warehouseId: parseInt(document.getElementById('movementWarehouseId').value),
        quantity: parseFloat(document.getElementById('movementQuantity').value),
        movementStatus: document.getElementById('movementStatus').value,
        movementDate: document.getElementById('movementDate').value
    };

    try {
        const createdMovement = await apiCall('/stock-movements', {
            method: 'POST',
            body: JSON.stringify(formData)
        });

        // Reload movements to get the updated list
        await loadMovements();
        closeCreateMovementModal();
        alert('Stock movement recorded successfully');

    } catch (error) {
        console.error('Error creating movement:', error);
        alert('Failed to record stock movement. Please check the API connection.');
    }
});

// View movement details
async function viewMovement(movementId) {
    try {
        const movement = await apiCall(`/stock-movements/${movementId}`);

        alert(`Movement Details:
Product: ${movement.product?.name || 'Unknown'}
Warehouse: ${movement.warehouse?.name || 'Unknown'}
Quantity: ${movement.quantity}
Status: ${movement.movementStatus}
Date: ${new Date(movement.movementDate).toLocaleString()}`);
    } catch (error) {
        console.error('Error loading movement details:', error);
        alert('Failed to load movement details');
    }
}

// Edit movement
function editMovement(movementId) {
    alert(`Edit movement ${movementId} - Feature to be implemented`);
    // TODO: Implement edit functionality
    // You can create an edit modal similar to the create modal
    // and use PUT request to update the movement
}

// Delete movement
async function deleteMovement(movementId) {
    if (confirm('Are you sure you want to delete this movement?')) {
        try {
            await apiCall(`/stock-movements/${movementId}`, {
                method: 'DELETE'
            });

            // Reload movements after deletion
            await loadMovements();
            alert('Movement deleted successfully');

        } catch (error) {
            console.error('Error deleting movement:', error);
            alert('Failed to delete movement');
        }
    }
}

// Load movements by product (for filtering)
async function loadMovementsByProduct(productId) {
    try {
        const movements = await apiCall(`/stock-movements/product/${productId}`);
        return movements;
    } catch (error) {
        console.error('Error loading movements by product:', error);
        return [];
    }
}

// Load movements by warehouse (for filtering)
async function loadMovementsByWarehouse(warehouseId) {
    try {
        const movements = await apiCall(`/stock-movements/warehouse/${warehouseId}`);
        return movements;
    } catch (error) {
        console.error('Error loading movements by warehouse:', error);
        return [];
    }
}

// Complete stock movement
async function completeMovement(movementId) {
    try {
        const completedMovement = await apiCall(`/stock-movements/${movementId}/complete`, {
            method: 'PUT'
        });

        // Reload movements to reflect the change
        await loadMovements();
        alert('Movement completed successfully');
    } catch (error) {
        console.error('Error completing movement:', error);
        alert('Failed to complete movement');
    }
}

// Cancel stock movement
async function cancelMovement(movementId) {
    if (confirm('Are you sure you want to cancel this movement?')) {
        try {
            const cancelledMovement = await apiCall(`/stock-movements/${movementId}/cancel`, {
                method: 'PUT'
            });

            // Reload movements to reflect the change
            await loadMovements();
            alert('Movement cancelled successfully');
        } catch (error) {
            console.error('Error cancelling movement:', error);
            alert('Failed to cancel movement');
        }
    }
}