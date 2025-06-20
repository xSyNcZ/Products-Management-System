// User Management JavaScript
class UserManager {
    constructor() {
        this.currentUser = null;
        this.editingUserId = null;
        this.addressUserId = null;
        this.users = [];
        this.roles = [];
        this.API_BASE_URL = 'http://localhost:8080/api';
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadUsers();
        this.loadRoles();
        this.checkUserRole();
    }

    bindEvents() {
        // Form submissions
        const userForm = document.getElementById('userForm');
        if (userForm) {
            userForm.addEventListener('submit', (e) => this.handleUserFormSubmission(e));
        }

        const addressForm = document.getElementById('addressForm');
        if (addressForm) {
            addressForm.addEventListener('submit', (e) => this.handleAddressFormSubmission(e));
        }

        // Search functionality
        const searchInput = document.getElementById('userSearch');
        if (searchInput) {
            searchInput.addEventListener('keyup', () => this.filterUsers());
        }

        // Close modals when clicking outside
        window.addEventListener('click', (event) => {
            const userModal = document.getElementById('userModal');
            const addressModal = document.getElementById('addressModal');

            if (event.target === userModal) {
                this.closeUserModal();
            }
            if (event.target === addressModal) {
                this.closeAddressModal();
            }
        });

        // Modal close buttons
        const userModalClose = document.querySelector('#userModal .close');
        if (userModalClose) {
            userModalClose.addEventListener('click', () => this.closeUserModal());
        }

        const addressModalClose = document.querySelector('#addressModal .close');
        if (addressModalClose) {
            addressModalClose.addEventListener('click', () => this.closeAddressModal());
        }
    }

    // Check user role and show/hide elements accordingly
    checkUserRole() {
        try {
            const userRole = localStorage.getItem('userRole') || 'USER';
            const currentUserName = localStorage.getItem('username') || 'Guest';

            const currentUserElement = document.getElementById('currentUser');
            if (currentUserElement) {
                currentUserElement.textContent = currentUserName;
            }

            if (userRole !== 'ADMIN') {
                // Hide admin-only buttons
                const adminButtons = document.querySelectorAll('.admin-only');
                adminButtons.forEach(btn => {
                    if (btn) btn.style.display = 'none';
                });

                // Show warning message
                this.showNotification('You have limited access to user management features.', 'warning');
            }
        } catch (error) {
            console.error('Error checking user role:', error);
        }
    }

    // Load all users
    async loadUsers() {
        try {
            this.showLoading(true);
            const response = await fetch(`${this.API_BASE_URL}/users`, {
                headers: this.getAuthHeaders()
            });

            if (response.status === 401) {
                this.handleUnauthorized();
                return;
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const users = await response.json();
            this.users = Array.isArray(users) ? users : [];
            this.displayUsers(this.users);
        } catch (error) {
            console.error('Error loading users:', error);
            this.showNotification('Error loading users: ' + error.message, 'error');
            this.users = [];
            this.displayUsers([]);
        } finally {
            this.showLoading(false);
        }
    }

    // Display users in table
    displayUsers(users) {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) {
            console.error('Users table body not found');
            return;
        }

        tbody.innerHTML = '';

        if (!users || users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="no-results">No users found</td></tr>';
            return;
        }

        users.forEach(user => {
            if (!user) return;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.id || 'N/A'}</td>
                <td>${this.escapeHtml(user.username || '')}</td>
                <td>${this.escapeHtml(user.email || '')}</td>
                <td>${this.escapeHtml(user.firstName || '')}</td>
                <td>${this.escapeHtml(user.lastName || '')}</td>
                <td>${this.formatRoles(user.roles)}</td>
                <td class="actions">
                    <button onclick="userManager.editUser(${user.id})" class="btn btn-sm btn-primary">Edit</button>
                    <button onclick="userManager.manageAddress(${user.id})" class="btn btn-sm btn-secondary">Address</button>
                    <button onclick="userManager.viewUserOrders(${user.id})" class="btn btn-sm btn-info">Orders</button>
                    <button onclick="userManager.deleteUser(${user.id})" class="btn btn-sm btn-danger admin-only">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });

        // Hide admin-only buttons if not admin
        this.checkUserRole();
    }

    formatRoles(roles) {
        if (!roles || !Array.isArray(roles)) return '';
        return roles.map(role => this.escapeHtml(role.name || '')).join(', ');
    }

    // Load roles for dropdown
    async loadRoles() {
        try {
            const response = await fetch(`${this.API_BASE_URL}/roles`, {
                headers: this.getAuthHeaders()
            });

            if (response.status === 401) {
                this.handleUnauthorized();
                return;
            }

            if (!response.ok) {
                console.warn('Failed to load roles, using empty list');
                this.roles = [];
                return;
            }

            const roles = await response.json();
            this.roles = Array.isArray(roles) ? roles : [];
            this.populateRolesDropdown();
        } catch (error) {
            console.error('Error loading roles:', error);
            this.roles = [];
            this.populateRolesDropdown();
        }
    }

    populateRolesDropdown() {
        const rolesSelect = document.getElementById('roles');
        if (!rolesSelect) return;

        rolesSelect.innerHTML = '';

        this.roles.forEach(role => {
            if (!role) return;
            const option = document.createElement('option');
            option.value = role.id || '';
            option.textContent = role.name || 'Unknown Role';
            rolesSelect.appendChild(option);
        });
    }

    // Show create user modal
    showCreateUserModal() {
        const modalTitle = document.getElementById('modalTitle');
        const userForm = document.getElementById('userForm');
        const userModal = document.getElementById('userModal');
        const passwordField = document.getElementById('password');

        if (!modalTitle || !userForm || !userModal) {
            console.error('Modal elements not found');
            return;
        }

        modalTitle.textContent = 'Create User';
        userForm.reset();
        this.editingUserId = null;

        // Make password required for new users
        if (passwordField) {
            passwordField.required = true;
        }

        userModal.style.display = 'block';
    }

    // Edit user
    async editUser(userId) {
        if (!userId) {
            this.showNotification('Invalid user ID', 'error');
            return;
        }

        try {
            const response = await fetch(`${this.API_BASE_URL}/users/${userId}`, {
                headers: this.getAuthHeaders()
            });

            if (response.status === 401) {
                this.handleUnauthorized();
                return;
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const user = await response.json();

            const modalTitle = document.getElementById('modalTitle');
            const usernameField = document.getElementById('username');
            const emailField = document.getElementById('email');
            const firstNameField = document.getElementById('firstName');
            const lastNameField = document.getElementById('lastName');
            const passwordField = document.getElementById('password');
            const rolesSelect = document.getElementById('roles');
            const userModal = document.getElementById('userModal');

            if (!modalTitle || !userModal) {
                console.error('Modal elements not found');
                return;
            }

            modalTitle.textContent = 'Edit User';

            // Populate form fields
            if (usernameField) usernameField.value = user.username || '';
            if (emailField) emailField.value = user.email || '';
            if (firstNameField) firstNameField.value = user.firstName || '';
            if (lastNameField) lastNameField.value = user.lastName || '';

            // Make password optional for editing
            if (passwordField) {
                passwordField.value = '';
                passwordField.required = false;
                passwordField.placeholder = 'Leave empty to keep current password';
            }

            // Set selected roles
            if (rolesSelect && user.roles) {
                Array.from(rolesSelect.options).forEach(option => {
                    option.selected = user.roles.some(role => role.id == option.value);
                });
            }

            this.editingUserId = userId;
            userModal.style.display = 'block';
        } catch (error) {
            console.error('Error loading user details:', error);
            this.showNotification('Error loading user details: ' + error.message, 'error');
        }
    }

    // Close user modal
    closeUserModal() {
        const userModal = document.getElementById('userModal');
        if (userModal) {
            userModal.style.display = 'none';
        }
        this.editingUserId = null;
    }

    // Handle user form submission
    async handleUserFormSubmission(e) {
        e.preventDefault();

        const form = e.target;
        const formData = new FormData(form);

        // Validation
        const username = formData.get('username')?.toString().trim();
        const email = formData.get('email')?.toString().trim();
        const password = formData.get('password')?.toString();

        if (!username) {
            this.showNotification('Username is required', 'error');
            return;
        }

        if (!email) {
            this.showNotification('Email is required', 'error');
            return;
        }

        if (!this.editingUserId && !password) {
            this.showNotification('Password is required for new users', 'error');
            return;
        }

        if (!this.isValidEmail(email)) {
            this.showNotification('Please enter a valid email address', 'error');
            return;
        }

        const rolesSelect = document.getElementById('roles');
        const selectedRoles = rolesSelect ?
            Array.from(rolesSelect.selectedOptions).map(option => ({ id: parseInt(option.value) })) :
            [];

        const userData = {
            username,
            email,
            firstName: formData.get('firstName')?.toString().trim() || null,
            lastName: formData.get('lastName')?.toString().trim() || null,
            roles: selectedRoles
        };

        // Only include password if it's provided
        if (password) {
            userData.password = password;
        }

        try {
            let response;
            if (this.editingUserId) {
                // Update user
                response = await fetch(`${this.API_BASE_URL}/users/${this.editingUserId}`, {
                    method: 'PUT',
                    headers: {
                        ...this.getAuthHeaders(),
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(userData)
                });
            } else {
                // Create user
                response = await fetch(`${this.API_BASE_URL}/users`, {
                    method: 'POST',
                    headers: {
                        ...this.getAuthHeaders(),
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(userData)
                });
            }

            if (response.status === 401) {
                this.handleUnauthorized();
                return;
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            this.showNotification(`User ${this.editingUserId ? 'updated' : 'created'} successfully!`, 'success');
            this.closeUserModal();
            await this.loadUsers();
        } catch (error) {
            console.error('Error saving user:', error);
            this.showNotification('Error saving user: ' + error.message, 'error');
        }
    }

    // Delete user
    async deleteUser(userId) {
        if (!userId) {
            this.showNotification('Invalid user ID', 'error');
            return;
        }

        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`${this.API_BASE_URL}/users/${userId}`, {
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

            this.showNotification('User deleted successfully!', 'success');
            await this.loadUsers();
        } catch (error) {
            console.error('Error deleting user:', error);
            this.showNotification('Error deleting user: ' + error.message, 'error');
        }
    }

    // Manage user address
    async manageAddress(userId) {
        if (!userId) {
            this.showNotification('Invalid user ID', 'error');
            return;
        }

        try {
            const response = await fetch(`${this.API_BASE_URL}/users/${userId}/address`, {
                headers: this.getAuthHeaders()
            });

            let address = {};
            if (response.status === 401) {
                this.handleUnauthorized();
                return;
            }

            if (response.ok) {
                address = await response.json() || {};
            }

            // Populate address form
            const streetAddressField = document.getElementById('streetAddress');
            const cityField = document.getElementById('city');
            const stateField = document.getElementById('state');
            const postalCodeField = document.getElementById('postalCode');
            const countryField = document.getElementById('country');
            const addressModal = document.getElementById('addressModal');

            if (streetAddressField) streetAddressField.value = address.streetAddress || '';
            if (cityField) cityField.value = address.city || '';
            if (stateField) stateField.value = address.state || '';
            if (postalCodeField) postalCodeField.value = address.postalCode || '';
            if (countryField) countryField.value = address.country || '';

            this.addressUserId = userId;
            if (addressModal) {
                addressModal.style.display = 'block';
            }
        } catch (error) {
            console.error('Error loading address:', error);
            this.showNotification('Error loading address: ' + error.message, 'error');
        }
    }

    // Close address modal
    closeAddressModal() {
        const addressModal = document.getElementById('addressModal');
        if (addressModal) {
            addressModal.style.display = 'none';
        }
        this.addressUserId = null;
    }

    // Handle address form submission
    async handleAddressFormSubmission(e) {
        e.preventDefault();

        if (!this.addressUserId) {
            this.showNotification('No user selected for address management', 'error');
            return;
        }

        const formData = new FormData(e.target);
        const addressData = {
            streetAddress: formData.get('streetAddress')?.toString().trim() || null,
            city: formData.get('city')?.toString().trim() || null,
            state: formData.get('state')?.toString().trim() || null,
            postalCode: formData.get('postalCode')?.toString().trim() || null,
            country: formData.get('country')?.toString().trim() || null
        };

        try {
            const response = await fetch(`${this.API_BASE_URL}/users/${this.addressUserId}/address`, {
                method: 'PUT',
                headers: {
                    ...this.getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(addressData)
            });

            if (response.status === 401) {
                this.handleUnauthorized();
                return;
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            this.showNotification('Address saved successfully!', 'success');
            this.closeAddressModal();
        } catch (error) {
            console.error('Error saving address:', error);
            this.showNotification('Error saving address: ' + error.message, 'error');
        }
    }

    // View user orders
    viewUserOrders(userId) {
        if (!userId) {
            this.showNotification('Invalid user ID', 'error');
            return;
        }
        window.location.href = `orders.html?userId=${userId}`;
    }

    // Filter users
    filterUsers() {
        const searchInput = document.getElementById('userSearch');
        if (!searchInput) return;

        const searchTerm = searchInput.value.toLowerCase().trim();

        if (!searchTerm) {
            this.displayUsers(this.users);
            return;
        }

        const filteredUsers = this.users.filter(user => {
            if (!user) return false;

            const searchFields = [
                user.username,
                user.email,
                user.firstName,
                user.lastName,
                user.id?.toString(),
                this.formatRoles(user.roles)
            ];

            return searchFields.some(field =>
                field && field.toLowerCase().includes(searchTerm)
            );
        });

        this.displayUsers(filteredUsers);
    }

    // Refresh users
    refreshUsers() {
        this.loadUsers();
    }

    // Utility functions
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    getAuthHeaders() {
        const token = localStorage.getItem('token');
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    }

    handleUnauthorized() {
        console.warn('Unauthorized access - redirecting to login');
        this.logout();
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 4px;
            color: white;
            z-index: 10000;
            max-width: 300px;
            word-wrap: break-word;
        `;

        // Set background color based on type
        switch (type) {
            case 'error':
                notification.style.backgroundColor = '#dc3545';
                break;
            case 'success':
                notification.style.backgroundColor = '#28a745';
                break;
            case 'warning':
                notification.style.backgroundColor = '#ffc107';
                notification.style.color = '#212529';
                break;
            default:
                notification.style.backgroundColor = '#17a2b8';
        }

        // Add to page
        document.body.appendChild(notification);

        // Remove after 5 seconds
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 5000);
    }

    showLoading(show) {
        if (show) {
            document.body.style.cursor = 'wait';
        } else {
            document.body.style.cursor = 'default';
        }
    }

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('userRole');
        window.location.href = 'login.html';
    }
}

// Global functions for backward compatibility
let userManager;

function showCreateUserModal() {
    if (userManager) userManager.showCreateUserModal();
}

function editUser(userId) {
    if (userManager) userManager.editUser(userId);
}

function deleteUser(userId) {
    if (userManager) userManager.deleteUser(userId);
}

function manageAddress(userId) {
    if (userManager) userManager.manageAddress(userId);
}

function viewUserOrders(userId) {
    if (userManager) userManager.viewUserOrders(userId);
}

function closeUserModal() {
    if (userManager) userManager.closeUserModal();
}

function closeAddressModal() {
    if (userManager) userManager.closeAddressModal();
}

function filterUsers() {
    if (userManager) userManager.filterUsers();
}

function refreshUsers() {
    if (userManager) userManager.refreshUsers();
}

function logout() {
    if (userManager) userManager.logout();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    userManager = new UserManager();
});