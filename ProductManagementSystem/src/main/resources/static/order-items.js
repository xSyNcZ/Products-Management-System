class OrderItemsManager {
    constructor() {
        this.orderItems = [];
        this.orders = [];
        this.products = [];
        this.currentUser = null;
        this.editingOrderItem = null;
        this.selectedItems = new Set();
        this.apiBaseUrl = 'http://localhost:8080/api';

        this.init();
    }

    async init() {
        try {
            // For development - comment out authentication check
            // await this.checkAuthentication();
            this.setupEventListeners();
            await this.loadInitialData();
        } catch (error) {
            console.error('Initialization error:', error);
            this.showNotification('Failed to initialize application', 'error');
            // For development - don't redirect to login
            // this.redirectToLogin();
        }
    }

    async checkAuthentication() {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error('No authentication token');
            }

            const response = await fetch(`${this.apiBaseUrl}/auth/verify`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Authentication failed');
            }

            this.currentUser = await response.json();
            this.updateUIForUser();
        } catch (error) {
            console.error('Authentication check failed:', error);
            this.redirectToLogin();
        }
    }

    updateUIForUser() {
        if (this.currentUser) {
            document.getElementById('userName').textContent = this.currentUser.username;
            document.getElementById('userRole').textContent = this.currentUser.roles?.[0]?.name || 'User';

            // Show/hide navigation items based on role
            const userRole = this.currentUser.roles?.[0]?.name;
            if (userRole === 'ADMIN' || userRole === 'MANAGER') {
                const usersNav = document.getElementById('usersNav');
                if (usersNav) usersNav.style.display = 'block';
            }
        }
    }

    setupEventListeners() {
        // Navigation and UI events
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
        document.getElementById('addOrderItemBtn').addEventListener('click', () => this.showOrderItemModal());
        document.getElementById('refreshBtn').addEventListener('click', () => this.loadOrderItems());
        document.getElementById('clearFilters').addEventListener('click', () => this.clearFilters());

        // Modal events
        document.getElementById('closeModal').addEventListener('click', () => this.hideOrderItemModal());
        document.getElementById('cancelBtn').addEventListener('click', () => this.hideOrderItemModal());
        document.getElementById('orderItemForm').addEventListener('submit', (e) => this.handleOrderItemSubmit(e));

        // Filter events
        document.getElementById('orderFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('productFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('searchInput').addEventListener('input', () => this.applyFilters());

        // Selection events
        document.getElementById('selectAll').addEventListener('change', (e) => this.toggleSelectAll(e.target.checked));
        document.getElementById('selectAllHeader').addEventListener('change', (e) => this.toggleSelectAll(e.target.checked));
        document.getElementById('bulkDeleteBtn').addEventListener('click', () => this.bulkDeleteOrderItems());

        // Form calculation events
        document.getElementById('quantity').addEventListener('input', () => this.calculateTotalPrice());
        document.getElementById('unitPrice').addEventListener('input', () => this.calculateTotalPrice());
        document.getElementById('productId').addEventListener('change', () => this.updateUnitPriceFromProduct());

        // Modal close on outside click
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.hideOrderItemModal();
                this.hideConfirmModal();
            }
        });
    }

    async loadInitialData() {
        await Promise.all([
            this.loadOrderItems(),
            this.loadOrders(),
            this.loadProducts()
        ]);
    }

    async loadOrderItems() {
        try {
            this.showLoading();
            const response = await this.makeRequest(`${this.apiBaseUrl}/order-items`);

            if (!response.ok) {
                throw new Error(`Failed to load order items: ${response.status} ${response.statusText}`);
            }

            const orderItemsData = await response.json();

            // Transform the backend DTO structure to match frontend expectations
            this.orderItems = orderItemsData.map(item => ({
                id: item.id,
                quantity: item.quantity,
                unitPrice: item.pricePerUnit, // Backend uses pricePerUnit, frontend expects unitPrice
                order: { id: item.orderId },
                product: {
                    id: item.productId,
                    name: item.productName
                },
                sourceWarehouse: item.sourceWarehouseId ? {
                    id: item.sourceWarehouseId,
                    name: item.sourceWarehouseName
                } : null
            }));

            this.renderOrderItems();
            this.updateItemCount();
        } catch (error) {
            console.error('Error loading order items:', error);
            this.showNotification('Failed to load order items: ' + error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }

    async loadOrders() {
        try {
            const response = await this.makeRequest(`${this.apiBaseUrl}/orders`);
            if (response.ok) {
                this.orders = await response.json();
                this.populateOrderFilters();
            } else {
                console.warn('Orders endpoint not available - using mock data');
                // Mock data for development
                this.orders = [
                    { id: 1, orderStatus: 'PENDING' },
                    { id: 2, orderStatus: 'COMPLETED' },
                    { id: 3, orderStatus: 'PROCESSING' }
                ];
                this.populateOrderFilters();
            }
        } catch (error) {
            console.error('Error loading orders:', error);
            // Use mock data as fallback
            this.orders = [
                { id: 1, orderStatus: 'PENDING' },
                { id: 2, orderStatus: 'COMPLETED' },
                { id: 3, orderStatus: 'PROCESSING' }
            ];
            this.populateOrderFilters();
        }
    }

    async loadProducts() {
        try {
            const response = await this.makeRequest(`${this.apiBaseUrl}/products`);
            if (response.ok) {
                this.products = await response.json();
                this.populateProductFilters();
            } else {
                console.warn('Products endpoint not available - using mock data');
                // Mock data for development
                this.products = [
                    { id: 1, name: 'Product A', price: 19.99 },
                    { id: 2, name: 'Product B', price: 29.99 },
                    { id: 3, name: 'Product C', price: 39.99 }
                ];
                this.populateProductFilters();
            }
        } catch (error) {
            console.error('Error loading products:', error);
            // Use mock data as fallback
            this.products = [
                { id: 1, name: 'Product A', price: 19.99 },
                { id: 2, name: 'Product B', price: 29.99 },
                { id: 3, name: 'Product C', price: 39.99 }
            ];
            this.populateProductFilters();
        }
    }

    populateOrderFilters() {
        const orderFilter = document.getElementById('orderFilter');
        const orderSelect = document.getElementById('orderId');

        // Clear existing options (except the first one)
        orderFilter.innerHTML = '<option value="">All Orders</option>';
        orderSelect.innerHTML = '<option value="">Select Order</option>';

        this.orders.forEach(order => {
            const orderLabel = `Order #${order.id}${order.orderStatus ? ' - ' + order.orderStatus : ''}`;
            const option1 = new Option(orderLabel, order.id);
            const option2 = new Option(orderLabel, order.id);
            orderFilter.appendChild(option1);
            orderSelect.appendChild(option2);
        });
    }

    populateProductFilters() {
        const productFilter = document.getElementById('productFilter');
        const productSelect = document.getElementById('productId');

        // Clear existing options (except the first one)
        productFilter.innerHTML = '<option value="">All Products</option>';
        productSelect.innerHTML = '<option value="">Select Product</option>';

        this.products.forEach(product => {
            const productLabel = `${product.name}${product.price ? ' - $' + product.price : ''}`;
            const option1 = new Option(productLabel, product.id);
            const option2 = new Option(productLabel, product.id);
            productFilter.appendChild(option1);
            productSelect.appendChild(option2);
        });
    }

    renderOrderItems() {
        const tbody = document.getElementById('orderItemsTableBody');
        const noDataMessage = document.getElementById('noDataMessage');

        if (this.orderItems.length === 0) {
            tbody.innerHTML = '';
            noDataMessage.style.display = 'block';
            return;
        }

        noDataMessage.style.display = 'none';

        tbody.innerHTML = this.orderItems.map(item => `
            <tr data-id="${item.id}">
                <td>
                    <input type="checkbox" class="row-select" value="${item.id}">
                </td>
                <td>${item.id}</td>
                <td>${item.order?.id || 'N/A'}</td>
                <td>${item.product?.name || 'N/A'}</td>
                <td>${item.quantity}</td>
                <td>$${parseFloat(item.unitPrice || 0).toFixed(2)}</td>
                <td>$${(parseFloat(item.unitPrice || 0) * parseInt(item.quantity || 0)).toFixed(2)}</td>
                <td class="actions">
                    <button class="btn btn-sm btn-primary" onclick="orderItemsManager.editOrderItem(${item.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="orderItemsManager.deleteOrderItem(${item.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        // Add event listeners for row selection
        document.querySelectorAll('.row-select').forEach(checkbox => {
            checkbox.addEventListener('change', () => this.handleRowSelection());
        });
    }

    applyFilters() {
        const orderFilter = document.getElementById('orderFilter').value;
        const productFilter = document.getElementById('productFilter').value;
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();

        let filteredItems = this.orderItems;

        if (orderFilter) {
            filteredItems = filteredItems.filter(item =>
                item.order?.id?.toString() === orderFilter
            );
        }

        if (productFilter) {
            filteredItems = filteredItems.filter(item =>
                item.product?.id?.toString() === productFilter
            );
        }

        if (searchTerm) {
            filteredItems = filteredItems.filter(item =>
                item.product?.name?.toLowerCase().includes(searchTerm) ||
                item.order?.id?.toString().includes(searchTerm) ||
                item.quantity?.toString().includes(searchTerm)
            );
        }

        this.renderFilteredOrderItems(filteredItems);
        this.updateItemCount(filteredItems.length);
    }

    renderFilteredOrderItems(items) {
        const tbody = document.getElementById('orderItemsTableBody');
        const noDataMessage = document.getElementById('noDataMessage');

        if (items.length === 0) {
            tbody.innerHTML = '';
            noDataMessage.style.display = 'block';
            return;
        }

        noDataMessage.style.display = 'none';

        tbody.innerHTML = items.map(item => `
            <tr data-id="${item.id}">
                <td>
                    <input type="checkbox" class="row-select" value="${item.id}">
                </td>
                <td>${item.id}</td>
                <td>${item.order?.id || 'N/A'}</td>
                <td>${item.product?.name || 'N/A'}</td>
                <td>${item.quantity}</td>
                <td>$${parseFloat(item.unitPrice || 0).toFixed(2)}</td>
                <td>$${(parseFloat(item.unitPrice || 0) * parseInt(item.quantity || 0)).toFixed(2)}</td>
                <td class="actions">
                    <button class="btn btn-sm btn-primary" onclick="orderItemsManager.editOrderItem(${item.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="orderItemsManager.deleteOrderItem(${item.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        // Add event listeners for row selection
        document.querySelectorAll('.row-select').forEach(checkbox => {
            checkbox.addEventListener('change', () => this.handleRowSelection());
        });
    }

    clearFilters() {
        document.getElementById('orderFilter').value = '';
        document.getElementById('productFilter').value = '';
        document.getElementById('searchInput').value = '';
        this.renderOrderItems();
        this.updateItemCount();
    }

    showOrderItemModal(orderItem = null) {
        this.editingOrderItem = orderItem;
        const modal = document.getElementById('orderItemModal');
        const modalTitle = document.getElementById('modalTitle');
        const form = document.getElementById('orderItemForm');

        modalTitle.innerHTML = orderItem ?
            '<i class="fas fa-edit"></i> Edit Order Item' :
            '<i class="fas fa-plus"></i> Add Order Item';

        if (orderItem) {
            document.getElementById('orderId').value = orderItem.order?.id || '';
            document.getElementById('productId').value = orderItem.product?.id || '';
            document.getElementById('quantity').value = orderItem.quantity || '';
            document.getElementById('unitPrice').value = orderItem.unitPrice || '';
            this.calculateTotalPrice();
        } else {
            form.reset();
        }

        modal.style.display = 'flex';
    }

    hideOrderItemModal() {
        const modal = document.getElementById('orderItemModal');
        modal.style.display = 'none';
        this.editingOrderItem = null;
    }

    calculateTotalPrice() {
        const quantity = parseFloat(document.getElementById('quantity').value) || 0;
        const unitPrice = parseFloat(document.getElementById('unitPrice').value) || 0;
        const totalPrice = quantity * unitPrice;
        document.getElementById('totalPrice').value = totalPrice.toFixed(2);
    }

    updateUnitPriceFromProduct() {
        const productId = document.getElementById('productId').value;
        const product = this.products.find(p => p.id.toString() === productId);
        if (product && product.price) {
            document.getElementById('unitPrice').value = product.price;
            this.calculateTotalPrice();
        }
    }

    async handleOrderItemSubmit(e) {
        e.preventDefault();

        const formData = new FormData(e.target);

        // Transform frontend data to match backend DTO structure
        const orderItemData = {
            orderId: parseInt(formData.get('orderId')),
            productId: parseInt(formData.get('productId')),
            quantity: parseInt(formData.get('quantity')),
            pricePerUnit: parseFloat(formData.get('unitPrice')) // Backend expects pricePerUnit
        };

        // Add ID if editing
        if (this.editingOrderItem) {
            orderItemData.id = this.editingOrderItem.id;
        }

        try {
            const url = this.editingOrderItem ?
                `${this.apiBaseUrl}/order-items/${this.editingOrderItem.id}` :
                `${this.apiBaseUrl}/order-items`;

            const method = this.editingOrderItem ? 'PUT' : 'POST';

            const response = await this.makeRequest(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderItemData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to save order item: ${response.status} ${errorText}`);
            }

            this.showNotification(
                this.editingOrderItem ? 'Order item updated successfully' : 'Order item created successfully',
                'success'
            );

            this.hideOrderItemModal();
            await this.loadOrderItems();
        } catch (error) {
            console.error('Error saving order item:', error);
            this.showNotification('Failed to save order item: ' + error.message, 'error');
        }
    }

    editOrderItem(id) {
        const orderItem = this.orderItems.find(item => item.id === id);
        if (orderItem) {
            this.showOrderItemModal(orderItem);
        }
    }

    deleteOrderItem(id) {
        this.showConfirmModal(
            'Delete Order Item',
            'Are you sure you want to delete this order item? This action cannot be undone.',
            () => this.confirmDeleteOrderItem(id)
        );
    }

    async confirmDeleteOrderItem(id) {
        try {
            const response = await this.makeRequest(`${this.apiBaseUrl}/order-items/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error(`Failed to delete order item: ${response.status}`);
            }

            this.showNotification('Order item deleted successfully', 'success');
            await this.loadOrderItems();
        } catch (error) {
            console.error('Error deleting order item:', error);
            this.showNotification('Failed to delete order item: ' + error.message, 'error');
        }
    }

    handleRowSelection() {
        const checkboxes = document.querySelectorAll('.row-select:checked');
        const bulkActions = document.querySelector('.bulk-actions');

        if (checkboxes.length > 0) {
            bulkActions.style.display = 'block';
            this.selectedItems = new Set(Array.from(checkboxes).map(cb => parseInt(cb.value)));
        } else {
            bulkActions.style.display = 'none';
            this.selectedItems.clear();
        }
    }

    toggleSelectAll(checked) {
        const checkboxes = document.querySelectorAll('.row-select');
        checkboxes.forEach(checkbox => {
            checkbox.checked = checked;
        });

        // Sync both select all checkboxes
        document.getElementById('selectAll').checked = checked;
        document.getElementById('selectAllHeader').checked = checked;

        this.handleRowSelection();
    }

    bulkDeleteOrderItems() {
        if (this.selectedItems.size === 0) return;

        this.showConfirmModal(
            'Delete Selected Order Items',
            `Are you sure you want to delete ${this.selectedItems.size} selected order items? This action cannot be undone.`,
            () => this.confirmBulkDelete()
        );
    }

    async confirmBulkDelete() {
        try {
            const deletePromises = Array.from(this.selectedItems).map(id =>
                this.makeRequest(`${this.apiBaseUrl}/order-items/${id}`, {
                    method: 'DELETE'
                })
            );

            const results = await Promise.allSettled(deletePromises);
            const failures = results.filter(result => result.status === 'rejected').length;

            if (failures === 0) {
                this.showNotification(`${this.selectedItems.size} order items deleted successfully`, 'success');
            } else {
                this.showNotification(`${this.selectedItems.size - failures} order items deleted, ${failures} failed`, 'warning');
            }

            this.selectedItems.clear();
            document.querySelector('.bulk-actions').style.display = 'none';
            await this.loadOrderItems();
        } catch (error) {
            console.error('Error deleting order items:', error);
            this.showNotification('Failed to delete order items', 'error');
        }
    }

    showConfirmModal(title, message, onConfirm) {
        const modal = document.getElementById('confirmModal');
        document.getElementById('confirmTitle').textContent = title;
        document.getElementById('confirmMessage').textContent = message;

        document.getElementById('confirmOk').onclick = () => {
            onConfirm();
            this.hideConfirmModal();
        };

        document.getElementById('confirmCancel').onclick = () => this.hideConfirmModal();

        modal.style.display = 'flex';
    }

    hideConfirmModal() {
        document.getElementById('confirmModal').style.display = 'none';
    }

    updateItemCount(count = null) {
        const itemCount = document.getElementById('itemCount');
        const total = count !== null ? count : this.orderItems.length;
        itemCount.textContent = `${total} item${total !== 1 ? 's' : ''}`;
    }

    showLoading() {
        document.getElementById('loadingIndicator').style.display = 'block';
    }

    hideLoading() {
        document.getElementById('loadingIndicator').style.display = 'none';
    }

    async makeRequest(url, options = {}) {
        // For development without authentication
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        };

        // If you have authentication, uncomment this:
        /*
        const token = localStorage.getItem('authToken');
        if (token) {
            defaultOptions.headers['Authorization'] = `Bearer ${token}`;
        }
        */

        return fetch(url, { ...defaultOptions, ...options });
    }

    showNotification(message, type = 'info') {
        const container = document.getElementById('notificationContainer');
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;

        const icon = type === 'success' ? 'check-circle' :
            type === 'error' ? 'exclamation-circle' :
                type === 'warning' ? 'exclamation-triangle' :
                    'info-circle';

        notification.innerHTML = `
            <i class="fas fa-${icon}"></i>
            <span>${message}</span>
            <button class="notification-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        container.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    logout() {
        localStorage.removeItem('authToken');
        this.redirectToLogin();
    }

    redirectToLogin() {
        window.location.href = 'login.html';
    }
}

// Initialize the order items manager when the page loads
const orderItemsManager = new OrderItemsManager();