class OrderItemsManager {
    constructor() {
        this.orderItems = [];
        this.orders = [];
        this.products = [];
        this.currentUser = null;
        this.editingOrderItem = null;
        this.selectedItems = new Set();

        this.init();
    }

    async init() {
        try {
            //await this.checkAuthentication(); !TODO Delete this after tests
            this.setupEventListeners();
            await this.loadInitialData();
        } catch (error) {
            console.error('Initialization error:', error);
            this.showNotification('Failed to initialize application', 'error');
            this.redirectToLogin();
        }
    }

    async checkAuthentication() {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error('No authentication token');
            }

            const response = await fetch('/api/auth/verify', {
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
                document.getElementById('usersNav').style.display = 'block';
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
            const response = await this.makeAuthenticatedRequest('/api/order-items');

            if (!response.ok) {
                throw new Error('Failed to load order items');
            }

            this.orderItems = await response.json();
            this.renderOrderItems();
            this.updateItemCount();
        } catch (error) {
            console.error('Error loading order items:', error);
            this.showNotification('Failed to load order items', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async loadOrders() {
        try {
            const response = await this.makeAuthenticatedRequest('/api/orders');
            if (response.ok) {
                this.orders = await response.json();
                this.populateOrderFilters();
            }
        } catch (error) {
            console.error('Error loading orders:', error);
        }
    }

    async loadProducts() {
        try {
            const response = await this.makeAuthenticatedRequest('/api/products');
            if (response.ok) {
                this.products = await response.json();
                this.populateProductFilters();
            }
        } catch (error) {
            console.error('Error loading products:', error);
        }
    }

    populateOrderFilters() {
        const orderFilter = document.getElementById('orderFilter');
        const orderSelect = document.getElementById('orderId');

        // Clear existing options (except the first one)
        orderFilter.innerHTML = '<option value="">All Orders</option>';
        orderSelect.innerHTML = '<option value="">Select Order</option>';

        this.orders.forEach(order => {
            const option1 = new Option(`Order #${order.id} - ${order.orderStatus}`, order.id);
            const option2 = new Option(`Order #${order.id} - ${order.orderStatus}`, order.id);
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
            const option1 = new Option(`${product.name} - $${product.price}`, product.id);
            const option2 = new Option(`${product.name} - $${product.price}`, product.id);
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
        if (product) {
            document.getElementById('unitPrice').value = product.price;
            this.calculateTotalPrice();
        }
    }

    async handleOrderItemSubmit(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const orderItemData = {
            order: { id: parseInt(formData.get('orderId')) },
            product: { id: parseInt(formData.get('productId')) },
            quantity: parseInt(formData.get('quantity')),
            unitPrice: parseFloat(formData.get('unitPrice'))
        };

        try {
            const url = this.editingOrderItem ?
                `/api/order-items/${this.editingOrderItem.id}` :
                '/api/order-items';

            const method = this.editingOrderItem ? 'PUT' : 'POST';

            const response = await this.makeAuthenticatedRequest(url, {
                method: method,
                body: JSON.stringify(orderItemData)
            });

            if (!response.ok) {
                throw new Error('Failed to save order item');
            }

            this.showNotification(
                this.editingOrderItem ? 'Order item updated successfully' : 'Order item created successfully',
                'success'
            );

            this.hideOrderItemModal();
            await this.loadOrderItems();
        } catch (error) {
            console.error('Error saving order item:', error);
            this.showNotification('Failed to save order item', 'error');
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
            const response = await this.makeAuthenticatedRequest(`/api/order-items/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to delete order item');
            }

            this.showNotification('Order item deleted successfully', 'success');
            await this.loadOrderItems();
        } catch (error) {
            console.error('Error deleting order item:', error);
            this.showNotification('Failed to delete order item', 'error');
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
                this.makeAuthenticatedRequest(`/api/order-items/${id}`, {
                    method: 'DELETE'
                })
            );

            await Promise.all(deletePromises);

            this.showNotification(`${this.selectedItems.size} order items deleted successfully`, 'success');
            this.selectedItems.clear();
            document.querySelector('.bulk-actions').style.display = 'none';
            await this.loadOrderItems();
        } catch (error) {
            console.error('Error deleting order items:', error);
            this.showNotification('Failed to delete some order items', 'error');
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

    async makeAuthenticatedRequest(url, options = {}) {
        const token = localStorage.getItem('authToken');
        const defaultOptions = {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                ...options.headers
            }
        };

        return fetch(url, { ...defaultOptions, ...options });
    }

    showNotification(message, type = 'info') {
        const container = document.getElementById('notificationContainer');
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;

        const icon = type === 'success' ? 'check-circle' :
            type === 'error' ? 'exclamation-circle' :
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