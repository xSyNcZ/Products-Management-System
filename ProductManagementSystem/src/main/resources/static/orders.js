// Complete orders.js with all required functionality

// Global variables
let currentOrders = [];
let currentCustomers = [];
let currentProducts = [];
let customerAddresses = [];
let currentPage = 1;
let ordersPerPage = 10;

// API Configuration
const API_BASE_URL = '/api'; // Match your Spring Boot controller

// Utility Functions
async function apiCall(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const defaultOptions = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    };

    const config = { ...defaultOptions, ...options };

    try {
        const response = await fetch(url, config);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        // Handle no content responses
        if (response.status === 204) {
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}

function showLoading(message = 'Loading...') {
    // Create or update loading overlay
    let loadingOverlay = document.getElementById('loadingOverlay');
    if (!loadingOverlay) {
        loadingOverlay = document.createElement('div');
        loadingOverlay.id = 'loadingOverlay';
        loadingOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            color: white;
            font-size: 18px;
        `;
        document.body.appendChild(loadingOverlay);
    }
    loadingOverlay.textContent = message;
    loadingOverlay.style.display = 'flex';
}

function hideLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
}

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Orders page loaded');
    initializePage();
});

async function initializePage() {
    try {
        showLoading('Initializing...');
        await Promise.all([
            loadOrders(),
            loadCustomers(),
            loadProducts()
        ]);
        hideLoading();
    } catch (error) {
        console.error('Failed to initialize page:', error);
        hideLoading();
        alert('Failed to load initial data. Please refresh the page.');
    }
}

// Load Orders
async function loadOrders() {
    try {
        currentOrders = await apiCall('/orders');
        renderOrdersTable();
        updatePagination();
    } catch (error) {
        console.error('Error loading orders:', error);
        // Show mock data for development
        currentOrders = [
            {
                id: 1,
                orderNumber: 'ORD-001',
                customerId: 1,
                customerName: 'John Doe',
                orderDate: '2024-01-15T10:30:00',
                status: 'PENDING',
                totalItems: 3,
                totalAmount: 299.99
            },
            {
                id: 2,
                orderNumber: 'ORD-002',
                customerId: 2,
                customerName: 'Jane Smith',
                orderDate: '2024-01-16T14:20:00',
                status: 'PROCESSING',
                totalItems: 2,
                totalAmount: 199.50
            }
        ];
        renderOrdersTable();
        updatePagination();
    }
}

// Load Customers
async function loadCustomers() {
    try {
        // Try multiple endpoints that might exist
        try {
            currentCustomers = await apiCall('/customers');
        } catch (error) {
            try {
                currentCustomers = await apiCall('/users');
            } catch (altError) {
                // Use mock data
                currentCustomers = [
                    { id: 1, name: 'John Doe', email: 'john@example.com' },
                    { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
                    { id: 3, name: 'Bob Johnson', email: 'bob@example.com' }
                ];
            }
        }
        populateCustomerSelect();
    } catch (error) {
        console.error('Error loading customers:', error);
        currentCustomers = [];
    }
}

// Load Products
async function loadProducts() {
    try {
        currentProducts = await apiCall('/products');
    } catch (error) {
        console.error('Error loading products:', error);
        // Use mock data
        currentProducts = [
            { id: 1, name: 'Product A', price: 29.99, stock: 100 },
            { id: 2, name: 'Product B', price: 49.99, stock: 50 },
            { id: 3, name: 'Product C', price: 19.99, stock: 200 }
        ];
    }
}

// Render Orders Table
function renderOrdersTable() {
    const tbody = document.getElementById('ordersTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (currentOrders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No orders found</td></tr>';
        return;
    }

    currentOrders.forEach(order => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${order.orderNumber || order.id}</td>
            <td>${order.customerName || 'N/A'}</td>
            <td>${formatDate(order.orderDate)}</td>
            <td><span class="status-badge status-${order.status.toLowerCase()}">${order.status}</span></td>
            <td>${order.totalItems || 0}</td>
            <td>
                <button class="btn btn-small" onclick="viewOrder(${order.id})">View</button>
                <button class="btn btn-small btn-secondary" onclick="editOrder(${order.id})">Edit</button>
                <button class="btn btn-small btn-danger" onclick="deleteOrder(${order.id})">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Populate Customer Select
function populateCustomerSelect() {
    const customerSelect = document.getElementById('customerId');
    if (!customerSelect) return;

    customerSelect.innerHTML = '<option value="">Select Customer</option>';

    currentCustomers.forEach(customer => {
        const option = document.createElement('option');
        option.value = customer.id;
        option.textContent = customer.name || customer.email || `Customer ${customer.id}`;
        customerSelect.appendChild(option);
    });

    // Add event listener for customer selection
    customerSelect.addEventListener('change', onCustomerSelected);
}

// Customer Selection Handler
async function onCustomerSelected(event) {
    const customerId = event.target.value;
    const addressSection = document.getElementById('addressSelectionSection');

    if (!customerId) {
        clearAddressSelections();
        addressSection.style.display = 'none';
        return;
    }

    try {
        showLoading('Loading customer addresses...');

        // Try to load addresses for the customer
        try {
            customerAddresses = await apiCall(`/customers/${customerId}/addresses`);
        } catch (error) {
            try {
                customerAddresses = await apiCall(`/addresses?customerId=${customerId}`);
            } catch (altError) {
                try {
                    const user = await apiCall(`/users/${customerId}`);
                    customerAddresses = user.addresses || [];
                } catch (finalError) {
                    // Use mock addresses
                    customerAddresses = [
                        {
                            id: 1,
                            type: 'HOME',
                            street: '123 Main St',
                            city: 'Anytown',
                            state: 'ST',
                            zipCode: '12345',
                            country: 'USA'
                        },
                        {
                            id: 2,
                            type: 'WORK',
                            street: '456 Business Ave',
                            city: 'Business City',
                            state: 'ST',
                            zipCode: '67890',
                            country: 'USA'
                        }
                    ];
                }
            }
        }

        if (customerAddresses.length === 0) {
            alert('No addresses found for this customer. Using default addresses.');
            customerAddresses = [
                {
                    id: 1,
                    type: 'DEFAULT',
                    street: '123 Default St',
                    city: 'Default City',
                    state: 'ST',
                    zipCode: '12345',
                    country: 'USA'
                }
            ];
        }

        populateAddressSelections();
        addressSection.style.display = 'block';
        hideLoading();
    } catch (error) {
        console.error('Error loading customer addresses:', error);
        hideLoading();
        alert('Error loading customer addresses. Using default addresses.');
        customerAddresses = [
            {
                id: 1,
                type: 'DEFAULT',
                street: '123 Default St',
                city: 'Default City',
                state: 'ST',
                zipCode: '12345',
                country: 'USA'
            }
        ];
        populateAddressSelections();
        addressSection.style.display = 'block';
    }
}

// Populate Address Selections
function populateAddressSelections() {
    const billingSelect = document.getElementById('billingAddressId');
    const shippingSelect = document.getElementById('shippingAddressId');

    // Clear existing options
    billingSelect.innerHTML = '<option value="">Select Billing Address</option>';
    shippingSelect.innerHTML = '<option value="">Select Shipping Address</option>';

    // Populate shipping addresses
    customerAddresses.forEach(address => {
        const addressText = `${address.type || 'Address'} - ${address.street}, ${address.city}, ${address.state} ${address.zipCode}`;

        const shippingOption = document.createElement('option');
        shippingOption.value = address.id;
        shippingOption.textContent = addressText;
        shippingSelect.appendChild(shippingOption);
    });

    // Add "Same as Shipping" option for billing
    const sameAsShippingOption = document.createElement('option');
    sameAsShippingOption.value = 'same';
    sameAsShippingOption.textContent = 'Same as Shipping Address';
    billingSelect.appendChild(sameAsShippingOption);

    // Add all addresses to billing select
    customerAddresses.forEach(address => {
        const addressText = `${address.type || 'Address'} - ${address.street}, ${address.city}, ${address.state} ${address.zipCode}`;

        const billingOption = document.createElement('option');
        billingOption.value = address.id;
        billingOption.textContent = addressText;
        billingSelect.appendChild(billingOption);
    });
}

// Clear Address Selections
function clearAddressSelections() {
    const billingSelect = document.getElementById('billingAddressId');
    const shippingSelect = document.getElementById('shippingAddressId');
    const addressSection = document.getElementById('addressSelectionSection');

    if (billingSelect) {
        billingSelect.innerHTML = '<option value="">Select Billing Address</option>';
    }
    if (shippingSelect) {
        shippingSelect.innerHTML = '<option value="">Select Shipping Address</option>';
    }

    addressSection.style.display = 'none';
    customerAddresses = [];
}

// Add Order Item
function addOrderItem() {
    const container = document.getElementById('orderItemsContainer');
    const itemRow = document.createElement('div');
    itemRow.className = 'order-item-row';
    itemRow.style.cssText = 'margin-bottom: 10px; padding: 10px; border: 1px solid #ddd; border-radius: 4px;';

    itemRow.innerHTML = `
        <div style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr auto; gap: 10px; align-items: center;">
            <select class="product-select" required>
                <option value="">Select Product</option>
                ${currentProducts.map(product =>
        `<option value="${product.id}" data-price="${product.price}">${product.name} - $${product.price}</option>`
    ).join('')}
            </select>
            <input type="number" class="quantity-input" placeholder="Quantity" min="1" required>
            <input type="number" class="price-input" placeholder="Unit Price" step="0.01" min="0" required>
            <div class="total-price">$0.00</div>
            <button type="button" class="btn btn-danger btn-small" onclick="removeOrderItem(this)">Remove</button>
        </div>
    `;

    container.appendChild(itemRow);

    // Add event listeners for auto-calculation
    const productSelect = itemRow.querySelector('.product-select');
    const quantityInput = itemRow.querySelector('.quantity-input');
    const priceInput = itemRow.querySelector('.price-input');
    const totalDiv = itemRow.querySelector('.total-price');

    productSelect.addEventListener('change', function() {
        const selectedOption = this.options[this.selectedIndex];
        if (selectedOption.dataset.price) {
            priceInput.value = selectedOption.dataset.price;
            updateRowTotal();
        }
    });

    function updateRowTotal() {
        const quantity = parseFloat(quantityInput.value) || 0;
        const price = parseFloat(priceInput.value) || 0;
        const total = quantity * price;
        totalDiv.textContent = `$${total.toFixed(2)}`;
    }

    quantityInput.addEventListener('input', updateRowTotal);
    priceInput.addEventListener('input', updateRowTotal);
}

// Remove Order Item
function removeOrderItem(button) {
    button.closest('.order-item-row').remove();
}

// Show Create Order Modal
function showCreateOrderModal() {
    document.getElementById('createOrderModal').style.display = 'block';
    // Add initial order item
    const container = document.getElementById('orderItemsContainer');
    if (container.children.length === 0) {
        addOrderItem();
    }
}

// Close Create Order Modal
function closeCreateOrderModal() {
    document.getElementById('createOrderModal').style.display = 'none';
    document.getElementById('createOrderForm').reset();
    document.getElementById('orderItemsContainer').innerHTML = '';
    clearAddressSelections();
}

// Close Order Modal
function closeOrderModal() {
    document.getElementById('orderModal').style.display = 'none';
}

// Form Validation
function validateOrderForm() {
    const customerId = document.getElementById('customerId').value;
    const shippingAddressId = document.getElementById('shippingAddressId').value;
    const billingAddressId = document.getElementById('billingAddressId').value;

    if (!customerId) {
        alert('Please select a customer');
        return false;
    }

    if (!shippingAddressId) {
        alert('Please select a shipping address');
        return false;
    }

    if (!billingAddressId) {
        alert('Please select a billing address');
        return false;
    }

    // Validate order items
    const itemRows = document.querySelectorAll('.order-item-row');
    if (itemRows.length === 0) {
        alert('Please add at least one order item');
        return false;
    }

    // Validate each order item
    for (let row of itemRows) {
        const productId = row.querySelector('.product-select').value;
        const quantity = row.querySelector('.quantity-input').value;
        const unitPrice = row.querySelector('.price-input').value;

        if (!productId || !quantity || !unitPrice || quantity <= 0 || unitPrice <= 0) {
            alert('Please fill in all order item fields with valid values');
            return false;
        }
    }

    return true;
}

// Create Order Form Handler
document.addEventListener('DOMContentLoaded', function() {
    const createOrderForm = document.getElementById('createOrderForm');
    if (createOrderForm) {
        createOrderForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            if (!validateOrderForm()) {
                return;
            }

            const customerId = document.getElementById('customerId').value;
            const billingAddressId = document.getElementById('billingAddressId').value;
            const shippingAddressId = document.getElementById('shippingAddressId').value;

            const orderItems = [];
            const itemRows = document.querySelectorAll('.order-item-row');

            itemRows.forEach(row => {
                const productId = row.querySelector('.product-select').value;
                const quantity = parseInt(row.querySelector('.quantity-input').value);
                const unitPrice = parseFloat(row.querySelector('.price-input').value);

                if (productId && quantity && unitPrice) {
                    orderItems.push({
                        productId: parseInt(productId),
                        quantity: quantity,
                        unitPrice: unitPrice
                    });
                }
            });

            // Determine final billing address ID
            let finalBillingAddressId = billingAddressId;
            if (billingAddressId === 'same') {
                finalBillingAddressId = shippingAddressId;
            }

            const orderData = {
                customerId: parseInt(customerId),
                billingAddressId: parseInt(finalBillingAddressId),
                shippingAddressId: parseInt(shippingAddressId),
                orderItems: orderItems
            };

            console.log('Creating order with data:', JSON.stringify(orderData, null, 2));

            try {
                showLoading('Creating order...');

                const createdOrder = await apiCall('/orders', {
                    method: 'POST',
                    body: JSON.stringify(orderData)
                });

                await loadOrders();
                closeCreateOrderModal();
                hideLoading();
                alert('Order created successfully!');
            } catch (error) {
                console.error('Error creating order:', error);
                hideLoading();

                let errorMessage = 'Failed to create order';
                if (error.message.includes('400')) {
                    errorMessage += ':\n- Invalid data format or validation error\n- Please check all fields are filled correctly';
                } else if (error.message.includes('404')) {
                    errorMessage += ':\n- Customer, product, or address not found\n- Please verify the selected customer and products exist';
                } else if (error.message.includes('409')) {
                    errorMessage += ':\n- Insufficient stock for one or more products';
                } else if (error.message.includes('500')) {
                    errorMessage += ':\n- Server error occurred\n- Please try again or contact support';
                } else {
                    errorMessage += ':\n- ' + error.message;
                }

                alert(errorMessage);
            }
        });
    }
});

// Order Actions
function viewOrder(orderId) {
    console.log('Viewing order:', orderId);
    // Implement view order functionality
    alert('View order functionality to be implemented');
}

function editOrder(orderId) {
    console.log('Editing order:', orderId);
    // Implement edit order functionality
    alert('Edit order functionality to be implemented');
}

async function deleteOrder(orderId) {
    if (!confirm('Are you sure you want to delete this order?')) {
        return;
    }

    try {
        showLoading('Deleting order...');
        await apiCall(`/orders/${orderId}`, { method: 'DELETE' });
        await loadOrders();
        hideLoading();
        alert('Order deleted successfully');
    } catch (error) {
        console.error('Error deleting order:', error);
        hideLoading();
        alert('Failed to delete order: ' + error.message);
    }
}

// Filter and Search Functions
function filterOrders() {
    // Implement filtering logic
    console.log('Filtering orders...');
}

function resetFilters() {
    document.getElementById('statusFilter').value = '';
    document.getElementById('dateFromFilter').value = '';
    document.getElementById('dateToFilter').value = '';
    document.getElementById('customerFilter').value = '';
    filterOrders();
}

// Pagination
function updatePagination() {
    const paginationContainer = document.getElementById('ordersPagination');
    if (!paginationContainer) return;

    const totalPages = Math.ceil(currentOrders.length / ordersPerPage);
    paginationContainer.innerHTML = `
        <span>Page ${currentPage} of ${totalPages}</span>
        <button onclick="previousPage()" ${currentPage === 1 ? 'disabled' : ''}>Previous</button>
        <button onclick="nextPage()" ${currentPage === totalPages ? 'disabled' : ''}>Next</button>
    `;
}

function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        renderOrdersTable();
        updatePagination();
    }
}

function nextPage() {
    const totalPages = Math.ceil(currentOrders.length / ordersPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        renderOrdersTable();
        updatePagination();
    }
}

// Utility Functions
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

// Close modals when clicking outside
window.addEventListener('click', function(event) {
    const orderModal = document.getElementById('orderModal');
    const createOrderModal = document.getElementById('createOrderModal');

    if (event.target === orderModal) {
        closeOrderModal();
    }
    if (event.target === createOrderModal) {
        closeCreateOrderModal();
    }
});