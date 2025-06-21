// Complete Permission Management System - Single File Implementation

// Global variables
let currentPage = 1;
let itemsPerPage = 10;
let allPermissions = [];
let filteredPermissions = [];
let currentEditingId = null;
let apiBaseUrl = '/api/permissions';

// API Client Class
class PermissionApiClient {
    constructor(baseUrl, authToken = null) {
        this.baseUrl = baseUrl;
        this.authToken = authToken;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (this.authToken) {
            headers['Authorization'] = `Bearer ${this.authToken}`;
        }

        const config = {
            ...options,
            headers
        };

        const response = await fetch(url, config);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
        }

        // Handle empty responses (like DELETE)
        if (response.status === 204) {
            return null;
        }

        return await response.json();
    }

    async getAllPermissions() {
        return await this.request('');
    }

    async getPermissionById(id) {
        return await this.request(`/${id}`);
    }

    async getPermissionByName(name) {
        return await this.request(`/name/${encodeURIComponent(name)}`);
    }

    async createPermission(permissionData) {
        return await this.request('', {
            method: 'POST',
            body: JSON.stringify(permissionData)
        });
    }

    async updatePermission(id, permissionData) {
        return await this.request(`/${id}`, {
            method: 'PUT',
            body: JSON.stringify(permissionData)
        });
    }

    async deletePermission(id) {
        return await this.request(`/${id}`, {
            method: 'DELETE'
        });
    }

    async searchPermissions(searchTerm) {
        return await this.request(`/search?name=${encodeURIComponent(searchTerm)}`);
    }

    async checkPermissionExists(name) {
        return await this.request(`/exists/${encodeURIComponent(name)}`);
    }

    async getPermissionsByRole(roleId) {
        return await this.request(`/role/${roleId}`);
    }
}

// Permission Manager Class
class PermissionManager {
    constructor(apiClient) {
        this.apiClient = apiClient;
        this.defaultPermissions = [
            { name: 'user:create', description: 'Create new users' },
            { name: 'user:read', description: 'View user information' },
            { name: 'user:update', description: 'Update user information' },
            { name: 'user:delete', description: 'Delete users' },
            { name: 'user:manage_roles', description: 'Manage user roles' },
            { name: 'role:create', description: 'Create new roles' },
            { name: 'role:read', description: 'View role information' },
            { name: 'role:update', description: 'Update role information' },
            { name: 'role:delete', description: 'Delete roles' },
            { name: 'role:assign_permissions', description: 'Assign permissions to roles' },
            { name: 'product:create', description: 'Create new products' },
            { name: 'product:read', description: 'View product information' },
            { name: 'product:update', description: 'Update product information' },
            { name: 'product:delete', description: 'Delete products' },
            { name: 'product:manage_inventory', description: 'Manage product inventory' },
            { name: 'order:create', description: 'Create new orders' },
            { name: 'order:read', description: 'View order information' },
            { name: 'order:update', description: 'Update order information' },
            { name: 'order:delete', description: 'Delete orders' },
            { name: 'order:process', description: 'Process orders' },
            { name: 'payment:process', description: 'Process payments' },
            { name: 'payment:refund', description: 'Process refunds' },
            { name: 'payment:view', description: 'View payment information' },
            { name: 'warehouse:manage', description: 'Manage warehouse operations' },
            { name: 'warehouse:view', description: 'View warehouse information' },
            { name: 'system:admin', description: 'System administration' },
            { name: 'system:backup', description: 'System backup operations' },
            { name: 'system:configure', description: 'System configuration' },
            { name: 'report:generate', description: 'Generate reports' },
            { name: 'report:view', description: 'View reports' },
        ];
    }

    async syncPermissions() {
        try {
            // Get current permissions from database
            const currentPermissions = await this.apiClient.getAllPermissions();
            const currentPermissionNames = new Set(currentPermissions.map(p => p.name));

            // Find missing permissions
            const missingPermissions = this.defaultPermissions.filter(
                defaultPerm => !currentPermissionNames.has(defaultPerm.name)
            );

            let results = {
                synced: 0,
                errors: []
            };

            // Create missing permissions
            for (const permission of missingPermissions) {
                try {
                    await this.apiClient.createPermission(permission);
                    results.synced++;
                } catch (error) {
                    results.errors.push({
                        permission: permission.name,
                        error: error.message
                    });
                }
            }

            return {
                success: true,
                synced: results.synced,
                total: missingPermissions.length,
                errors: results.errors
            };
        } catch (error) {
            throw new Error(`Sync failed: ${error.message}`);
        }
    }

    async validatePermissions() {
        try {
            // Get current permissions from database
            const currentPermissions = await this.apiClient.getAllPermissions();
            const currentPermissionNames = new Set(currentPermissions.map(p => p.name));
            const defaultPermissionNames = new Set(this.defaultPermissions.map(p => p.name));

            // Find missing and extra permissions
            const missingInApi = this.defaultPermissions.filter(
                defaultPerm => !currentPermissionNames.has(defaultPerm.name)
            );

            const extraInApi = currentPermissions.filter(
                currentPerm => !defaultPermissionNames.has(currentPerm.name)
            );

            return {
                valid: missingInApi.length === 0,
                missingInApi: missingInApi,
                extraInApi: extraInApi,
                totalInApi: currentPermissions.length,
                totalExpected: this.defaultPermissions.length
            };
        } catch (error) {
            throw new Error(`Validation failed: ${error.message}`);
        }
    }

    async createMissingPermissions(permissions) {
        const results = [];

        for (const permission of permissions) {
            try {
                // Check if permission already exists
                const exists = await this.apiClient.checkPermissionExists(permission.name);
                if (exists) {
                    results.push({
                        permission: permission.name,
                        success: false,
                        message: 'Already exists'
                    });
                    continue;
                }

                await this.apiClient.createPermission(permission);
                results.push({
                    permission: permission.name,
                    success: true,
                    message: 'Created'
                });
            } catch (error) {
                results.push({
                    permission: permission.name,
                    success: false,
                    message: error.message
                });
            }
        }

        return results;
    }
}

// Global instances
let apiClient;
let permissionManager;

// Initialize the application
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Get auth token from storage if available
        let authToken = null;
        try {
            authToken = localStorage?.getItem('authToken') || sessionStorage?.getItem('authToken');
        } catch (e) {
            console.warn('Could not access storage for auth token');
        }

        // Initialize API client and permission manager
        apiClient = new PermissionApiClient(apiBaseUrl, authToken);
        permissionManager = new PermissionManager(apiClient);

        updateSystemStatus('connected', 'Connected to API');
        await loadPermissions();

    } catch (error) {
        console.error('Failed to initialize permission system:', error);
        updateSystemStatus('error', 'API Connection Failed');
        showMessage('Failed to connect to permission API. Some features may not work.', 'error');
    }

    // Set up form event listener
    const form = document.getElementById('permission-form');
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            await savePermission();
        });
    }
});

// System status management
function updateSystemStatus(status, message) {
    const statusDot = document.getElementById('status-dot');
    const statusText = document.getElementById('status-text');

    if (statusDot && statusText) {
        statusDot.className = `status-dot ${status}`;
        statusText.textContent = message;
    }
}

// Load permissions from API
async function loadPermissions() {
    try {
        showLoading(true);

        if (!apiClient) {
            throw new Error('API client not initialized');
        }

        allPermissions = await apiClient.getAllPermissions();

        // Add role count information (this would come from your actual API)
        allPermissions = allPermissions.map(permission => ({
            ...permission,
            rolesCount: permission.rolesCount || 0,
            associatedRoles: permission.associatedRoles || []
        }));

        filteredPermissions = [...allPermissions];

        updateStatistics();
        renderPermissions();
        updateSystemStatus('connected', 'Data loaded successfully');

    } catch (error) {
        console.error('Failed to load permissions:', error);
        showMessage('Failed to load permissions from server.', 'error');
        updateSystemStatus('error', 'Failed to load data');

        // Show empty state when loading fails
        const emptyState = document.getElementById('empty-permissions');
        if (emptyState) {
            emptyState.style.display = 'block';
        }

        const container = document.getElementById('permissions-container');
        if (container) {
            container.innerHTML = '';
        }
    } finally {
        showLoading(false);
    }
}

// Update statistics
function updateStatistics() {
    const totalElement = document.getElementById('total-permissions');
    const usedElement = document.getElementById('used-permissions');
    const unusedElement = document.getElementById('unused-permissions');
    const rolesElement = document.getElementById('roles-count');

    if (totalElement) totalElement.textContent = allPermissions.length;
    if (usedElement) usedElement.textContent = allPermissions.filter(p => (p.rolesCount || 0) > 0).length;
    if (unusedElement) unusedElement.textContent = allPermissions.filter(p => (p.rolesCount || 0) === 0).length;

    // Calculate unique roles
    const totalRoles = new Set(allPermissions.flatMap(p => p.associatedRoles || [])).size;
    if (rolesElement) rolesElement.textContent = totalRoles;
}

// Render permissions list
function renderPermissions() {
    const container = document.getElementById('permissions-container');
    if (!container) return;

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pagePermissions = filteredPermissions.slice(startIndex, endIndex);

    const emptyState = document.getElementById('empty-permissions');
    const pagination = document.getElementById('pagination');

    if (pagePermissions.length === 0) {
        if (emptyState) emptyState.style.display = 'block';
        if (pagination) pagination.style.display = 'none';
        container.innerHTML = '';
        return;
    }

    if (emptyState) emptyState.style.display = 'none';

    const html = pagePermissions.map(permission => `
        <div class="permission-item" data-id="${permission.id}">
            <div class="permission-header">
                <h4 class="permission-name">${escapeHtml(permission.name)}</h4>
                <div class="permission-actions">
                    <button type="button" class="btn btn-sm btn-secondary" onclick="viewPermission(${permission.id})">View</button>
                    <button type="button" class="btn btn-sm btn-primary" onclick="editPermission(${permission.id})">Edit</button>
                    <button type="button" class="btn btn-sm btn-danger" onclick="confirmDeletePermission(${permission.id})">Delete</button>
                </div>
            </div>
            <div class="permission-details">
                <p class="permission-description">${escapeHtml(permission.description || 'No description provided')}</p>
                <div class="permission-meta">
                    <span class="permission-category">${getPermissionCategory(permission.name)}</span>
                    <span class="permission-usage">${permission.rolesCount || 0} roles</span>
                </div>
            </div>
        </div>
    `).join('');

    container.innerHTML = html;
    updatePagination();
}

// Get permission category from name
function getPermissionCategory(name) {
    const resource = name.split(':')[0];
    const categoryMap = {
        'user': 'User Management',
        'role': 'Role Management',
        'product': 'Product Management',
        'order': 'Order Management',
        'payment': 'Payment Management',
        'warehouse': 'Warehouse Management',
        'system': 'System Administration',
        'report': 'Reporting'
    };
    return categoryMap[resource] || 'Other';
}

// Filter permissions
function filterPermissions() {
    const searchInput = document.getElementById('permission-search');
    const categoryFilter = document.getElementById('category-filter');

    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const categoryFilterValue = categoryFilter ? categoryFilter.value : '';

    filteredPermissions = allPermissions.filter(permission => {
        const matchesSearch = !searchTerm ||
            permission.name.toLowerCase().includes(searchTerm) ||
            (permission.description && permission.description.toLowerCase().includes(searchTerm));

        const matchesCategory = !categoryFilterValue ||
            permission.name.toLowerCase().startsWith(categoryFilterValue + ':');

        return matchesSearch && matchesCategory;
    });

    currentPage = 1;
    renderPermissions();
}

// Pagination
function updatePagination() {
    const totalPages = Math.ceil(filteredPermissions.length / itemsPerPage);
    const pageInfo = document.getElementById('page-info');
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    const pagination = document.getElementById('pagination');

    if (!pagination) return;

    if (totalPages <= 1) {
        pagination.style.display = 'none';
        return;
    }

    pagination.style.display = 'block';
    if (pageInfo) pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    if (prevBtn) prevBtn.disabled = currentPage === 1;
    if (nextBtn) nextBtn.disabled = currentPage === totalPages;
}

function changePage(direction) {
    const totalPages = Math.ceil(filteredPermissions.length / itemsPerPage);
    const newPage = currentPage + direction;

    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        renderPermissions();
    }
}

// Form handling
async function savePermission() {
    const form = document.getElementById('permission-form');
    if (!form) return;

    const formData = new FormData(form);
    const permissionData = {
        name: formData.get('name'),
        description: formData.get('description')
    };

    const saveBtn = document.getElementById('save-btn');
    const btnText = saveBtn?.querySelector('.btn-text');
    const btnLoading = saveBtn?.querySelector('.btn-loading');

    try {
        if (btnText) btnText.style.display = 'none';
        if (btnLoading) btnLoading.style.display = 'inline';
        if (saveBtn) saveBtn.disabled = true;

        let result;
        if (currentEditingId) {
            result = await apiClient.updatePermission(currentEditingId, permissionData);
            showMessage('Permission updated successfully!', 'success');
        } else {
            result = await apiClient.createPermission(permissionData);
            showMessage('Permission created successfully!', 'success');
        }

        clearPermissionForm();
        await loadPermissions();

    } catch (error) {
        console.error('Failed to save permission:', error);
        showMessage(error.message || 'Failed to save permission.', 'error');
    } finally {
        if (btnText) btnText.style.display = 'inline';
        if (btnLoading) btnLoading.style.display = 'none';
        if (saveBtn) saveBtn.disabled = false;
    }
}

function clearPermissionForm() {
    const form = document.getElementById('permission-form');
    if (form) form.reset();

    const permissionId = document.getElementById('permissionId');
    if (permissionId) permissionId.value = '';

    currentEditingId = null;

    const btnText = document.querySelector('.btn-text');
    if (btnText) btnText.textContent = 'Save Permission';

    const deleteBtn = document.getElementById('delete-btn');
    if (deleteBtn) deleteBtn.style.display = 'none';
}

async function editPermission(id) {
    try {
        const permission = await apiClient.getPermissionById(id);

        const permissionId = document.getElementById('permissionId');
        const permissionName = document.getElementById('permissionName');
        const permissionDescription = document.getElementById('permissionDescription');
        const permissionCategory = document.getElementById('permissionCategory');

        if (permissionId) permissionId.value = permission.id;
        if (permissionName) permissionName.value = permission.name;
        if (permissionDescription) permissionDescription.value = permission.description || '';

        if (permissionCategory) {
            const category = permission.name.split(':')[0];
            permissionCategory.value = category;
        }

        currentEditingId = id;

        const btnText = document.querySelector('.btn-text');
        if (btnText) btnText.textContent = 'Update Permission';

        const deleteBtn = document.getElementById('delete-btn');
        if (deleteBtn) deleteBtn.style.display = 'inline-block';

        // Scroll to form
        const formSection = document.querySelector('.form-section');
        if (formSection) {
            formSection.scrollIntoView({ behavior: 'smooth' });
        }

    } catch (error) {
        console.error('Failed to load permission for editing:', error);
        showMessage('Failed to load permission details.', 'error');
    }
}

function confirmDeletePermission(id) {
    const permission = allPermissions.find(p => p.id === id);
    if (!permission) return;

    showConfirmDialog(
        `Are you sure you want to delete the permission "${permission.name}"? This action cannot be undone.`,
        () => deletePermissionById(id)
    );
}

async function deletePermissionById(id) {
    try {
        await apiClient.deletePermission(id);
        showMessage('Permission deleted successfully!', 'success');
        await loadPermissions();

        if (currentEditingId === id) {
            clearPermissionForm();
        }

    } catch (error) {
        console.error('Failed to delete permission:', error);
        showMessage(error.message || 'Failed to delete permission.', 'error');
    }
}

// Modal functions
function viewPermission(id) {
    const permission = allPermissions.find(p => p.id === id);
    if (!permission) return;

    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const editModalBtn = document.getElementById('edit-modal-btn');

    if (modalTitle) modalTitle.textContent = `Permission: ${permission.name}`;

    if (modalBody) {
        modalBody.innerHTML = `
            <div class="permission-detail">
                <h4>Name</h4>
                <p>${escapeHtml(permission.name)}</p>

                <h4>Description</h4>
                <p>${escapeHtml(permission.description || 'No description provided')}</p>

                <h4>Category</h4>
                <p>${getPermissionCategory(permission.name)}</p>

                <h4>Usage</h4>
                <p>Used by ${permission.rolesCount || 0} roles</p>
            </div>
        `;
    }

    if (editModalBtn) {
        editModalBtn.onclick = () => {
            closeModal();
            editPermission(id);
        };
    }

    const modal = document.getElementById('permission-modal');
    if (modal) modal.style.display = 'block';
}

function closeModal() {
    const modal = document.getElementById('permission-modal');
    if (modal) modal.style.display = 'none';
}

function showConfirmDialog(message, onConfirm) {
    const confirmMessage = document.getElementById('confirm-message');
    const confirmActionBtn = document.getElementById('confirm-action-btn');
    const modal = document.getElementById('confirm-modal');

    if (confirmMessage) confirmMessage.textContent = message;

    if (confirmActionBtn) {
        confirmActionBtn.onclick = () => {
            closeConfirmModal();
            onConfirm();
        };
    }

    if (modal) modal.style.display = 'block';
}

function closeConfirmModal() {
    const modal = document.getElementById('confirm-modal');
    if (modal) modal.style.display = 'none';
}

// Utility functions
function showLoading(show) {
    const loading = document.getElementById('loading-permissions');
    if (loading) {
        loading.style.display = show ? 'block' : 'none';
    }
}

function showMessage(message, type = 'info') {
    const container = document.getElementById('message-container');
    if (!container) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${type}`;
    messageDiv.textContent = message;

    container.appendChild(messageDiv);

    setTimeout(() => {
        messageDiv.style.opacity = '0';
        setTimeout(() => {
            if (container.contains(messageDiv)) {
                container.removeChild(messageDiv);
            }
        }, 300);
    }, 5000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// System management functions - FIXED
async function syncPermissions() {
    try {
        updateSystemStatus('syncing', 'Syncing permissions...');

        if (!permissionManager) {
            throw new Error('Permission manager not initialized');
        }

        const result = await permissionManager.syncPermissions();

        if (result.errors.length > 0) {
            showMessage(`Synced ${result.synced} permissions with ${result.errors.length} errors.`, 'warning');
        } else {
            showMessage(`Successfully synced ${result.synced} permissions!`, 'success');
        }

        await loadPermissions();
        updateSystemStatus('connected', 'Sync completed');
    } catch (error) {
        console.error('Sync failed:', error);
        showMessage('Failed to sync permissions: ' + error.message, 'error');
        updateSystemStatus('error', 'Sync failed');
    }
}

async function validatePermissions() {
    try {
        updateSystemStatus('validating', 'Validating system...');

        if (!permissionManager) {
            throw new Error('Permission manager not initialized');
        }

        const result = await permissionManager.validatePermissions();

        if (result.valid) {
            showMessage('Permission system validation passed!', 'success');
            updateSystemStatus('connected', 'System validated');
        } else {
            const message = `Validation issues found: ${result.missingInApi.length} missing, ${result.extraInApi.length} extra permissions`;
            showMessage(message, 'warning');
            updateSystemStatus('warning', 'Validation issues found');

            console.log('Missing permissions:', result.missingInApi);
            console.log('Extra permissions:', result.extraInApi);
        }
    } catch (error) {
        console.error('Validation failed:', error);
        showMessage('Failed to validate permission system: ' + error.message, 'error');
        updateSystemStatus('error', 'Validation failed');
    }
}

async function initializeDefaultPermissions() {
    try {
        if (!permissionManager) {
            throw new Error('Permission manager not initialized');
        }

        const results = await permissionManager.createMissingPermissions(permissionManager.defaultPermissions);
        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;

        if (failed > 0) {
            showMessage(`Initialized ${successful} permissions, ${failed} failed/already existed`, 'warning');
        } else {
            showMessage(`Successfully initialized ${successful} default permissions!`, 'success');
        }

        await loadPermissions();

    } catch (error) {
        console.error('Failed to initialize default permissions:', error);
        showMessage('Failed to initialize default permissions: ' + error.message, 'error');
    }
}

function exportPermissions() {
    try {
        const data = JSON.stringify(allPermissions, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `permissions-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        URL.revokeObjectURL(url);
        showMessage('Permissions exported successfully!', 'success');
    } catch (error) {
        console.error('Export failed:', error);
        showMessage('Failed to export permissions.', 'error');
    }
}

function importPermissions() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = async function(e) {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const text = await file.text();
            const permissions = JSON.parse(text);

            if (!Array.isArray(permissions)) {
                throw new Error('Invalid file format - expected array of permissions');
            }

            if (!permissionManager) {
                throw new Error('Permission manager not initialized');
            }

            const results = await permissionManager.createMissingPermissions(permissions);
            const successful = results.filter(r => r.success).length;
            const failed = results.filter(r => !r.success).length;

            if (failed > 0) {
                showMessage(`Imported ${successful} permissions, ${failed} failed/already existed`, 'warning');
            } else {
                showMessage(`Successfully imported ${successful} permissions!`, 'success');
            }

            await loadPermissions();

        } catch (error) {
            console.error('Import failed:', error);
            showMessage('Failed to import permissions: ' + error.message, 'error');
        }
    };

    input.click();
}