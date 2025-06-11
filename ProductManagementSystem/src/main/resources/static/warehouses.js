// Warehouse Management JavaScript
class WarehouseManager {
    constructor() {
        this.apiUrl = '/api/warehouses';
        this.stockMovementApiUrl = '/api/stock-movements';
        this.currentWarehouse = null;
        this.warehouses = [];
        this.userRole = this.getUserRole();
        this.init();
    }

    getUserRole() {
        try {
            const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
            return user.roles?.[0]?.name || 'USER';
        } catch (error) {
            console.error('Error parsing user data:', error);
            return 'USER';
        }
    }

    init() {
        this.bindEvents();
        this.loadWarehouses();
        this.checkPermissions();
    }

    checkPermissions() {
        const isAdmin = this.userRole === 'ADMIN';
        const createBtn = document.getElementById('createWarehouseBtn');

        if (createBtn && !isAdmin) {
            createBtn.style.display = 'none';
        }
    }

    bindEvents() {
        // Create warehouse button
        const createBtn = document.getElementById('createWarehouseBtn');
        if (createBtn) {
            createBtn.addEventListener('click', () => {
                this.openWarehouseModal();
            });
        }

        // Search functionality
        const searchBtn = document.getElementById('searchBtn');
        const searchInput = document.getElementById('searchInput');

        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.searchWarehouses();
            });
        }

        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.searchWarehouses();
                }
            });
        }

        // Modal events
        const warehouseModalClose = document.querySelector('#warehouseModal .close');
        if (warehouseModalClose) {
            warehouseModalClose.addEventListener('click', () => {
                this.closeModal('warehouseModal');
            });
        }

        const cancelBtn = document.getElementById('cancelBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.closeModal('warehouseModal');
            });
        }

        const detailsModalClose = document.querySelector('#warehouseDetailsModal .close');
        if (detailsModalClose) {
            detailsModalClose.addEventListener('click', () => {
                this.closeModal('warehouseDetailsModal');
            });
        }

        const closeDetailsBtn = document.querySelector('.close-details');
        if (closeDetailsBtn) {
            closeDetailsBtn.addEventListener('click', () => {
                this.closeModal('warehouseDetailsModal');
            });
        }

        // Form submission
        const warehouseForm = document.getElementById('warehouseForm');
        if (warehouseForm) {
            warehouseForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveWarehouse();
            });
        }

        // Logout - check if button exists first
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }

        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            const warehouseModal = document.getElementById('warehouseModal');
            const detailsModal = document.getElementById('warehouseDetailsModal');

            if (e.target === warehouseModal) {
                this.closeModal('warehouseModal');
            }
            if (e.target === detailsModal) {
                this.closeModal('warehouseDetailsModal');
            }
        });
    }

    async loadWarehouses() {
        try {
            const response = await fetch(this.apiUrl, {
                headers: this.getAuthHeaders()
            });

            if (response.status === 401) {
                this.handleUnauthorized();
                return;
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const warehouses = await response.json();
            this.warehouses = Array.isArray(warehouses) ? warehouses : [];
            this.displayWarehouses(this.warehouses);
        } catch (error) {
            console.error('Error loading warehouses:', error);
            this.showError('Failed to load warehouses. Please try again.');
            this.warehouses = [];
            this.displayWarehouses([]);
        }
    }

    displayWarehouses(warehouses) {
        const grid = document.getElementById('warehousesGrid');
        if (!grid) {
            console.error('Warehouses grid element not found');
            return;
        }

        grid.innerHTML = '';

        if (!warehouses || warehouses.length === 0) {
            grid.innerHTML = '<div class="no-results">No warehouses found.</div>';
            return;
        }

        warehouses.forEach(warehouse => {
            if (!warehouse) return;

            const card = document.createElement('div');
            card.className = 'warehouse-card';
            card.innerHTML = `
                <div class="warehouse-header">
                    <h3>${this.escapeHtml(warehouse.name || 'Unnamed Warehouse')}</h3>
                    <span class="warehouse-id">#${warehouse.id || 'N/A'}</span>
                </div>
                <div class="warehouse-info">
                    <p><strong>Location:</strong> ${this.escapeHtml(warehouse.location || 'Unknown')}</p>
                    <p><strong>Stock Movements:</strong> ${warehouse.stockMovements?.length || 0}</p>
                </div>
                <div class="warehouse-actions">
                    <button class="btn btn-sm btn-info" onclick="warehouseManager.viewWarehouse(${warehouse.id})">
                        View Details
                    </button>
                    ${this.userRole === 'ADMIN' ? `
                        <button class="btn btn-sm btn-primary" onclick="warehouseManager.editWarehouse(${warehouse.id})">
                            Edit
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="warehouseManager.deleteWarehouse(${warehouse.id})">
                            Delete
                        </button>
                    ` : ''}
                </div>
            `;
            grid.appendChild(card);
        });
    }

    async openWarehouseModal(warehouse = null) {
        this.currentWarehouse = warehouse;
        const modal = document.getElementById('warehouseModal');
        const title = document.getElementById('modalTitle');
        const form = document.getElementById('warehouseForm');

        if (!modal || !title || !form) {
            console.error('Modal elements not found');
            return;
        }

        title.textContent = warehouse ? 'Edit Warehouse' : 'Add Warehouse';
        form.reset();

        if (warehouse) {
            const nameInput = document.getElementById('name');
            const locationInput = document.getElementById('location');

            if (nameInput) nameInput.value = warehouse.name || '';
            if (locationInput) locationInput.value = warehouse.location || '';
        }

        modal.style.display = 'block';
    }

    async saveWarehouse() {
        const form = document.getElementById('warehouseForm');
        if (!form) {
            this.showError('Form not found');
            return;
        }

        const formData = new FormData(form);
        const name = formData.get('name')?.toString().trim();
        const location = formData.get('location')?.toString().trim();

        // Validation
        if (!name) {
            this.showError('Warehouse name is required');
            return;
        }

        if (!location) {
            this.showError('Location is required');
            return;
        }

        const warehouseData = { name, location };

        try {
            const url = this.currentWarehouse ?
                `${this.apiUrl}/${this.currentWarehouse.id}` :
                this.apiUrl;

            const method = this.currentWarehouse ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    ...this.getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(warehouseData)
            });

            if (response.status === 401) {
                this.handleUnauthorized();
                return;
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            this.closeModal('warehouseModal');
            await this.loadWarehouses();
            this.showSuccess(this.currentWarehouse ? 'Warehouse updated successfully' : 'Warehouse created successfully');
        } catch (error) {
            console.error('Error saving warehouse:', error);
            this.showError('Failed to save warehouse: ' + error.message);
        }
    }

    async editWarehouse(id) {
        if (!id) {
            this.showError('Invalid warehouse ID');
            return;
        }

        try {
            const response = await fetch(`${this.apiUrl}/${id}`, {
                headers: this.getAuthHeaders()
            });

            if (response.status === 401) {
                this.handleUnauthorized();
                return;
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const warehouse = await response.json();
            this.openWarehouseModal(warehouse);
        } catch (error) {
            console.error('Error loading warehouse:', error);
            this.showError('Failed to load warehouse details');
        }
    }

    async viewWarehouse(id) {
        if (!id) {
            this.showError('Invalid warehouse ID');
            return;
        }

        try {
            const [warehouseResponse, stockMovementsResponse] = await Promise.all([
                fetch(`${this.apiUrl}/${id}`, {
                    headers: this.getAuthHeaders()
                }),
                fetch(`${this.stockMovementApiUrl}?warehouseId=${id}`, {
                    headers: this.getAuthHeaders()
                })
            ]);

            if (warehouseResponse.status === 401 || stockMovementsResponse.status === 401) {
                this.handleUnauthorized();
                return;
            }

            if (!warehouseResponse.ok) {
                throw new Error(`Failed to load warehouse: ${warehouseResponse.status}`);
            }

            const warehouse = await warehouseResponse.json();
            let stockMovements = [];

            if (stockMovementsResponse.ok) {
                stockMovements = await stockMovementsResponse.json();
            } else {
                console.warn('Failed to load stock movements');
            }

            this.displayWarehouseDetails(warehouse, stockMovements);
        } catch (error) {
            console.error('Error loading warehouse details:', error);
            this.showError('Failed to load warehouse details');
        }
    }

    displayWarehouseDetails(warehouse, stockMovements) {
        const content = document.getElementById('warehouseDetailsContent');
        const title = document.getElementById('warehouseDetailsTitle');
        const modal = document.getElementById('warehouseDetailsModal');

        if (!content || !title || !modal) {
            console.error('Details modal elements not found');
            return;
        }

        title.textContent = `${warehouse.name || 'Warehouse'} - Details`;

        // Calculate stock summary
        const stockSummary = this.calculateStockSummary(stockMovements || []);

        content.innerHTML = `
            <div class="warehouse-details">
                <div class="warehouse-info-section">
                    <h3>Warehouse Information</h3>
                    <p><strong>ID:</strong> ${warehouse.id || 'N/A'}</p>
                    <p><strong>Name:</strong> ${this.escapeHtml(warehouse.name || 'N/A')}</p>
                    <p><strong>Location:</strong> ${this.escapeHtml(warehouse.location || 'N/A')}</p>
                </div>

                <div class="stock-summary-section">
                    <h3>Stock Summary</h3>
                    <div class="stock-metrics">
                        <div class="metric-card">
                            <h4>Total Products</h4>
                            <span class="metric-value">${stockSummary.totalProducts}</span>
                        </div>
                        <div class="metric-card">
                            <h4>Total Quantity</h4>
                            <span class="metric-value">${stockSummary.totalQuantity}</span>
                        </div>
                        <div class="metric-card">
                            <h4>Total Movements</h4>
                            <span class="metric-value">${(stockMovements || []).length}</span>
                        </div>
                    </div>
                </div>

                <div class="stock-movements-section">
                    <h3>Recent Stock Movements</h3>
                    <div class="table-container">
                        <table class="stock-movements-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Product</th>
                                    <th>Quantity</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${(stockMovements || []).slice(0, 10).map(movement => `
                                    <tr>
                                        <td>${this.formatDateTime(movement.movementDate)}</td>
                                        <td>${this.escapeHtml(movement.product?.name || 'Unknown Product')}</td>
                                        <td>${movement.quantity || 0}</td>
                                        <td>
                                            <span class="status-badge ${(movement.movementStatus || 'other').toLowerCase()}">
                                                ${movement.movementStatus || 'OTHER'}
                                            </span>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    ${(stockMovements || []).length > 10 ? `
                        <p class="text-muted">Showing 10 of ${stockMovements.length} movements</p>
                    ` : ''}
                    ${(stockMovements || []).length === 0 ? `
                        <p class="text-muted">No stock movements found</p>
                    ` : ''}
                </div>
            </div>
        `;

        modal.style.display = 'block';
    }

    calculateStockSummary(stockMovements) {
        const productSet = new Set();
        let totalQuantity = 0;

        if (!Array.isArray(stockMovements)) {
            return { totalProducts: 0, totalQuantity: 0 };
        }

        stockMovements.forEach(movement => {
            if (movement?.product?.id) {
                productSet.add(movement.product.id);
            }
            if (movement?.quantity && typeof movement.quantity === 'number') {
                totalQuantity += movement.quantity;
            }
        });

        return {
            totalProducts: productSet.size,
            totalQuantity: totalQuantity
        };
    }

    async deleteWarehouse(id) {
        if (!id) {
            this.showError('Invalid warehouse ID');
            return;
        }

        if (!confirm('Are you sure you want to delete this warehouse? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`${this.apiUrl}/${id}`, {
                method: 'DELETE',
                headers: this.getAuthHeaders()
            });

            if (response.status === 401) {
                this.handleUnauthorized();
                return;
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            await this.loadWarehouses();
            this.showSuccess('Warehouse deleted successfully');
        } catch (error) {
            console.error('Error deleting warehouse:', error);
            this.showError('Failed to delete warehouse: ' + error.message);
        }
    }

    searchWarehouses() {
        const searchInput = document.getElementById('searchInput');
        if (!searchInput) return;

        const searchTerm = searchInput.value.toLowerCase().trim();

        if (!searchTerm) {
            this.displayWarehouses(this.warehouses);
            return;
        }

        const filteredWarehouses = this.warehouses.filter(warehouse => {
            return warehouse?.name?.toLowerCase().includes(searchTerm) ||
                warehouse?.location?.toLowerCase().includes(searchTerm) ||
                warehouse?.id?.toString().includes(searchTerm);
        });

        this.displayWarehouses(filteredWarehouses);
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }

    formatDateTime(dateString) {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleString();
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Invalid Date';
        }
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    getAuthHeaders() {
        const token = localStorage.getItem('authToken');
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    }

    handleUnauthorized() {
        console.warn('Unauthorized access - redirecting to login');
        this.logout();
    }

    showSuccess(message) {
        // Replace with a better notification system if available
        alert(message);
    }

    showError(message) {
        // Replace with a better notification system if available
        alert('Error: ' + message);
    }

    logout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.warehouseManager = new WarehouseManager();
});