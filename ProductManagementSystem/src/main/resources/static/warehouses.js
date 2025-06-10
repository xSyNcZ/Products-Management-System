// Warehouse Management JavaScript
class WarehouseManager {
    constructor() {
        this.apiUrl = '/api/warehouses';
        this.stockMovementApiUrl = '/api/stock-movements';
        this.currentWarehouse = null;
        this.userRole = this.getUserRole();
        this.init();
    }

    getUserRole() {
        const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
        return user.roles?.[0]?.name || 'USER';
    }

    init() {
        this.bindEvents();
        this.loadWarehouses();
        this.checkPermissions();
    }

    checkPermissions() {
        const isAdmin = this.userRole === 'ADMIN';
        const createBtn = document.getElementById('createWarehouseBtn');

        if (!isAdmin) {
            createBtn.style.display = 'none';
        }
    }

    bindEvents() {
        // Create warehouse button
        document.getElementById('createWarehouseBtn').addEventListener('click', () => {
            this.openWarehouseModal();
        });

        // Search functionality
        document.getElementById('searchBtn').addEventListener('click', () => {
            this.searchWarehouses();
        });

        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchWarehouses();
            }
        });

        // Modal events
        document.querySelector('#warehouseModal .close').addEventListener('click', () => {
            this.closeModal('warehouseModal');
        });

        document.getElementById('cancelBtn').addEventListener('click', () => {
            this.closeModal('warehouseModal');
        });

        document.querySelector('#warehouseDetailsModal .close').addEventListener('click', () => {
            this.closeModal('warehouseDetailsModal');
        });

        document.querySelector('.close-details').addEventListener('click', () => {
            this.closeModal('warehouseDetailsModal');
        });

        // Form submission
        document.getElementById('warehouseForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveWarehouse();
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });
    }

    async loadWarehouses() {
        try {
            const response = await fetch(this.apiUrl, {
                headers: this.getAuthHeaders()
            });

            if (!response.ok) throw new Error('Failed to load warehouses');

            const warehouses = await response.json();
            this.warehouses = warehouses;
            this.displayWarehouses(warehouses);
        } catch (error) {
            console.error('Error loading warehouses:', error);
            this.showError('Failed to load warehouses');
        }
    }

    displayWarehouses(warehouses) {
        const grid = document.getElementById('warehousesGrid');
        grid.innerHTML = '';

        warehouses.forEach(warehouse => {
            const card = document.createElement('div');
            card.className = 'warehouse-card';
            card.innerHTML = `
                <div class="warehouse-header">
                    <h3>${warehouse.name}</h3>
                    <span class="warehouse-id">#${warehouse.id}</span>
                </div>
                <div class="warehouse-info">
                    <p><strong>Location:</strong> ${warehouse.location}</p>
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

        title.textContent = warehouse ? 'Edit Warehouse' : 'Add Warehouse';
        form.reset();

        if (warehouse) {
            document.getElementById('name').value = warehouse.name || '';
            document.getElementById('location').value = warehouse.location || '';
        }

        modal.style.display = 'block';
    }

    async saveWarehouse() {
        const formData = new FormData(document.getElementById('warehouseForm'));
        const warehouseData = {
            name: formData.get('name'),
            location: formData.get('location')
        };

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

            if (!response.ok) throw new Error('Failed to save warehouse');

            this.closeModal('warehouseModal');
            this.loadWarehouses();
            this.showSuccess(this.currentWarehouse ? 'Warehouse updated successfully' : 'Warehouse created successfully');
        } catch (error) {
            console.error('Error saving warehouse:', error);
            this.showError('Failed to save warehouse');
        }
    }

    async editWarehouse(id) {
        try {
            const response = await fetch(`${this.apiUrl}/${id}`, {
                headers: this.getAuthHeaders()
            });

            const warehouse = await response.json();
            this.openWarehouseModal(warehouse);
        } catch (error) {
            console.error('Error loading warehouse:', error);
            this.showError('Failed to load warehouse details');
        }
    }

    async viewWarehouse(id) {
        try {
            const [warehouseResponse, stockMovementsResponse] = await Promise.all([
                fetch(`${this.apiUrl}/${id}`, {
                    headers: this.getAuthHeaders()
                }),
                fetch(`${this.stockMovementApiUrl}?warehouseId=${id}`, {
                    headers: this.getAuthHeaders()
                })
            ]);

            const warehouse = await warehouseResponse.json();
            const stockMovements = await stockMovementsResponse.json();

            this.displayWarehouseDetails(warehouse, stockMovements);
        } catch (error) {
            console.error('Error loading warehouse details:', error);
            this.showError('Failed to load warehouse details');
        }
    }

    displayWarehouseDetails(warehouse, stockMovements) {
        const content = document.getElementById('warehouseDetailsContent');
        const title = document.getElementById('warehouseDetailsTitle');

        title.textContent = `${warehouse.name} - Details`;

        // Calculate stock summary
        const stockSummary = this.calculateStockSummary(stockMovements);

        content.innerHTML = `
            <div class="warehouse-details">
                <div class="warehouse-info-section">
                    <h3>Warehouse Information</h3>
                    <p><strong>ID:</strong> ${warehouse.id}</p>
                    <p><strong>Name:</strong> ${warehouse.name}</p>
                    <p><strong>Location:</strong> ${warehouse.location}</p>
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
                            <span class="metric-value">${stockMovements.length}</span>
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
                                ${stockMovements.slice(0, 10).map(movement => `
                                    <tr>
                                        <td>${this.formatDateTime(movement.movementDate)}</td>
                                        <td>${movement.product?.name || 'Unknown Product'}</td>
                                        <td>${movement.quantity}</td>
                                        <td>
                                            <span class="status-badge ${movement.movementStatus?.toLowerCase() || 'other'}">
                                                ${movement.movementStatus || 'OTHER'}
                                            </span>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    ${stockMovements.length > 10 ? `
                        <p class="text-muted">Showing 10 of ${stockMovements.length} movements</p>
                    ` : ''}
                </div>
            </div>
        `;

        document.getElementById('warehouseDetailsModal').style.display = 'block';
    }

    calculateStockSummary(stockMovements) {
        const productSet = new Set();
        let totalQuantity = 0;

        stockMovements.forEach(movement => {
            if (movement.product?.id) {
                productSet.add(movement.product.id);
            }
            if (movement.quantity) {
                totalQuantity += movement.quantity;
            }
        });

        return {
            totalProducts: productSet.size,
            totalQuantity: totalQuantity
        };
    }

    async deleteWarehouse(id) {
        if (!confirm('Are you sure you want to delete this warehouse? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`${this.apiUrl}/${id}`, {
                method: 'DELETE',
                headers: this.getAuthHeaders()
            });

            if (!response.ok) throw new Error('Failed to delete warehouse');

            this.loadWarehouses();
            this.showSuccess('Warehouse deleted successfully');
        } catch (error) {
            console.error('Error deleting warehouse:', error);
            this.showError('Failed to delete warehouse');
        }
    }

    searchWarehouses() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();

        const filteredWarehouses = this.warehouses.filter(warehouse => {
            return warehouse.name?.toLowerCase().includes(searchTerm) ||
                warehouse.location?.toLowerCase().includes(searchTerm) ||
                warehouse.id.toString().includes(searchTerm);
        });

        this.displayWarehouses(filteredWarehouses);
    }

    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }

    formatDateTime(dateString) {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString();
    }

    getAuthHeaders() {
        const token = localStorage.getItem('authToken');
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    }

    showSuccess(message) {
        alert(message);
    }

    showError(message) {
        alert(message);
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