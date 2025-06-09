// Orders Management JavaScript

let orders = [];
let filteredOrders = [];
let currentPage = 1;
const ordersPerPage = 10;

// Initialize orders page
document.addEventListener('DOMContentLoaded', function() {
    loadOrders();
    loadCustomers();
    loadProducts();
});

// Load orders from API
async function loadOrders() {
    try {
        // Mock data - replace with actual API call
        orders = [
            {
                id: 1,
                orderDate: '2024-01-15T10:30:00',
                orderStatus: 'PENDING',
                user: { id: 1, username: 'john_doe', firstName: 'John', lastName: 'Doe' },
                orderItems: [
                    { id: 1, quantity: 2, unitPrice: 29.99, product: { id: 1, name: 'Product A' } },
                    { id: 2, quantity: 1, unitPrice: 49.99, product: { id: 2, name: 'Product B' } }
                ]
            },
            {
                id: 2,
                orderDate: '2024-01-16T14:20:00',
                orderStatus: 'PROCESSING',
                user: { id: 2, username: 'jane_smith', firstName: 'Jane', lastName: 'Smith' },
                orderItems: [
                    { id: 3, quantity: 3, unitPrice: 19.99, product: { id: 3, name: 'Product C' } }
                ]
            }
        ];

        // In real implementation:
        // orders = await PMS.apiCall('/orders');

        filteredOrders = [...orders];
        displayOrders();
        setupPagination();
    } catch (error) {
        console.error('Error loading orders:', error);
        alert('Failed to load orders');
    }
}

// Display orders in table
function displayOrders() {
    const tbody = document.getElementById('ordersTableBody');
    tbody.innerHTML = '';

    const startIndex = (currentPage - 1) * ordersPerPage;
    const endIndex = startIndex + ordersPerPage;
    const ordersToDisplay = filteredOrders.slice(startIndex, endIndex);

    ordersToDisplay.forEach(order => {
        const row = document.createElement('tr');

        const totalItems = order.orderItems.reduce((sum, item) => sum + item.quantity, 0);
        const customerName = `${order.user.firstName} ${order.user.lastName}`;
        const orderDate = new Date(order.orderDate).toLocaleDateString();

        row.innerHTML = `
            <td>#${order.id}</td>
            <td>${customerName}</td>
            <td>${orderDate}</td>
            <td><span class="status-badge status-${order.orderStatus.toLowerCase()}">${order.orderStatus}</span></td>
            <td>${totalItems}</td>
            <td class="order-actions">
                <button class="btn btn-sm btn-primary" onclick="viewOrder(${order.id})">View</button>
                <button class="btn btn-sm btn-warning" onclick="editOrder(${order.id})">Edit</button>
                ${order.orderStatus === 'PENDING' ? `<button class="btn btn-sm btn-success" onclick="processOrder(${order.id})">Process</button>` : ''}
                ${order.orderStatus === 'PROCESSING' ? `<button class="btn btn-sm btn-info" onclick="shipOrder(${order.id})">Ship</button>` : ''}
                <button class="btn btn-sm btn-danger" onclick="cancelOrder(${order.id})">Cancel</button>
            </td>
        `;

        tbody.appendChild(row);
    });
}

// Filter orders
function filterOrders() {
    const statusFilter = document.getElementById('statusFilter').value;
    const dateFromFilter = document.getElementById('dateFromFilter').value;
    const dateToFilter = document.getElementById('dateToFilter').value;
    const customerFilter = document.getElementById('customerFilter').value.toLowerCase();

    filteredOrders = orders.filter(order => {
        let matchesStatus = !statusFilter || order.orderStatus === statusFilter;
        let matchesCustomer = !customerFilter ||
            `${order.user.firstName} ${order.user.lastName}`.toLowerCase().includes(customerFilter);

        let matchesDateRange = true;
        if (dateFromFilter || dateToFilter) {
            const orderDate = new Date(order.orderDate);
            if (dateFromFilter) {
                matchesDateRange = matchesDateRange && orderDate >= new Date(dateFromFilter);
            }
            if (dateToFilter) {
                matchesDateRange = matchesDateRange && orderDate <= new Date(dateToFilter);
            }
        }

        return matchesStatus && matchesCustomer && matchesDateRange;
    });

    currentPage = 1;
    displayOrders();
    setupPagination();
}

// Reset filters
function resetFilters() {
    document.getElementById('statusFilter').value = '';
    document.getElementById('dateFromFilter').value = '';
    document.getElementById('dateToFilter').value = '';
    document.getElementById('customerFilter').value = '';

    filteredOrders = [...orders];
    currentPage = 1;
    displayOrders();
    setupPagination();
}

// Setup pagination
function setupPagination() {
    const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
    const pagination = document.getElementById('ordersPagination');

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
    displayOrders();
    setupPagination();
}

// View order details
function viewOrder(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const customerName = `${order.user.firstName} ${order.user.lastName}`;
    const orderDate = new Date(order.orderDate).toLocaleString();
    const totalAmount = order.orderItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

    let orderItemsHTML = '';
    order.orderItems.forEach(item => {
        const itemTotal = item.quantity * item.unitPrice;
        orderItemsHTML += `
            <tr>
                <td>${item.product.name}</td>
                <td>${item.quantity}</td>
                <td>$${item.unitPrice.toFixed(2)}</td>
                <td>$${itemTotal.toFixed(2)}</td>
            </tr>
        `;
    });

    document.getElementById('modalTitle').textContent = `Order #${order.id}`;
    document.getElementById('orderDetailsContent').innerHTML = `
        <div class="order-info">
            <p><strong>Customer:</strong> ${customerName}</p>
            <p><strong>Order Date:</strong> ${orderDate}</p>
            <p><strong>Status:</strong> <span class="status-badge status-${order.orderStatus.toLowerCase()}">${order.orderStatus}</span></p>
        </div>
        
        <h3>Order Items</h3>
        <table class="order-items-table">
            <thead>
                <tr>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                ${orderItemsHTML}
            </tbody>
        </table>
        
        <div class="order-summary">
            <h4>Order Summary</h4>
            <p><strong>Total Amount: $${totalAmount.toFixed(2)}</strong></p>
        </div>
    `;

    document.getElementById('orderModal').style.display = 'block';
}

// Close order modal
function closeOrderModal() {
    document.getElementById('orderModal').style.display = 'none';
}

// Edit order
function editOrder(orderId) {
    // Implement edit functionality
    alert(`Edit order ${orderId} - Feature to be implemented`);
}

// Process order
async function processOrder(orderId) {
    if (confirm('Are you sure you want to process this order?')) {
        try {
            // In real implementation:
            // await PMS.apiCall(`/orders/${orderId}/process`, { method: 'POST' });

            // Update order status locally
            const order = orders.find(o => o.id === orderId);
            if (order) {
                order.orderStatus = 'PROCESSING';
                displayOrders();
            }

            alert('Order processed successfully');
        } catch (error) {
            console.error('Error processing order:', error);
            alert('Failed to process order');
        }
    }
}

// Ship order
async function shipOrder(orderId) {
    if (confirm('Are you sure you want to ship this order?')) {
        try {
            // In real implementation:
            // await PMS.apiCall(`/orders/${orderId}/ship`, { method: 'POST' });

            // Update order status locally
            const order = orders.find(o => o.id === orderId);
            if (order) {
                order.orderStatus = 'SHIPPED';
                displayOrders();
            }

            alert('Order shipped successfully');
        } catch (error) {
            console.error('Error shipping order:', error);
            alert('Failed to ship order');
        }
    }
}

// Cancel order
async function cancelOrder(orderId) {
    if (confirm('Are you sure you want to cancel this order?')) {
        try {
            // In real implementation:
            // await PMS.apiCall(`/orders/${orderId}/cancel`, { method: 'POST' });

            // Update order status locally
            const order = orders.find(o => o.id === orderId);
            if (order) {
                order.orderStatus = 'CANCELLED';
                displayOrders();
            }

            alert('Order cancelled successfully');
        } catch (error) {
            console.error('Error cancelling order:', error);
            alert('Failed to cancel order');
        }
    }
}

// Show create order modal
function showCreateOrderModal() {
    document.getElementById('createOrderModal').style.display = 'block';
}

// Close create order modal
function closeCreateOrderModal() {
    document.getElementById('createOrderModal').style.display = 'none';
    document.getElementById('createOrderForm').reset();
    document.getElementById('orderItemsContainer').innerHTML = '';
}

// Load customers for order creation
async function loadCustomers() {
    try {
        // Mock data - replace with actual API call
        const customers = [
            { id: 1, firstName: 'John', lastName: 'Doe' },
            { id: 2, firstName: 'Jane', lastName: 'Smith' }
        ];

        const customerSelect = document.getElementById('customerId');
        customers.forEach(customer => {
            const option = document.createElement('option');
            option.value = customer.id;
            option.textContent = `${customer.firstName} ${customer.lastName}`;
            customerSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading customers:', error);
    }
}

// Load products for order creation
let products = [];
async function loadProducts() {
    try {
        // Mock data - replace with actual API call
        products = [
            { id: 1, name: 'Product A', price: 29.99 },
            { id: 2, name: 'Product B', price: 49.99 },
            { id: 3, name: 'Product C', price: 19.99 }
        ];
    } catch (error) {
        console.error('Error loading products:', error);
    }
}