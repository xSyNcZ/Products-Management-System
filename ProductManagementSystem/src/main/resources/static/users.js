// User Management JavaScript - Fixed Version
class UserManager {
    constructor() {
        this.currentUser = null;
        this.editingUserId = null;
        this.addressUserId = null;
        this.users = [];
        this.roles = [];
        this.currentFilter = 'all';
        this.API_BASE_URL = 'http://localhost:8080/api';
        this.init();
    }

    init() {
        console.log('Initializing UserManager...');
        this.bindEvents();
        this.loadUsers();
        this.loadRoles();
        this.checkUserRole();
    }

    bindEvents() {
        console.log('Binding events...');

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
            // Check if we're in a browser environment that supports localStorage
            if (typeof(Storage) === "undefined") {
                console.warn('LocalStorage not supported');
                return;
            }

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

    // Load all users - matches GET /api/users
    async loadUsers() {
        try {
            this.showLoading(true);
            console.log('Loading users from:', `${this.API_BASE_URL}/users`);

            const response = await fetch(`${this.API_BASE_URL}/users`, {
                method: 'GET',
                headers: this.getAuthHeaders()
            });

            console.log('Response status:', response.status);

            if (response.status === 401) {
                console.error('Unauthorized access');
                this.handleUnauthorized();
                return;
            }

            if (response.status === 403) {
                console.error('Forbidden access');
                this.showNotification('You do not have permission to view users', 'error');
                return;
            }

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error response:', errorText);
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                console.error('Invalid content type:', contentType);
                throw new Error('Server returned non-JSON response');
            }

            const users = await response.json();
            console.log('Loaded users:', users);

            this.users = Array.isArray(users) ? users : [];
            this.displayUsers(this.users);

            if (this.users.length === 0) {
                console.warn('No users returned from API');
                this.showNotification('No users found', 'info');
            } else {
                console.log(`Successfully loaded ${this.users.length} users`);
            }

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
            console.error('Users table body not found - make sure you have a table with id="usersTableBody"');
            this.showNotification('Table element not found on page', 'error');
            return;
        }

        tbody.innerHTML = '';

        if (!users || users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="no-results" style="text-align: center; padding: 20px;">No users found</td></tr>';
            return;
        }

        users.forEach(user => {
            if (!user) return;

            const row = document.createElement('tr');
            // Updated to handle single role from UserDTO
            const roleDisplay = user.roleName ? this.escapeHtml(user.roleName) : 'No Role';
            const statusBadge = user.active ?
                '<span class="badge badge-success">Active</span>' :
                '<span class="badge badge-danger">Inactive</span>';

            row.innerHTML = `
                <td>${user.id || 'N/A'}</td>
                <td>${this.escapeHtml(user.username || '')}</td>
                <td>${this.escapeHtml(user.email || '')}</td>
                <td>${this.escapeHtml(user.firstName || '')}</td>
                <td>${this.escapeHtml(user.lastName || '')}</td>
                <td>${roleDisplay}</td>
                <td>${statusBadge}</td>
                <td class="actions">
                    <button onclick="userManager.editUser(${user.id})" class="btn btn-sm btn-primary" style="margin: 2px;">Edit</button>
                    <button onclick="userManager.manageAddress(${user.id})" class="btn btn-sm btn-secondary" style="margin: 2px;">Address</button>
                    <button onclick="userManager.viewUserOrders(${user.id})" class="btn btn-sm btn-info" style="margin: 2px;">Orders</button>
                    ${user.active ?
                `<button onclick="userManager.deactivateUser(${user.id})" class="btn btn-sm btn-warning admin-only" style="margin: 2px;">Deactivate</button>` :
                `<button onclick="userManager.activateUser(${user.id})" class="btn btn-sm btn-success admin-only" style="margin: 2px;">Activate</button>`
            }
                    <button onclick="userManager.deleteUser(${user.id})" class="btn btn-sm btn-danger admin-only" style="margin: 2px;">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });

        // Hide admin-only buttons if not admin
        this.checkUserRole();
    }

    // Load roles for dropdown
    async loadRoles() {
        try {
            console.log('Loading roles from:', `${this.API_BASE_URL}/roles`);

            const response = await fetch(`${this.API_BASE_URL}/roles`, {
                method: 'GET',
                headers: this.getAuthHeaders()
            });

            if (response.status === 401) {
                this.handleUnauthorized();
                return;
            }

            if (!response.ok) {
                console.warn('Failed to load roles from API, using default roles');
                this.roles = [
                    { id: 1, name: 'ADMIN' },
                    { id: 2, name: 'USER' },
                    { id: 3, name: 'MANAGER' }
                ];
                this.populateRolesDropdown();
                return;
            }

            const roles = await response.json();
            console.log('Loaded roles:', roles);
            this.roles = Array.isArray(roles) ? roles : [];
            this.populateRolesDropdown();
        } catch (error) {
            console.error('Error loading roles:', error);
            this.roles = [
                { id: 1, name: 'ADMIN' },
                { id: 2, name: 'USER' },
                { id: 3, name: 'MANAGER' }
            ];
            this.populateRolesDropdown();
        }
    }

    populateRolesDropdown() {
        const rolesSelect = document.getElementById('roles');
        if (!rolesSelect) {
            console.warn('Roles select element not found');
            return;
        }

        rolesSelect.innerHTML = '';

        this.roles.forEach(role => {
            if (!role) return;
            const option = document.createElement('option');
            option.value = role.name || role.id; // Use role name for the API
            option.textContent = role.name || 'Unknown Role';
            rolesSelect.appendChild(option);
        });
    }

    // Show create user modal - FIXED
    showCreateUserModal() {
        console.log('Opening create user modal...');

        const modalTitle = document.getElementById('modalTitle');
        const userForm = document.getElementById('userForm');
        const userModal = document.getElementById('userModal');
        const passwordField = document.getElementById('password');

        if (!userModal) {
            console.error('User modal element not found - make sure you have a modal with id="userModal"');
            this.showNotification('Modal element not found on page', 'error');
            return;
        }

        if (!userForm) {
            console.error('User form not found - make sure you have a form with id="userForm"');
            this.showNotification('User form not found on page', 'error');
            return;
        }

        // Set modal title
        if (modalTitle) {
            modalTitle.textContent = 'Create User';
        }

        // Reset form
        userForm.reset();
        this.editingUserId = null;

        // Make password required for new users
        if (passwordField) {
            passwordField.required = true;
            passwordField.placeholder = 'Enter password';
            passwordField.value = '';
        } else {
            console.warn('Password field not found - make sure you have an input with id="password"');
        }

        // Set default role if available
        const rolesSelect = document.getElementById('roles');
        if (rolesSelect && rolesSelect.options.length > 0) {
            rolesSelect.selectedIndex = 0; // Select first role as default
        }

        // Show modal
        userModal.style.display = 'block';
        console.log('Create user modal opened successfully');
    }

    // Edit user - matches GET /api/users/{id}
    async editUser(userId) {
        if (!userId) {
            this.showNotification('Invalid user ID', 'error');
            return;
        }

        try {
            console.log(`Loading user details for ID: ${userId}`);

            const response = await fetch(`${this.API_BASE_URL}/users/${userId}`, {
                method: 'GET',
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
            console.log('Loaded user details:', user);

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

            // Set selected role (UserDTO returns single role)
            if (rolesSelect && user.roleName) {
                Array.from(rolesSelect.options).forEach(option => {
                    option.selected = option.value === user.roleName;
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
        console.log('User modal closed');
    }

    // Handle user form submission - FIXED
    async handleUserFormSubmission(e) {
        e.preventDefault();
        console.log('Handling user form submission...');

        const form = e.target;
        const formData = new FormData(form);

        // Get form values with better validation
        const username = formData.get('username')?.toString().trim();
        const email = formData.get('email')?.toString().trim();
        const password = formData.get('password')?.toString();
        const firstName = formData.get('firstName')?.toString().trim();
        const lastName = formData.get('lastName')?.toString().trim();

        console.log('Form data:', { username, email, firstName, lastName, hasPassword: !!password });

        // Validation
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

        // Get selected role
        const rolesSelect = document.getElementById('roles');
        const selectedRole = rolesSelect ? rolesSelect.value : 'USER';

        if (!selectedRole) {
            this.showNotification('Please select a role', 'error');
            return;
        }

        console.log('Selected role:', selectedRole);

        const userData = {
            username,
            email,
            firstName: firstName || null,
            lastName: lastName || null
        };

        // Only include password if it's provided
        if (password) {
            userData.password = password;
        }

        console.log('User data to send:', userData);

        try {
            this.showLoading(true);
            let response;

            if (this.editingUserId) {
                // Update user - matches PUT /api/users/{id}
                console.log(`Updating user ${this.editingUserId}`);
                response = await fetch(`${this.API_BASE_URL}/users/${this.editingUserId}`, {
                    method: 'PUT',
                    headers: {
                        ...this.getAuthHeaders(),
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(userData)
                });
            } else {
                // Create user - matches POST /api/users?roleName={roleName}
                const url = `${this.API_BASE_URL}/users?roleName=${encodeURIComponent(selectedRole)}`;
                console.log('Creating new user with URL:', url);
                response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        ...this.getAuthHeaders(),
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(userData)
                });
            }

            console.log('Response status:', response.status);

            if (response.status === 401) {
                this.handleUnauthorized();
                return;
            }

            if (!response.ok) {
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (e) {
                    const errorText = await response.text();
                    errorMessage = errorText || errorMessage;
                }
                throw new Error(errorMessage);
            }

            const result = await response.json();
            console.log('User save result:', result);

            this.showNotification(`User ${this.editingUserId ? 'updated' : 'created'} successfully!`, 'success');
            this.closeUserModal();

            // Reload users to show the changes
            await this.loadUsers();

        } catch (error) {
            console.error('Error saving user:', error);
            this.showNotification('Error saving user: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    // Activate user - matches PUT /api/users/{id}/activate
    async activateUser(userId) {
        if (!userId) {
            this.showNotification('Invalid user ID', 'error');
            return;
        }

        try {
            const response = await fetch(`${this.API_BASE_URL}/users/${userId}/activate`, {
                method: 'PUT',
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

            this.showNotification('User activated successfully!', 'success');
            await this.loadUsers();
        } catch (error) {
            console.error('Error activating user:', error);
            this.showNotification('Error activating user: ' + error.message, 'error');
        }
    }

    // Deactivate user - matches PUT /api/users/{id}/deactivate
    async deactivateUser(userId) {
        if (!userId) {
            this.showNotification('Invalid user ID', 'error');
            return;
        }

        if (!confirm('Are you sure you want to deactivate this user?')) {
            return;
        }

        try {
            const response = await fetch(`${this.API_BASE_URL}/users/${userId}/deactivate`, {
                method: 'PUT',
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

            this.showNotification('User deactivated successfully!', 'success');
            await this.loadUsers();
        } catch (error) {
            console.error('Error deactivating user:', error);
            this.showNotification('Error deactivating user: ' + error.message, 'error');
        }
    }

    // Delete user - matches DELETE /api/users/{id}
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

    // Search users by name - matches GET /api/users/search?name={name}
    async searchUsersByName(searchTerm) {
        if (!searchTerm || searchTerm.trim() === '') {
            await this.loadUsers();
            return;
        }

        try {
            const response = await fetch(`${this.API_BASE_URL}/users/search?name=${encodeURIComponent(searchTerm)}`, {
                method: 'GET',
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
            console.error('Error searching users:', error);
            this.showNotification('Error searching users: ' + error.message, 'error');
        }
    }

    // Manage user address (placeholder - you'll need to implement address endpoints)
    async manageAddress(userId) {
        if (!userId) {
            this.showNotification('Invalid user ID', 'error');
            return;
        }

        // Show the address modal
        const addressModal = document.getElementById('addressModal');
        if (addressModal) {
            this.addressUserId = userId;
            addressModal.style.display = 'block';
        } else {
            this.showNotification('Address management feature not yet implemented in API', 'warning');
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

    // Handle address form submission (placeholder)
    async handleAddressFormSubmission(e) {
        e.preventDefault();
        this.showNotification('Address management feature not yet implemented in API', 'warning');
        this.closeAddressModal();
    }

    // View user orders
    viewUserOrders(userId) {
        if (!userId) {
            this.showNotification('Invalid user ID', 'error');
            return;
        }
        window.location.href = `orders.html?userId=${userId}`;
    }

    // Filter users (client-side filtering)
    filterUsers() {
        const searchInput = document.getElementById('userSearch');
        if (!searchInput) return;

        const searchTerm = searchInput.value.toLowerCase().trim();

        if (!searchTerm) {
            this.displayUsers(this.users);
            return;
        }

        // Use server-side search for better performance
        this.searchUsersByName(searchTerm);
    }

    // Set active filter
    setActiveFilter(filterType) {
        this.currentFilter = filterType;

        // Update button styles
        document.querySelectorAll('.filter-buttons button').forEach(btn => {
            btn.classList.remove('active');
        });

        // Set active button
        let activeButtonId;
        switch(filterType) {
            case 'all':
                activeButtonId = 'allUsersBtn';
                this.refreshUsers();
                break;
            case 'active':
                activeButtonId = 'activeUsersBtn';
                this.loadActiveUsers();
                break;
            case 'ADMIN':
                activeButtonId = 'adminUsersBtn';
                this.loadUsersByRole('ADMIN');
                break;
            case 'USER':
                activeButtonId = 'userUsersBtn';
                this.loadUsersByRole('USER');
                break;
            case 'MANAGER':
                activeButtonId = 'managerUsersBtn';
                this.loadUsersByRole('MANAGER');
                break;
        }

        const activeButton = document.getElementById(activeButtonId);
        if (activeButton) {
            activeButton.classList.add('active');
        }
    }

    // Load active users - matches GET /api/users/active
    async loadActiveUsers() {
        try {
            this.showLoading(true);
            console.log('Loading active users from:', `${this.API_BASE_URL}/users/active`);

            const response = await fetch(`${this.API_BASE_URL}/users/active`, {
                method: 'GET',
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

            console.log(`Successfully loaded ${this.users.length} active users`);
        } catch (error) {
            console.error('Error loading active users:', error);
            this.showNotification('Error loading active users: ' + error.message, 'error');
            this.users = [];
            this.displayUsers([]);
        } finally {
            this.showLoading(false);
        }
    }

    // Load users by role - matches GET /api/users/role/{roleName}
    async loadUsersByRole(roleName) {
        if (!roleName) {
            this.showNotification('Invalid role name', 'error');
            return;
        }

        try {
            this.showLoading(true);
            console.log('Loading users by role from:', `${this.API_BASE_URL}/users/role/${roleName}`);

            const response = await fetch(`${this.API_BASE_URL}/users/role/${encodeURIComponent(roleName)}`, {
                method: 'GET',
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

            console.log(`Successfully loaded ${this.users.length} users with role ${roleName}`);
        } catch (error) {
            console.error('Error loading users by role:', error);
            this.showNotification(`Error loading users with role ${roleName}: ` + error.message, 'error');
            this.users = [];
            this.displayUsers([]);
        } finally {
            this.showLoading(false);
        }
    }

    // Refresh users (reload all users) - FIXED
    async refreshUsers() {
        console.log('Refreshing users...');
        try {
            this.showLoading(true);
            await this.loadUsers();
            this.showNotification('Users refreshed successfully!', 'success');
        } catch (error) {
            console.error('Error refreshing users:', error);
            this.showNotification('Error refreshing users: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    // Assign role to user - matches PUT /api/users/{id}/role
    async assignRole(userId, roleId) {
        if (!userId || !roleId) {
            this.showNotification('Invalid user ID or role ID', 'error');
            return;
        }

        try {
            const response = await fetch(`${this.API_BASE_URL}/users/${userId}/role?roleId=${roleId}`, {
                method: 'PUT',
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

            this.showNotification('Role assigned successfully!', 'success');
            await this.loadUsers();
        } catch (error) {
            console.error('Error assigning role:', error);
            this.showNotification('Error assigning role: ' + error.message, 'error');
        }
    }

    // Change user password - matches PUT /api/users/{id}/change-password
    async changePassword(userId, currentPassword, newPassword) {
        if (!userId || !currentPassword || !newPassword) {
            this.showNotification('All password fields are required', 'error');
            return;
        }

        try {
            const response = await fetch(`${this.API_BASE_URL}/users/${userId}/change-password?currentPassword=${encodeURIComponent(currentPassword)}&newPassword=${encodeURIComponent(newPassword)}`, {
                method: 'PUT',
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

            this.showNotification('Password changed successfully!', 'success');
        } catch (error) {
            console.error('Error changing password:', error);
            this.showNotification('Error changing password: ' + error.message, 'error');
        }
    }

    // Check user permission - matches GET /api/users/{id}/has-permission
    async checkUserPermission(userId, permissionName) {
        if (!userId || !permissionName) {
            this.showNotification('Invalid user ID or permission name', 'error');
            return false;
        }

        try {
            const response = await fetch(`${this.API_BASE_URL}/users/${userId}/has-permission?permissionName=${encodeURIComponent(permissionName)}`, {
                method: 'GET',
                headers: this.getAuthHeaders()
            });

            if (response.status === 401) {
                this.handleUnauthorized();
                return false;
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const hasPermission = await response.json();
            return hasPermission;
        } catch (error) {
            console.error('Error checking user permission:', error);
            this.showNotification('Error checking user permission: ' + error.message, 'error');
            return false;
        }
    }

    // Load users with specific permission - matches GET /api/users/with-permission
    async loadUsersWithPermission(permissionName) {
        if (!permissionName) {
            this.showNotification('Invalid permission name', 'error');
            return;
        }

        try {
            this.showLoading(true);
            console.log('Loading users with permission from:', `${this.API_BASE_URL}/users/with-permission?permissionName=${permissionName}`);

            const response = await fetch(`${this.API_BASE_URL}/users/with-permission?permissionName=${encodeURIComponent(permissionName)}`, {
                method: 'GET',
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

            console.log(`Successfully loaded ${this.users.length} users with permission ${permissionName}`);
        } catch (error) {
            console.error('Error loading users with permission:', error);
            this.showNotification(`Error loading users with permission ${permissionName}: ` + error.message, 'error');
            this.users = [];
            this.displayUsers([]);
        } finally {
            this.showLoading(false);
        }
    }

    // Show loading indicator
    showLoading(show) {
        const loadingElement = document.getElementById('loadingIndicator');
        if (loadingElement) {
            loadingElement.style.display = show ? 'block' : 'none';
        }
    }

    // Show notification
    showNotification(message, type = 'info') {
        console.log(`${type.toUpperCase()}: ${message}`);

        // Try to show in a notification element if it exists
        const notificationElement = document.getElementById('notification');
        if (notificationElement) {
            notificationElement.textContent = message;
            notificationElement.className = `notification ${type}`;
            notificationElement.style.display = 'block';

            // Auto-hide after 5 seconds
            setTimeout(() => {
                notificationElement.style.display = 'none';
            }, 5000);
        } else {
            // Fallback to alert for important messages
            if (type === 'error') {
                alert(message);
            }
        }
    }

    // Get authentication headers
    getAuthHeaders() {
        const headers = {
            'Accept': 'application/json'
        };

        try {
            // Check if we're in a browser environment that supports localStorage
            if (typeof(Storage) !== "undefined") {
                const token = localStorage.getItem('authToken');
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }
            }
        } catch (error) {
            console.warn('Unable to access localStorage for auth token:', error);
        }

        return headers;
    }

    // Handle unauthorized access
    handleUnauthorized() {
        console.error('Unauthorized access - redirecting to login');
        this.showNotification('Your session has expired. Please log in again.', 'error');

        // Clear stored auth data
        try {
            if (typeof(Storage) !== "undefined") {
                localStorage.removeItem('authToken');
                localStorage.removeItem('userRole');
                localStorage.removeItem('username');
            }
        } catch (error) {
            console.warn('Unable to clear localStorage:', error);
        }

        // Redirect to login page
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
    }

    // Validate email format
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Escape HTML to prevent XSS
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Export data to CSV
    exportToCSV() {
        if (!this.users || this.users.length === 0) {
            this.showNotification('No users to export', 'warning');
            return;
        }

        const headers = ['ID', 'Username', 'Email', 'First Name', 'Last Name', 'Role', 'Status', 'Created At'];
        const csvContent = [
            headers.join(','),
            ...this.users.map(user => [
                user.id || '',
                `"${(user.username || '').replace(/"/g, '""')}"`,
                `"${(user.email || '').replace(/"/g, '""')}"`,
                `"${(user.firstName || '').replace(/"/g, '""')}"`,
                `"${(user.lastName || '').replace(/"/g, '""')}"`,
                `"${(user.roleName || '').replace(/"/g, '""')}"`,
                user.active ? 'Active' : 'Inactive',
                user.createdAt ? new Date(user.createdAt).toLocaleDateString() : ''
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        this.showNotification('Users exported successfully!', 'success');
    }

    // Import data from CSV (placeholder for future implementation)
    importFromCSV(file) {
        this.showNotification('Import functionality not yet implemented', 'warning');
    }

    // Reset all filters
    resetFilters() {
        const searchInput = document.getElementById('userSearch');
        if (searchInput) {
            searchInput.value = '';
        }

        this.currentFilter = 'all';
        this.setActiveFilter('all');
    }

    // Bulk operations
    async bulkActivateUsers(userIds) {
        if (!userIds || userIds.length === 0) {
            this.showNotification('No users selected', 'warning');
            return;
        }

        let successCount = 0;
        let errorCount = 0;

        for (const userId of userIds) {
            try {
                const response = await fetch(`${this.API_BASE_URL}/users/${userId}/activate`, {
                    method: 'PUT',
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

                successCount++;
            } catch (error) {
                errorCount++;
                console.error(`Error activating user ${userId}:`, error);
            }
        }

        this.showNotification(
            `Bulk activation completed: ${successCount} successful, ${errorCount} failed`,
            errorCount > 0 ? 'warning' : 'success'
        );

        // Reload users to reflect changes
        await this.loadUsers();
    }

    async bulkDeactivateUsers(userIds) {
        if (!userIds || userIds.length === 0) {
            this.showNotification('No users selected', 'warning');
            return;
        }

        if (!confirm(`Are you sure you want to deactivate ${userIds.length} users?`)) {
            return;
        }

        let successCount = 0;
        let errorCount = 0;

        for (const userId of userIds) {
            try {
                const response = await fetch(`${this.API_BASE_URL}/users/${userId}/deactivate`, {
                    method: 'PUT',
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

                successCount++;
            } catch (error) {
                errorCount++;
                console.error(`Error deactivating user ${userId}:`, error);
            }
        }

        this.showNotification(
            `Bulk deactivation completed: ${successCount} successful, ${errorCount} failed`,
            errorCount > 0 ? 'warning' : 'success'
        );

        // Reload users to reflect changes
        await this.loadUsers();
    }

    // Get selected user IDs from checkboxes (if implemented in UI)
    getSelectedUserIds() {
        const checkboxes = document.querySelectorAll('input[name="userSelect"]:checked');
        return Array.from(checkboxes).map(cb => parseInt(cb.value));
    }

    // Utility method to format date
    formatDate(dateString) {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString();
        } catch (error) {
            return 'Invalid Date';
        }
    }

    // Utility method to format user full name
    formatFullName(user) {
        if (!user) return 'N/A';
        const firstName = user.firstName || '';
        const lastName = user.lastName || '';
        return `${firstName} ${lastName}`.trim() || user.username || 'N/A';
    }

    // Refresh page data
    async refresh() {
        console.log('Refreshing user data...');
        await Promise.all([
            this.loadUsers(),
            this.loadRoles()
        ]);
        this.showNotification('Data refreshed successfully!', 'success');
    }
}

// Initialize the UserManager when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing UserManager...');

    // Create global instance
    window.userManager = new UserManager();

    // Add global event listeners for filter buttons
    const filterButtons = {
        'allUsersBtn': 'all',
        'activeUsersBtn': 'active',
        'adminUsersBtn': 'ADMIN',
        'userUsersBtn': 'USER',
        'managerUsersBtn': 'MANAGER'
    };

    Object.entries(filterButtons).forEach(([buttonId, filterType]) => {
        const button = document.getElementById(buttonId);
        if (button) {
            button.addEventListener('click', () => {
                window.userManager.setActiveFilter(filterType);
            });
        }
    });

    // Add event listener for create user button
    const createUserBtn = document.getElementById('createUserBtn');
    if (createUserBtn) {
        createUserBtn.addEventListener('click', () => {
            window.userManager.showCreateUserModal();
        });
    }

    // Add event listener for refresh button
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            window.userManager.refresh();
        });
    }

    // Add event listener for export button
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            window.userManager.exportToCSV();
        });
    }

    // Add event listener for reset filters button
    const resetFiltersBtn = document.getElementById('resetFiltersBtn');
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', () => {
            window.userManager.resetFilters();
        });
    }

    // Add event listener for bulk operations if buttons exist
    const bulkActivateBtn = document.getElementById('bulkActivateBtn');
    if (bulkActivateBtn) {
        bulkActivateBtn.addEventListener('click', () => {
            const selectedIds = window.userManager.getSelectedUserIds();
            window.userManager.bulkActivateUsers(selectedIds);
        });
    }

    const bulkDeactivateBtn = document.getElementById('bulkDeactivateBtn');
    if (bulkDeactivateBtn) {
        bulkDeactivateBtn.addEventListener('click', () => {
            const selectedIds = window.userManager.getSelectedUserIds();
            window.userManager.bulkDeactivateUsers(selectedIds);
        });
    }

    console.log('UserManager initialization complete');
});