// Warehouse Management JavaScript - Connected to Spring Boot API
class WarehouseManager {
    constructor() {
        // Updated API URLs to point to Spring Boot backend
        this.baseUrl = 'http://localhost:8080';
        this.apiUrl = `${this.baseUrl}/api/warehouses`;
        this.stockMovementApiUrl = `${this.baseUrl}/api/stock-movements`;
        this.currentWarehouse = null;
        this.warehouses = [];
        this.userRole = this.getUserRole();
        this.init();
    }

    getUserRole() {
        // Get userRoles from localStorage directly (as stored by app.js)
        const userRoles = JSON.parse(localStorage.getItem('userRoles') || '[]');
        console.log('User roles from localStorage:', userRoles); // Debug log

        // Return the first role if available
        if (userRoles && userRoles.length > 0) {
            return userRoles[0];
        }

        console.log('No valid role found, defaulting to USER');
        return 'USER';
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
            console.log('Loading warehouses from:', this.apiUrl);

            const response = await fetch(this.apiUrl, {
                method: 'GET',
                headers: this.getAuthHeaders(),
                mode: 'cors' // Enable CORS
            });

            console.log('Response status:', response.status);

            if (response.status === 401) {
                this.handleUnauthorized();
                return;
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const warehouses = await response.json();
            console.log('Loaded warehouses:', warehouses);

            this.warehouses = Array.isArray(warehouses) ? warehouses : [];
            this.displayWarehouses(this.warehouses);
        } catch (error) {
            console.error('Error loading warehouses:', error);

            // More specific error handling
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                this.showError('Cannot connect to server. Please ensure the backend is running on localhost:8080');
            } else {
                this.showError('Failed to load warehouses. Please try again.');
            }

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

            // Updated to match WarehouseDTO structure
            card.innerHTML = `
                <div class="warehouse-header">
                    <h3>${this.escapeHtml(warehouse.name || 'Unnamed Warehouse')}</h3>
                    <span class="warehouse-id">#${warehouse.id || 'N/A'}</span>
                </div>
                <div class="warehouse-info">
                    <p><strong>Location:</strong> ${this.escapeHtml(warehouse.location || 'Unknown')}</p>
                    <p><strong>Address:</strong> ${this.escapeHtml(warehouse.address || 'Not specified')}</p>
                    <p><strong>Capacity:</strong> ${warehouse.capacity || 'Not specified'}</p>
                    ${warehouse.managerName ? `<p><strong>Manager:</strong> ${this.escapeHtml(warehouse.managerName)}</p>` : ''}
                    <p><strong>Workers:</strong> ${warehouse.workerIds?.length || 0}</p>
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
            // Populate form fields for editing
            const nameInput = document.getElementById('name');
            const locationInput = document.getElementById('location');
            const addressInput = document.getElementById('address');
            const capacityInput = document.getElementById('capacity');
            const managerSelect = document.getElementById('managerId');

            if (nameInput) nameInput.value = warehouse.name || '';
            if (locationInput) locationInput.value = warehouse.location || '';
            if (addressInput) addressInput.value = warehouse.address || '';
            if (capacityInput) capacityInput.value = warehouse.capacity || '';
            if (managerSelect && warehouse.managerId) managerSelect.value = warehouse.managerId;
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
        const address = formData.get('address')?.toString().trim();
        const capacity = formData.get('capacity')?.toString().trim();
        const managerId = formData.get('managerId')?.toString().trim();

        // Validation
        if (!name) {
            this.showError('Warehouse name is required');
            return;
        }

        if (!location) {
            this.showError('Location is required');
            return;
        }

        try {
            const url = this.currentWarehouse ?
                `${this.apiUrl}/${this.currentWarehouse.id}` :
                this.apiUrl;

            const method = this.currentWarehouse ? 'PUT' : 'POST';

            console.log('Saving warehouse to:', url, 'with method:', method);

            // Create URLSearchParams for form data submission
            const params = new URLSearchParams();
            params.append('name', name);
            params.append('location', location);
            if (address) params.append('address', address);
            if (capacity) params.append('capacity', capacity);
            if (managerId) params.append('managerId', managerId);

            console.log('Form data:', params.toString());

            // Get auth headers and add Content-Type for form data
            const headers = this.getAuthHeaders();
            headers['Content-Type'] = 'application/x-www-form-urlencoded';

            const response = await fetch(url, {
                method: method,
                headers: headers,
                mode: 'cors',
                body: params.toString()
            });

            console.log('Save response status:', response.status);

            if (response.status === 401) {
                this.handleUnauthorized();
                return;
            }

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error response:', errorText);

                let errorMessage;
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.message || errorText;
                } catch {
                    errorMessage = errorText || `HTTP error! status: ${response.status}`;
                }
                throw new Error(errorMessage);
            }

            const savedWarehouse = await response.json();
            console.log('Saved warehouse:', savedWarehouse);

            this.closeModal('warehouseModal');
            await this.loadWarehouses();
            this.showSuccess(this.currentWarehouse ? 'Warehouse updated successfully' : 'Warehouse created successfully');
        } catch (error) {
            console.error('Error saving warehouse:', error);

            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                this.showError('Cannot connect to server. Please ensure the backend is running.');
            } else {
                this.showError('Failed to save warehouse: ' + error.message);
            }
        }
    }

    async editWarehouse(id) {
        if (!id) {
            this.showError('Invalid warehouse ID');
            return;
        }

        try {
            console.log('Loading warehouse for edit:', id);

            const response = await fetch(`${this.apiUrl}/${id}`, {
                method: 'GET',
                headers: this.getAuthHeaders(),
                mode: 'cors'
            });

            if (response.status === 401) {
                this.handleUnauthorized();
                return;
            }

            if (response.status === 404) {
                this.showError('Warehouse not found');
                return;
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const warehouse = await response.json();
            console.log('Loaded warehouse for edit:', warehouse);
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
            console.log('Loading warehouse details:', id);

            // Load warehouse details
            const warehouseResponse = await fetch(`${this.apiUrl}/${id}`, {
                method: 'GET',
                headers: this.getAuthHeaders(),
                mode: 'cors'
            });

            if (warehouseResponse.status === 401) {
                this.handleUnauthorized();
                return;
            }

            if (!warehouseResponse.ok) {
                throw new Error(`Failed to load warehouse: ${warehouseResponse.status}`);
            }

            const warehouse = await warehouseResponse.json();
            console.log('Loaded warehouse details:', warehouse);

            // Try to load stock movements (optional - may not exist yet)
            let stockMovements = [];
            try {
                const stockMovementsResponse = await fetch(`${this.stockMovementApiUrl}?warehouseId=${id}`, {
                    method: 'GET',
                    headers: this.getAuthHeaders(),
                    mode: 'cors'
                });

                if (stockMovementsResponse.ok) {
                    stockMovements = await stockMovementsResponse.json();
                    console.log('Loaded stock movements:', stockMovements);
                } else {
                    console.warn('Stock movements endpoint not available or failed');
                }
            } catch (error) {
                console.warn('Could not load stock movements:', error);
            }

            this.displayWarehouseDetails(warehouse, stockMovements);
        } catch (error) {
            console.error('Error loading warehouse details:', error);
            this.showError('Failed to load warehouse details');
        }
    }

    displayWarehouseDetails(warehouse, stockMovements = []) {
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
                    <p><strong>Address:</strong> ${this.escapeHtml(warehouse.address || 'N/A')}</p>
                    <p><strong>Capacity:</strong> ${warehouse.capacity || 'Not specified'}</p>
                    ${warehouse.managerName ? `<p><strong>Manager:</strong> ${this.escapeHtml(warehouse.managerName)}</p>` : '<p><strong>Manager:</strong> Not assigned</p>'}
                    <p><strong>Workers:</strong> ${warehouse.workerIds?.length || 0}</p>
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
            console.log('Deleting warehouse:', id);

            const response = await fetch(`${this.apiUrl}/${id}`, {
                method: 'DELETE',
                headers: this.getAuthHeaders(),
                mode: 'cors'
            });

            console.log('Delete response status:', response.status);

            if (response.status === 401) {
                this.handleUnauthorized();
                return;
            }

            if (response.status === 404) {
                this.showError('Warehouse not found');
                return;
            }

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Delete error response:', errorText);

                let errorMessage;
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.message || errorText;
                } catch {
                    errorMessage = errorText || `HTTP error! status: ${response.status}`;
                }
                throw new Error(errorMessage);
            }

            await this.loadWarehouses();
            this.showSuccess('Warehouse deleted successfully');
        } catch (error) {
            console.error('Error deleting warehouse:', error);

            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                this.showError('Cannot connect to server. Please ensure the backend is running.');
            } else {
                this.showError('Failed to delete warehouse: ' + error.message);
            }
        }
    }

    async searchWarehouses() {
        const searchInput = document.getElementById('searchInput');
        if (!searchInput) return;

        const searchTerm = searchInput.value.toLowerCase().trim();

        if (!searchTerm) {
            this.displayWarehouses(this.warehouses);
            return;
        }

        // Use the Spring Boot search endpoint if available
        try {
            const response = await fetch(`${this.apiUrl}/search?name=${encodeURIComponent(searchTerm)}`, {
                method: 'GET',
                headers: this.getAuthHeaders(),
                mode: 'cors'
            });

            if (response.ok) {
                const searchResults = await response.json();
                this.displayWarehouses(searchResults);
                return;
            }
        } catch (error) {
            console.warn('Server search failed, using client-side search:', error);
        }

        // Fallback to client-side filtering
        const filteredWarehouses = this.warehouses.filter(warehouse => {
            return warehouse?.name?.toLowerCase().includes(searchTerm) ||
                warehouse?.location?.toLowerCase().includes(searchTerm) ||
                warehouse?.address?.toLowerCase().includes(searchTerm) ||
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
        const headers = {};

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        return headers;
    }

    handleUnauthorized() {
        console.warn('Unauthorized access - redirecting to login');
        this.logout();
    }

    showSuccess(message) {
        // Replace with a better notification system if available
        console.log('Success:', message);
        alert(message);
    }

    showError(message) {
        // Replace with a better notification system if available
        console.error('Error:', message);
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
    console.log('Initializing Warehouse Manager...');
    window.warehouseManager = new WarehouseManager();
});