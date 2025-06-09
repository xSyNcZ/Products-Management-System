// Roles Management JavaScript

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
        }
    }

    // Load all permissions
    async loadPermissions() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/permissions`);
            if (response.ok) {
                this.permissions = await response.json();
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

    // Load all roles
    async loadRoles() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/roles`);
            if (response.ok) {
                this.roles = await response.json();
            } else {
                // Fallback roles for demo purposes
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
            }
            this.renderRolesList();
        } catch (error) {
            console.error('Error loading roles:', error);
        }
    }

    // Create a new role
    async createRole(roleData) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/roles`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(roleData)
            });

            if (response.ok) {
                const newRole = await response.json();
                this.roles.push(newRole);
                this.renderRolesList();
                return newRole;
            } else {
                throw new Error('Failed to create role');
            }
        } catch (error) {
            console.error('Error creating role:', error);
            // Simulate successful creation for demo
            const newRole = {
                id: Date.now(),
                name: roleData.name,
                permissions: roleData.permissions || []
            };
            this.roles.push(newRole);
            this.renderRolesList();
            return newRole;
        }
    }

    // Update an existing role
    async updateRole(roleId, roleData) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/roles/${roleId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(roleData)
            });

            if (response.ok) {
                const updatedRole = await response.json();
                const index = this.roles.findIndex(r => r.id === roleId);
                if (index !== -1) {
                    this.roles[index] = updatedRole;
                    this.renderRolesList();
                }
                return updatedRole;
            } else {
                throw new Error('Failed to update role');
            }
        } catch (error) {
            console.error('Error updating role:', error);
            // Simulate successful update for demo
            const index = this.roles.findIndex(r => r.id === roleId);
            if (index !== -1) {
                this.roles[index] = { ...this.roles[index], ...roleData };
                this.renderRolesList();
            }
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
                throw new Error('Failed to delete role');
            }
        } catch (error) {
            console.error('Error deleting role:', error);
            // Simulate successful deletion for demo
            this.roles = this.roles.filter(r => r.id !== roleId);
            this.renderRolesList();
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
                p.name.toLowerCase().includes(lowerQuery)
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
            ? role.permissions.map(p => `<span class="permission-tag">${p.name}</span>`).join('')
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
            if (roleId) {
                await this.updateRole(parseInt(roleId), roleData);
            } else {
                await this.createRole(roleData);
            }
            form.reset();
            this.clearForm();
            this.showSuccessMessage(roleId ? 'Role updated successfully!' : 'Role created successfully!');
        } catch (error) {
            this.showErrorMessage('Error saving role: ' + error.message);
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

        // Scroll to form
        form.scrollIntoView({ behavior: 'smooth' });
    }

    // Confirm delete role
    confirmDeleteRole(roleId) {
        const role = this.getRoleById(roleId);
        if (!role) return;

        if (confirm(`Are you sure you want to delete the role "${role.name}"? This action cannot be undone.`)) {
            this.deleteRole(roleId);
        }
    }

    // Clear form
    clearForm() {
        const form = document.getElementById('role-form');
        if (form) {
            form.elements.roleId.value = '';
            const checkboxes = form.querySelectorAll('input[name="permissions"]');
            checkboxes.forEach(checkbox => checkbox.checked = false);
        }
    }

    // Show success message
    showSuccessMessage(message) {
        // You can implement a toast notification or alert here
        alert(message);
    }

    // Show error message
    showErrorMessage(message) {
        // You can implement a toast notification or alert here
        alert(message);
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