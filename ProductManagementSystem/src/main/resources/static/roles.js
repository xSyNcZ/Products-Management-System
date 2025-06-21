// Roles Management JavaScript - API Connected Version

class RoleManager {
    constructor() {
        this.roles = [];
        this.permissions = [];
        this.apiBaseUrl = '/api';
    }

    // Initialize the role manager
    async init() {
        try {
            await this.loadPermissions();
            await this.loadRoles();
            this.setupEventListeners();
            this.renderPermissionsGrid();
        } catch (error) {
            console.error('Error initializing RoleManager:', error);
            this.showErrorMessage('Failed to initialize role manager: ' + error.message);
        }
    }

    // Load all permissions from API
    async loadPermissions() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/permissions`);
            if (response.ok) {
                this.permissions = await response.json();
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            console.error('Error loading permissions:', error);
            // Fallback permissions for demo purposes
            this.permissions = [
                { id: 1, name: 'USER_CREATE', description: 'Create new users' },
                { id: 2, name: 'USER_READ', description: 'View user information' },
                { id: 3, name: 'USER_UPDATE', description: 'Update user information' },
                { id: 4, name: 'USER_DELETE', description: 'Delete users' },
                { id: 5, name: 'PRODUCT_CREATE', description: 'Create new products' },
                { id: 6, name: 'PRODUCT_READ', description: 'View product information' },
                { id: 7, name: 'PRODUCT_UPDATE', description: 'Update product information' },
                { id: 8, name: 'PRODUCT_DELETE', description: 'Delete products' },
                { id: 9, name: 'ORDER_CREATE', description: 'Create new orders' },
                { id: 10, name: 'ORDER_READ', description: 'View order information' },
                { id: 11, name: 'ORDER_UPDATE', description: 'Update order status' },
                { id: 12, name: 'ORDER_DELETE', description: 'Cancel/delete orders' },
                { id: 13, name: 'INVENTORY_MANAGE', description: 'Manage inventory and stock' },
                { id: 14, name: 'REPORTS_VIEW', description: 'View system reports' },
                { id: 15, name: 'ADMIN_ACCESS', description: 'Full administrative access' }
            ];
        }
    }

    // Load all roles from API
    async loadRoles() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/roles`);
            if (response.ok) {
                const roleDTOs = await response.json();
                // Convert DTOs to frontend format
                this.roles = roleDTOs.map(dto => this.convertDTOToRole(dto));
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            this.renderRolesList();
        } catch (error) {
            console.error('Error loading roles:', error);
            this.showErrorMessage('Failed to load roles: ' + error.message);
            // Use fallback data for demo
            this.roles = [
                {
                    id: 1,
                    name: 'ADMIN',
                    permissions: this.permissions.filter(p => [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].includes(p.id))
                },
                {
                    id: 2,
                    name: 'MANAGER',
                    permissions: this.permissions.filter(p => [2, 3, 5, 6, 7, 9, 10, 11, 13, 14].includes(p.id))
                },
                {
                    id: 3,
                    name: 'EMPLOYEE',
                    permissions: this.permissions.filter(p => [2, 6, 9, 10].includes(p.id))
                },
                {
                    id: 4,
                    name: 'CUSTOMER',
                    permissions: this.permissions.filter(p => [6, 9].includes(p.id))
                }
            ];
            this.renderRolesList();
        }
    }

    // Convert RoleDTO from backend to frontend role object
    convertDTOToRole(dto) {
        return {
            id: dto.id,
            name: dto.name,
            permissions: dto.permissionIds ?
                dto.permissionIds.map(permId =>
                    this.permissions.find(p => p.id === permId)
                ).filter(Boolean) : []
        };
    }

    // Convert frontend role to RoleDTO for backend
    convertRoleToDTO(role, selectedPermissionIds = null) {
        return {
            id: role.id,
            name: role.name,
            permissionIds: selectedPermissionIds ||
                (role.permissions ? role.permissions.map(p => p.id) : [])
        };
    }

    // Create a new role
    async createRole(roleData) {
        try {
            const roleDTO = {
                name: roleData.name,
                permissionIds: roleData.permissions.map(p => p.id)
            };

            const response = await fetch(`${this.apiBaseUrl}/roles`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(roleDTO)
            });

            if (response.ok) {
                const createdRoleDTO = await response.json();
                const newRole = this.convertDTOToRole(createdRoleDTO);
                this.roles.push(newRole);
                this.renderRolesList();
                return newRole;
            } else {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
        } catch (error) {
            console.error('Error creating role:', error);
            throw error;
        }
    }

    // Update an existing role
    async updateRole(roleId, roleData) {
        try {
            // First update the role name
            const roleDTO = {
                name: roleData.name,
                permissionIds: roleData.permissions.map(p => p.id)
            };

            const response = await fetch(`${this.apiBaseUrl}/roles/${roleId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(roleDTO)
            });

            if (response.ok) {
                const updatedRoleDTO = await response.json();

                // Update permissions separately if needed
                await this.updateRolePermissions(roleId, roleData.permissions.map(p => p.id));

                // Reload the specific role to get updated permissions
                await this.reloadRole(roleId);

                return true;
            } else {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
        } catch (error) {
            console.error('Error updating role:', error);
            throw error;
        }
    }

    // Update role permissions specifically
    async updateRolePermissions(roleId, newPermissionIds) {
        try {
            const currentRole = this.getRoleById(roleId);
            const currentPermissionIds = currentRole.permissions.map(p => p.id);

            // Find permissions to add and remove
            const permissionsToAdd = newPermissionIds.filter(id => !currentPermissionIds.includes(id));
            const permissionsToRemove = currentPermissionIds.filter(id => !newPermissionIds.includes(id));

            // Add new permissions
            if (permissionsToAdd.length > 0) {
                await fetch(`${this.apiBaseUrl}/roles/${roleId}/permissions/add`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(permissionsToAdd)
                });
            }

            // Remove old permissions
            if (permissionsToRemove.length > 0) {
                await fetch(`${this.apiBaseUrl}/roles/${roleId}/permissions/remove`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(permissionsToRemove)
                });
            }
        } catch (error) {
            console.error('Error updating role permissions:', error);
            throw error;
        }
    }

    // Reload a specific role from the API
    async reloadRole(roleId) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/roles/${roleId}`);
            if (response.ok) {
                const roleDTO = await response.json();
                const updatedRole = this.convertDTOToRole(roleDTO);

                const index = this.roles.findIndex(r => r.id === roleId);
                if (index !== -1) {
                    this.roles[index] = updatedRole;
                    this.renderRolesList();
                }
                return updatedRole;
            }
        } catch (error) {
            console.error('Error reloading role:', error);
        }
    }

    // Delete a role
    async deleteRole(roleId) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/roles/${roleId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.roles = this.roles.filter(r => r.id !== roleId);
                this.renderRolesList();
                return true;
            } else {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
        } catch (error) {
            console.error('Error deleting role:', error);
            throw error;
        }
    }

    // Get role by ID
    getRoleById(roleId) {
        return this.roles.find(r => r.id === roleId);
    }

    // Search roles
    searchRoles(query) {
        const lowerQuery = query.toLowerCase();
        return this.roles.filter(role =>
            role.name.toLowerCase().includes(lowerQuery) ||
            (role.permissions && role.permissions.some(p =>
                p.name.toLowerCase().includes(lowerQuery) ||
                (p.description && p.description.toLowerCase().includes(lowerQuery))
            ))
        );
    }

    // Render permissions grid for role form
    renderPermissionsGrid() {
        const container = document.getElementById('permissions-grid');
        if (!container) return;

        container.innerHTML = '';

        this.permissions.forEach(permission => {
            const permissionElement = document.createElement('div');
            permissionElement.className = 'permission-item';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `permission-${permission.id}`;
            checkbox.value = permission.id;
            checkbox.name = 'permissions';

            const label = document.createElement('label');
            label.htmlFor = `permission-${permission.id}`;
            label.textContent = permission.name;
            label.title = permission.description || permission.name;

            permissionElement.appendChild(checkbox);
            permissionElement.appendChild(label);
            container.appendChild(permissionElement);
        });
    }

    // Render roles list
    renderRolesList() {
        const container = document.getElementById('roles-container');
        if (!container) return;

        container.innerHTML = '';

        if (this.roles.length === 0) {
            container.innerHTML = '<div class="empty-state">No roles found. Create your first role above.</div>';
            return;
        }

        this.roles.forEach(role => {
            const roleElement = this.createRoleElement(role);
            container.appendChild(roleElement);
        });
    }

    // Create a role element for display
    createRoleElement(role) {
        const div = document.createElement('div');
        div.className = 'role-item';

        const permissionsList = role.permissions && role.permissions.length > 0
            ? role.permissions.map(p => `<span class="permission-tag" title="${p.description || p.name}">${p.name}</span>`).join('')
            : '<span class="permission-tag" style="background: #6c757d;">No permissions</span>';

        div.innerHTML = `
            <div class="role-header">
                <div>
                    <div class="role-name">${role.name}</div>
                    <div class="role-permissions">
                        Permissions (${role.permissions ? role.permissions.length : 0}):
                        <div class="role-permissions-list">${permissionsList}</div>
                    </div>
                </div>
            </div>
            <div class="role-actions">
                <button onclick="roleManager.editRole(${role.id})" class="btn btn-edit">Edit</button>
                <button onclick="roleManager.confirmDeleteRole(${role.id})" class="btn btn-delete">Delete</button>
            </div>
        `;
        return div;
    }

    // Setup event listeners
    setupEventListeners() {
        // Role form submission
        const roleForm = document.getElementById('role-form');
        if (roleForm) {
            roleForm.addEventListener('submit', this.handleRoleSubmit.bind(this));
        }

        // Search functionality
        const searchInput = document.getElementById('role-search');
        if (searchInput) {
            searchInput.addEventListener('input', this.handleSearch.bind(this));
        }
    }

    // Handle role form submission
    async handleRoleSubmit(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);

        const selectedPermissions = Array.from(form.querySelectorAll('input[name="permissions"]:checked'))
            .map(checkbox => {
                const permissionId = parseInt(checkbox.value);
                return this.permissions.find(p => p.id === permissionId);
            })
            .filter(Boolean);

        const roleData = {
            name: formData.get('name'),
            permissions: selectedPermissions
        };

        const roleId = formData.get('roleId');

        try {
            // Show loading state
            const submitButton = form.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            submitButton.textContent = 'Saving...';
            submitButton.disabled = true;

            if (roleId) {
                await this.updateRole(parseInt(roleId), roleData);
                this.showSuccessMessage('Role updated successfully!');
            } else {
                await this.createRole(roleData);
                this.showSuccessMessage('Role created successfully!');
            }

            form.reset();
            this.clearForm();

        } catch (error) {
            this.showErrorMessage('Error saving role: ' + error.message);
        } finally {
            // Restore button state
            const submitButton = form.querySelector('button[type="submit"]');
            submitButton.textContent = submitButton.textContent === 'Saving...' ? 'Save Role' : submitButton.textContent;
            submitButton.disabled = false;
        }
    }

    // Handle search input
    handleSearch(event) {
        const query = event.target.value;
        const filteredRoles = this.searchRoles(query);
        this.renderFilteredRoles(filteredRoles);
    }

    // Render filtered roles
    renderFilteredRoles(roles) {
        const container = document.getElementById('roles-container');
        if (!container) return;

        container.innerHTML = '';

        if (roles.length === 0) {
            container.innerHTML = '<div class="empty-state">No roles match your search.</div>';
            return;
        }

        roles.forEach(role => {
            const roleElement = this.createRoleElement(role);
            container.appendChild(roleElement);
        });
    }

    // Edit role
    editRole(roleId) {
        const role = this.getRoleById(roleId);
        if (!role) return;

        const form = document.getElementById('role-form');
        if (!form) return;

        // Fill form fields
        form.elements.roleId.value = role.id;
        form.elements.name.value = role.name;

        // Clear all checkboxes first
        const checkboxes = form.querySelectorAll('input[name="permissions"]');
        checkboxes.forEach(checkbox => checkbox.checked = false);

        // Check the permissions assigned to this role
        if (role.permissions) {
            role.permissions.forEach(permission => {
                const checkbox = form.querySelector(`input[value="${permission.id}"]`);
                if (checkbox) {
                    checkbox.checked = true;
                }
            });
        }

        // Update submit button text
        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.textContent = 'Update Role';
        }

        // Scroll to form
        form.scrollIntoView({ behavior: 'smooth' });
    }

    // Confirm delete role
    async confirmDeleteRole(roleId) {
        const role = this.getRoleById(roleId);
        if (!role) return;

        if (confirm(`Are you sure you want to delete the role "${role.name}"? This action cannot be undone.`)) {
            try {
                await this.deleteRole(roleId);
                this.showSuccessMessage('Role deleted successfully!');
            } catch (error) {
                this.showErrorMessage('Error deleting role: ' + error.message);
            }
        }
    }

    // Clear form
    clearForm() {
        const form = document.getElementById('role-form');
        if (form) {
            form.elements.roleId.value = '';
            const checkboxes = form.querySelectorAll('input[name="permissions"]');
            checkboxes.forEach(checkbox => checkbox.checked = false);

            // Reset submit button text
            const submitButton = form.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.textContent = 'Save Role';
            }
        }
    }

    // Show success message (you can replace with a proper toast/notification system)
    showSuccessMessage(message) {
        // Simple implementation - replace with your preferred notification system
        const notification = document.createElement('div');
        notification.className = 'notification success';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            z-index: 1000;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Show error message (you can replace with a proper toast/notification system)
    showErrorMessage(message) {
        // Simple implementation - replace with your preferred notification system
        const notification = document.createElement('div');
        notification.className = 'notification error';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #dc3545;
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            z-index: 1000;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
}

// Global function to clear role form (called from HTML)
function clearRoleForm() {
    if (window.roleManager) {
        window.roleManager.clearForm();
        const form = document.getElementById('role-form');
        if (form) {
            form.reset();
        }
    }
}

// Initialize the role manager when the DOM is loaded
let roleManager;
document.addEventListener('DOMContentLoaded', () => {
    roleManager = new RoleManager();
    window.roleManager = roleManager; // Make it globally accessible
    roleManager.init();
});