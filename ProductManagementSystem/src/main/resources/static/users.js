// User Management JavaScript
let currentUser = null;
let editingUserId = null;
let addressUserId = null;
const API_BASE_URL = 'http://localhost:8080/api';

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    loadUsers();
    loadRoles();
    checkUserRole();
});

// Check user role and show/hide elements accordingly
function checkUserRole() {
    const userRole = localStorage.getItem('userRole') || 'USER';
    const currentUserName = localStorage.getItem('username') || 'Guest';
    document.getElementById('currentUser').textContent = currentUserName;

    if (userRole !== 'ADMIN') {
        // Hide admin-only buttons
        const adminButtons = document.querySelectorAll('.admin-only');
        adminButtons.forEach(btn => btn.style.display = 'none');

        // Show warning message
        showNotification('You have limited access to user management features.', 'warning');
    }
}

// Load all users
async function loadUsers() {
    try {
        showLoading(true);
        const response = await fetch(`${API_BASE_URL}/users`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load users');
        }

        const users = await response.json();
        displayUsers(users);
    } catch (error) {
        showNotification('Error loading users: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Display users in table
function displayUsers(users) {
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '';

    users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.id}</td>
            <td>${user.username}</td>
            <td>${user.email}</td>
            <td>${user.firstName || ''}</td>
            <td>${user.lastName || ''}</td>
            <td>${user.roles ? user.roles.map(role => role.name).join(', ') : ''}</td>
            <td class="actions">
                <button onclick="editUser(${user.id})" class="btn btn-sm btn-primary">Edit</button>
                <button onclick="manageAddress(${user.id})" class="btn btn-sm btn-secondary">Address</button>
                <button onclick="viewUserOrders(${user.id})" class="btn btn-sm btn-info">Orders</button>
                <button onclick="deleteUser(${user.id})" class="btn btn-sm btn-danger admin-only">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });

    // Hide admin-only buttons if not admin
    checkUserRole();
}

// Load roles for dropdown
async function loadRoles() {
    try {
        const response = await fetch(`${API_BASE_URL}/roles`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load roles');
        }

        const roles = await response.json();
        const rolesSelect = document.getElementById('roles');
        rolesSelect.innerHTML = '';

        roles.forEach(role => {
            const option = document.createElement('option');
            option.value = role.id;
            option.textContent = role.name;
            rolesSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading roles:', error);
    }
}

// Show create user modal
function showCreateUserModal() {
    document.getElementById('modalTitle').textContent = 'Create User';
    document.getElementById('userForm').reset();
    editingUserId = null;
    document.getElementById('userModal').style.display = 'block';
}

// Edit user
async function editUser(userId) {
    try {
        const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load user details');
        }

        const user = await response.json();

        document.getElementById('modalTitle').textContent = 'Edit User';
        document.getElementById('username').value = user.username;
        document.getElementById('email').value = user.email;
        document.getElementById('firstName').value = user.firstName || '';
        document.getElementById('lastName').value = user.lastName || '';

        // Set selected roles
        const rolesSelect = document.getElementById('roles');
        Array.from(rolesSelect.options).forEach(option => {
            option.selected = user.roles && user.roles.some(role => role.id == option.value);
        });

        editingUserId = userId;
        document.getElementById('userModal').style.display = 'block';
    } catch (error) {
        showNotification('Error loading user details: ' + error.message, 'error');
    }
}

// Close user modal
function closeUserModal() {
    document.getElementById('userModal').style.display = 'none';
    editingUserId = null;
}

// Handle user form submission
document.getElementById('userForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const selectedRoles = Array.from(document.getElementById('roles').selectedOptions)
        .map(option => ({ id: parseInt(option.value) }));

    const userData = {
        username: formData.get('username'),
        email: formData.get('email'),
        password: formData.get('password'),
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        roles: selectedRoles
    };

    try {
        let response;
        if (editingUserId) {
            // Update user
            response = await fetch(`${API_BASE_URL}/users/${editingUserId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });
        } else {
            // Create user
            response = await fetch(`${API_BASE_URL}/users`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });
        }

        if (!response.ok) {
            throw new Error('Failed to save user');
        }

        showNotification(`User ${editingUserId ? 'updated' : 'created'} successfully!`, 'success');
        closeUserModal();
        loadUsers();
    } catch (error) {
        showNotification('Error saving user: ' + error.message, 'error');
    }
});

// Delete user
async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to delete user');
        }

        showNotification('User deleted successfully!', 'success');
        loadUsers();
    } catch (error) {
        showNotification('Error deleting user: ' + error.message, 'error');
    }
}

// Manage user address
async function manageAddress(userId) {
    try {
        const response = await fetch(`${API_BASE_URL}/users/${userId}/address`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        let address = {};
        if (response.ok) {
            address = await response.json();
        }

        // Populate address form
        document.getElementById('streetAddress').value = address.streetAddress || '';
        document.getElementById('city').value = address.city || '';
        document.getElementById('state').value = address.state || '';
        document.getElementById('postalCode').value = address.postalCode || '';
        document.getElementById('country').value = address.country || '';

        addressUserId = userId;
        document.getElementById('addressModal').style.display = 'block';
    } catch (error) {
        showNotification('Error loading address: ' + error.message, 'error');
    }
}

// Close address modal
function closeAddressModal() {
    document.getElementById('addressModal').style.display = 'none';
    addressUserId = null;
}

// Handle address form submission
document.getElementById('addressForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const addressData = {
        streetAddress: formData.get('streetAddress'),
        city: formData.get('city'),
        state: formData.get('state'),
        postalCode: formData.get('postalCode'),
        country: formData.get('country')
    };

    try {
        const response = await fetch(`${API_BASE_URL}/users/${addressUserId}/address`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(addressData)
        });

        if (!response.ok) {
            throw new Error('Failed to save address');
        }

        showNotification('Address saved successfully!', 'success');
        closeAddressModal();
    } catch (error) {
        showNotification('Error saving address: ' + error.message, 'error');
    }
});

// View user orders
function viewUserOrders(userId) {
    window.location.href = `orders.html?userId=${userId}`;
}

// Filter users
function filterUsers() {
    const searchTerm = document.getElementById('userSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#usersTableBody tr');

    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

// Refresh users
function refreshUsers() {
    loadUsers();
}

// Utility functions
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // Add to page
    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        document.body.removeChild(notification);
    }, 3000);
}

function showLoading(show) {
    // You can implement a loading spinner here
    if (show) {
        document.body.style.cursor = 'wait';
    } else {
        document.body.style.cursor = 'default';
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('userRole');
    window.location.href = 'login.html';
}

// Close modals when clicking outside
window.onclick = function(event) {
    const userModal = document.getElementById('userModal');
    const addressModal = document.getElementById('addressModal');

    if (event.target === userModal) {
        closeUserModal();
    }
    if (event.target === addressModal) {
        closeAddressModal();
    }
}