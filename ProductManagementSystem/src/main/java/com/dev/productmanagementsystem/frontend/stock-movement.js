// Stock Movement Management JavaScript

let movements = [];
let filteredMovements = [];
let currentPage = 1;
const movementsPerPage = 10;
let products = [];
let warehouses = [];

// Initialize stock movement page
document.addEventListener('DOMContentLoaded', function() {
    loadMovements();
    loadProducts();
    loadWarehouses();
    setDefaultDateTime();
});

// Load stock movements from API
async function loadMovements() {
    try {
        // Mock data - replace with actual API call
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

        // In real implementation:
        // movements = await PMS.apiCall('/stock-movements');

        filteredMovements = [...movements];
        displayMovements();
        setupPagination();
        updateSummary();
    } catch (error) {
        console.error('Error loading movements:', error);
        alert('Failed to load stock movements');
    }
}

// Load products
async function loadProducts() {
    try {
        // Mock data - replace with actual API call
        products = [
            { id: 1, name: 'Product A' },
            { id: 2, name: 'Product B' },
            { id: 3, name: 'Product C' }
        ];

        // Populate filter dropdown
        const productFilter = document.getElementById('productFilter');
        products.forEach(product => {
            const option = document.createElement('option');
            option.value = product.id;
            option.textContent = product.name;
            productFilter.appendChild(option);
        });

        // Populate movement form dropdown
        const movementProductSelect = document.getElementById('movementProductId');
        products.forEach(product => {
            const option = document.createElement('option');
            option.value = product.id;
            option.textContent = product.name;
            movementProductSelect.appendChild(option);
        });

    } catch (error) {
        console.error('Error loading products:', error);
    }
}

// Load warehouses
async function loadWarehouses() {
    try {
        // Mock data - replace with actual API call
        warehouses = [
            { id: 1, name: 'Main Warehouse', location: 'Downtown' },
            { id: 2, name: 'Secondary Warehouse', location: 'Industrial Area' }
        ];

        // Populate filter dropdown
        const warehouseFilter = document.getElementById('warehouseFilter');
        warehouses.forEach(warehouse => {
            const option = document.createElement('option');
            option.value = warehouse.id;
            option.textContent = `${warehouse.name} (${warehouse.location})`;
            warehouseFilter.appendChild(option);
        });

        // Populate movement form dropdown
        const movementWarehouseSelect = document.getElementById('movementWarehouseId');
        warehouses.forEach(warehouse => {
            const option = document.createElement('option');
            option.value = warehouse.id;
            option.textContent = `${warehouse.name} (${warehouse.location})`;
            movementWarehouseSelect.appendChild(option);
        });

    } catch (error) {
        console.error('Error loading warehouses:', error);
    }
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
            <td>${movement.product.name}</td>
            <td>${movement.warehouse.name}</td>
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
        let matchesWarehouse = !warehouseFilter || movement.warehouse.id == warehouseFilter;
        let matchesProduct = !productFilter || movement.product.id == productFilter;
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
        productId: document.getElementById('movementProductId').value,
        warehouseId: document.getElementById('movementWarehouseId').value,
        quantity: parseFloat(document.getElementById('movementQuantity').value),
        movementStatus: document.getElementById('movementStatus').value,
        movementDate: document.getElementById('movementDate').value
    };

    try {
        // In real implementation:
        // await PMS.apiCall('/stock-movements', {
        //     method: 'POST',
        //     body: JSON.stringify(formData)
        // });

        // Mock implementation - add to local array
        const newMovement = {
            id: movements.length + 1,
            product: products.find(p => p.id == formData.productId),
            warehouse: warehouses.find(w => w.id == formData.warehouseId),
            quantity: formData.quantity,
            movementStatus: formData.movementStatus,
            movementDate: formData.movementDate
        };

        movements.unshift(newMovement);
        filteredMovements = [...movements];

        displayMovements();
        setupPagination();
        updateSummary();
        closeCreateMovementModal();

        alert('Stock movement recorded successfully');

    } catch (error) {
        console.error('Error creating movement:', error);
        alert('Failed to record stock movement');
    }
});

// View movement details
function viewMovement(movementId) {
    const movement = movements.find(m => m.id === movementId);
    if (!movement) return;

    alert(`Movement Details:
Product: ${movement.product.name}
Warehouse: ${movement.warehouse.name}
Quantity: ${movement.quantity}
Status: ${movement.movementStatus}
Date: ${new Date(movement.movementDate).toLocaleString()}`);
}

// Edit movement
function editMovement(movementId) {
    alert(`Edit movement ${movementId} - Feature to be implemented`);
}

// Delete movement
async function deleteMovement(movementId) {
    if (confirm('Are you sure you want to delete this movement?')) {
        try {
            // In real implementation:
            // await PMS.apiCall(`/stock-movements/${movementId}`, { method: 'DELETE' });

            // Remove from local array
            const index = movements.findIndex(m => m.id === movementId);
            if (index > -1) {
                movements.splice(index, 1);
                filteredMovements = movements.filter(m =>
                    filteredMovements.some(fm => fm.id === m.id)
                );

                displayMovements();
                setupPagination();
                updateSummary();
            }

            alert('Movement deleted successfully');

        } catch (error) {
            console.error('Error deleting movement:', error);
            alert('Failed to delete movement');
        }
    }
}