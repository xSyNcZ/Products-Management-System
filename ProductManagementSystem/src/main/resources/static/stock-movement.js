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

// API Helper function with improved error handling
async function apiCall(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });

        // Check if response is ok
        if (!response.ok) {
            let errorMessage = `HTTP error! status: ${response.status}`;

            // Try to get error details from response
            try {
                const errorData = await response.json();
                if (errorData.message) {
                    errorMessage += ` - ${errorData.message}`;
                }
            } catch (e) {
                // If response is not JSON, try to get text
                try {
                    const errorText = await response.text();
                    if (errorText) {
                        errorMessage += ` - ${errorText}`;
                    }
                } catch (e2) {
                    // Ignore if we can't get error details
                }
            }

            throw new Error(errorMessage);
        }

        // Handle empty responses (like DELETE operations)
        const contentType = response.headers.get('content-type');
        if (response.status === 204) {
            return {}; // No content
        }

        if (contentType && contentType.includes('application/json')) {
            const responseText = await response.text();
            return responseText ? JSON.parse(responseText) : {};
        } else {
            return {};
        }
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
            productId: 1,
            productName: 'Product A',
            sourceWarehouseId: 1,
            sourceWarehouseName: 'Main Warehouse',
            destinationWarehouseId: null,
            destinationWarehouseName: null,
            quantity: 100,
            status: 'COMPLETED',
            movementDate: '2024-01-15T09:30:00',
            initiatedById: 1,
            initiatedByName: 'John Doe',
            notes: 'Stock in'
        },
        {
            id: 2,
            productId: 2,
            productName: 'Product B',
            sourceWarehouseId: 1,
            sourceWarehouseName: 'Main Warehouse',
            destinationWarehouseId: 2,
            destinationWarehouseName: 'Secondary Warehouse',
            quantity: 25,
            status: 'PENDING',
            movementDate: '2024-01-16T14:20:00',
            initiatedById: 1,
            initiatedByName: 'John Doe',
            notes: 'Transfer between warehouses'
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
    if (productFilter) {
        productFilter.innerHTML = '<option value="">All Products</option>';
        products.forEach(product => {
            const option = document.createElement('option');
            option.value = product.id;
            option.textContent = product.name;
            productFilter.appendChild(option);
        });
    }

    // Populate movement form dropdown
    const movementProductSelect = document.getElementById('movementProductId');
    if (movementProductSelect) {
        movementProductSelect.innerHTML = '<option value="">Select Product</option>';
        products.forEach(product => {
            const option = document.createElement('option');
            option.value = product.id;
            option.textContent = product.name;
            movementProductSelect.appendChild(option);
        });
    }
}

// Populate warehouse dropdowns
function populateWarehouseDropdowns() {
    // Populate filter dropdown
    const warehouseFilter = document.getElementById('warehouseFilter');
    if (warehouseFilter) {
        warehouseFilter.innerHTML = '<option value="">All Warehouses</option>';
        warehouses.forEach(warehouse => {
            const option = document.createElement('option');
            option.value = warehouse.id;
            option.textContent = `${warehouse.name}${warehouse.location ? ' (' + warehouse.location + ')' : ''}`;
            warehouseFilter.appendChild(option);
        });
    }

    // Populate movement form dropdown - this matches the HTML element
    const movementWarehouseSelect = document.getElementById('movementWarehouseId');
    if (movementWarehouseSelect) {
        movementWarehouseSelect.innerHTML = '<option value="">Select Warehouse</option>';
        warehouses.forEach(warehouse => {
            const option = document.createElement('option');
            option.value = warehouse.id;
            option.textContent = `${warehouse.name}${warehouse.location ? ' (' + warehouse.location + ')' : ''}`;
            movementWarehouseSelect.appendChild(option);
        });
    }
}

// Display movements in table
function displayMovements() {
    const tbody = document.getElementById('movementsTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    const startIndex = (currentPage - 1) * movementsPerPage;
    const endIndex = startIndex + movementsPerPage;
    const movementsToDisplay = filteredMovements.slice(startIndex, endIndex);

    movementsToDisplay.forEach(movement => {
        const row = document.createElement('tr');

        const movementDate = new Date(movement.movementDate).toLocaleString();

        // Determine warehouse info based on source and destination
        let warehouseInfo = '';
        if (movement.sourceWarehouseId && movement.destinationWarehouseId) {
            // Transfer between warehouses
            warehouseInfo = `${movement.sourceWarehouseName} → ${movement.destinationWarehouseName}`;
        } else if (movement.sourceWarehouseId && !movement.destinationWarehouseId) {
            // Stock out
            warehouseInfo = movement.sourceWarehouseName;
        } else if (!movement.sourceWarehouseId && movement.destinationWarehouseId) {
            // Stock in
            warehouseInfo = movement.destinationWarehouseName;
        } else {
            warehouseInfo = 'Unknown';
        }

        const statusClass = getStatusClass(movement.status);

        row.innerHTML = `
            <td>#${movement.id}</td>
            <td>${movement.productName || 'Unknown Product'}</td>
            <td>${warehouseInfo}</td>
            <td>${movement.quantity}</td>
            <td><span class="status status-${statusClass}">${movement.status}</span></td>
            <td>${movementDate}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="viewMovement(${movement.id})">View</button>
                ${movement.status === 'PENDING' ? `
                    <button class="btn btn-sm btn-success" onclick="completeMovement(${movement.id})">Complete</button>
                    <button class="btn btn-sm btn-warning" onclick="cancelMovement(${movement.id})">Cancel</button>
                ` : ''}
                ${movement.status !== 'COMPLETED' ? `
                    <button class="btn btn-sm btn-danger" onclick="deleteMovement(${movement.id})">Delete</button>
                ` : ''}
            </td>
        `;

        tbody.appendChild(row);
    });
}

// Get status class for styling
function getStatusClass(status) {
    switch(status) {
        case 'PENDING': return 'pending';
        case 'COMPLETED': return 'completed';
        case 'CANCELLED': return 'cancelled';
        case 'PROCESSING': return 'processing';
        case 'SHIPPED': return 'shipped';
        case 'DELIVERED': return 'delivered';
        case 'RETURNED': return 'returned';
        default: return 'unknown';
    }
}

// Filter movements
function filterMovements() {
    const warehouseFilter = document.getElementById('warehouseFilter')?.value || '';
    const productFilter = document.getElementById('productFilter')?.value || '';
    const statusFilter = document.getElementById('statusFilter')?.value || '';
    const dateFromFilter = document.getElementById('dateFromFilter')?.value || '';
    const dateToFilter = document.getElementById('dateToFilter')?.value || '';

    filteredMovements = movements.filter(movement => {
        let matchesWarehouse = !warehouseFilter ||
            movement.sourceWarehouseId == warehouseFilter ||
            movement.destinationWarehouseId == warehouseFilter;

        let matchesProduct = !productFilter || movement.productId == productFilter;
        let matchesStatus = !statusFilter || movement.status === statusFilter;

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
    const warehouseFilter = document.getElementById('warehouseFilter');
    const productFilter = document.getElementById('productFilter');
    const statusFilter = document.getElementById('statusFilter');
    const dateFromFilter = document.getElementById('dateFromFilter');
    const dateToFilter = document.getElementById('dateToFilter');

    if (warehouseFilter) warehouseFilter.value = '';
    if (productFilter) productFilter.value = '';
    if (statusFilter) statusFilter.value = '';
    if (dateFromFilter) dateFromFilter.value = '';
    if (dateToFilter) dateToFilter.value = '';

    filteredMovements = [...movements];
    currentPage = 1;
    displayMovements();
    setupPagination();
    updateSummary();
}

// Setup pagination
function setupPagination() {
    const pagination = document.getElementById('movementsPagination');
    if (!pagination) return;

    const totalPages = Math.ceil(filteredMovements.length / movementsPerPage);

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

// Update summary statistics - Fixed to match HTML elements
function updateSummary() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaysMovements = filteredMovements.filter(movement => {
        const movementDate = new Date(movement.movementDate);
        movementDate.setHours(0, 0, 0, 0);
        return movementDate.getTime() === today.getTime();
    });

    // Calculate quantity in and out
    let quantityIn = 0;
    let quantityOut = 0;

    filteredMovements.forEach(movement => {
        if (movement.destinationWarehouseId && !movement.sourceWarehouseId) {
            // Stock in (only destination warehouse)
            quantityIn += movement.quantity || 0;
        } else if (movement.sourceWarehouseId && !movement.destinationWarehouseId) {
            // Stock out (only source warehouse)
            quantityOut += movement.quantity || 0;
        }
    });

    const totalMovementsEl = document.getElementById('totalMovements');
    const movementsTodayEl = document.getElementById('movementsToday');
    const totalQuantityInEl = document.getElementById('totalQuantityIn');
    const totalQuantityOutEl = document.getElementById('totalQuantityOut');

    if (totalMovementsEl) totalMovementsEl.textContent = filteredMovements.length;
    if (movementsTodayEl) movementsTodayEl.textContent = todaysMovements.length;
    if (totalQuantityInEl) totalQuantityInEl.textContent = quantityIn;
    if (totalQuantityOutEl) totalQuantityOutEl.textContent = quantityOut;
}

// Show create movement modal
function showCreateMovementModal() {
    const modal = document.getElementById('createMovementModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

// Close create movement modal
function closeCreateMovementModal() {
    const modal = document.getElementById('createMovementModal');
    const form = document.getElementById('createMovementForm');

    if (modal) modal.style.display = 'none';
    if (form) form.reset();
    setDefaultDateTime();
}

// Set default date time
function setDefaultDateTime() {
    const movementDateEl = document.getElementById('movementDate');
    if (movementDateEl) {
        const now = new Date();
        const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        movementDateEl.value = localDateTime;
    }
}

// Validate form data - Updated to work with HTML form
function validateMovementForm(formData) {
    const errors = [];

    if (!formData.productId || formData.productId === '') {
        errors.push('Please select a product');
    }

    if (!formData.quantity || isNaN(formData.quantity) || formData.quantity <= 0) {
        errors.push('Please enter a valid quantity (must be greater than zero)');
    }

    if (!formData.sourceWarehouseId && !formData.destinationWarehouseId) {
        errors.push('Please select a warehouse');
    }

    if (!formData.movementDate || formData.movementDate === '') {
        errors.push('Please select a movement date');
    }

    return errors;
}

// Handle create movement form submission - Fixed to work with HTML form
document.addEventListener('DOMContentLoaded', function() {
    const createMovementForm = document.getElementById('createMovementForm');
    if (createMovementForm) {
        createMovementForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            // Get form elements from the actual HTML
            const productIdEl = document.getElementById('movementProductId');
            const warehouseIdEl = document.getElementById('movementWarehouseId');
            const quantityEl = document.getElementById('movementQuantity');
            const statusEl = document.getElementById('movementStatus');
            const dateEl = document.getElementById('movementDate');

            // Check if required elements exist
            if (!productIdEl || !quantityEl || !dateEl || !warehouseIdEl) {
                alert('Required form elements are missing. Please check the HTML structure.');
                return;
            }

            const quantity = parseFloat(quantityEl.value);
            const warehouseId = parseInt(warehouseIdEl.value);

            // Determine if this is stock in or stock out based on quantity sign
            let sourceWarehouseId = null;
            let destinationWarehouseId = null;

            if (quantity > 0) {
                // Positive quantity = stock in (destination warehouse)
                destinationWarehouseId = warehouseId;
            } else {
                // Negative quantity = stock out (source warehouse) - convert to positive
                sourceWarehouseId = warehouseId;
            }

            const formData = {
                productId: parseInt(productIdEl.value) || null,
                sourceWarehouseId: sourceWarehouseId,
                destinationWarehouseId: destinationWarehouseId,
                quantity: Math.abs(quantity), // Always send positive quantity
                movementDate: dateEl.value,
                notes: `Movement via web interface - ${quantity > 0 ? 'Stock In' : 'Stock Out'}`
            };

            // Basic validation
            if (!formData.productId || !warehouseId || !formData.quantity || formData.quantity <= 0) {
                alert('Please fill in all required fields with valid values');
                return;
            }

            try {
                // Show loading state
                const submitBtn = e.target.querySelector('button[type="submit"]');
                const originalText = submitBtn ? submitBtn.textContent : '';
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.textContent = 'Recording...';
                }

                console.log('Sending movement data:', formData);

                const createdMovement = await apiCall('/stock-movements', {
                    method: 'POST',
                    body: JSON.stringify(formData)
                });

                console.log('Movement created successfully:', createdMovement);

                // Reload movements to get the updated list
                await loadMovements();
                closeCreateMovementModal();
                alert('Stock movement recorded successfully');

            } catch (error) {
                console.error('Error creating movement:', error);

                // Provide more specific error messages
                let errorMessage = 'Failed to record stock movement.';

                if (error.message.includes('404')) {
                    errorMessage += ' The API endpoint was not found. Please check the server configuration.';
                } else if (error.message.includes('500')) {
                    errorMessage += ' Server error occurred. Please check the server logs.';
                } else if (error.message.includes('400')) {
                    errorMessage += ' Invalid data sent to server. Please check the form inputs.';
                } else if (error.message.includes('Failed to fetch')) {
                    errorMessage += ' Cannot connect to the API server. Please check if the server is running and accessible.';
                } else {
                    errorMessage += ` Error: ${error.message}`;
                }

                alert(errorMessage);
            } finally {
                // Reset button state
                const submitBtn = e.target.querySelector('button[type="submit"]');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText || 'Record Movement';
                }
            }
        });
    }
});

// View movement details
async function viewMovement(movementId) {
    try {
        const movement = await apiCall(`/stock-movements/${movementId}`);

        let warehouseInfo = '';
        if (movement.sourceWarehouseName && movement.destinationWarehouseName) {
            warehouseInfo = `From: ${movement.sourceWarehouseName}\nTo: ${movement.destinationWarehouseName}`;
        } else if (movement.sourceWarehouseName) {
            warehouseInfo = `From: ${movement.sourceWarehouseName}`;
        } else if (movement.destinationWarehouseName) {
            warehouseInfo = `To: ${movement.destinationWarehouseName}`;
        }

        alert(`Movement Details:
ID: #${movement.id}
Product: ${movement.productName || 'Unknown'}
${warehouseInfo}
Quantity: ${movement.quantity}
Status: ${movement.status}
Date: ${new Date(movement.movementDate).toLocaleString()}
Initiated By: ${movement.initiatedByName || 'Unknown'}
Notes: ${movement.notes || 'No notes'}`);
    } catch (error) {
        console.error('Error loading movement details:', error);
        alert('Failed to load movement details');
    }
}

// Complete stock movement
async function completeMovement(movementId) {
    if (confirm('Are you sure you want to complete this movement? This action will update the stock levels.')) {
        try {
            await apiCall(`/stock-movements/${movementId}/complete`, {
                method: 'PUT'
            });

            // Reload movements to reflect the change
            await loadMovements();
            alert('Movement completed successfully');
        } catch (error) {
            console.error('Error completing movement:', error);
            let errorMessage = 'Failed to complete movement';
            if (error.message.includes('Insufficient stock')) {
                errorMessage = 'Insufficient stock available for this movement';
            }
            alert(errorMessage);
        }
    }
}

// Cancel stock movement
async function cancelMovement(movementId) {
    if (confirm('Are you sure you want to cancel this movement?')) {
        try {
            await apiCall(`/stock-movements/${movementId}/cancel`, {
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
            let errorMessage = 'Failed to delete movement';
            if (error.message.includes('Cannot delete completed')) {
                errorMessage = 'Cannot delete completed stock movements';
            }
            alert(errorMessage);
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

// Load movement statistics
async function loadMovementStatistics() {
    try {
        const statistics = await apiCall('/stock-movements/statistics');
        return statistics;
    } catch (error) {
        console.error('Error loading movement statistics:', error);
        return {};
    }
}

// Get recent movements
async function loadRecentMovements() {
    try {
        const recentMovements = await apiCall('/stock-movements/recent');
        return recentMovements;
    } catch (error) {
        console.error('Error loading recent movements:', error);
        return [];
    }
}