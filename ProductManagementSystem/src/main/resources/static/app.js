// Global variables
let currentUser = null;
let userRoles = [];
const API_BASE_URL = 'http://localhost:8080/api';

// Authentication token (Note: localStorage is used for demo - in production use secure storage)
let authToken = null;

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    // Check for existing token
    authToken = localStorage.getItem('authToken');

    if (authToken) {
        validateToken();
    } else {
        showLogin();
    }
});

// Authentication functions
async function login(event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('loginError');

    // Clear previous errors
    errorDiv.style.display = 'none';

    // Disable submit button during login
    const submitBtn = event.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            const data = await response.json();

            // Store authentication data
            authToken = data.token;
            currentUser = data.user;
            userRoles = data.roles || [];

            // Persist to localStorage
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            localStorage.setItem('userRoles', JSON.stringify(userRoles));

            // Show dashboard
            showDashboard();
            setupRoleBasedAccess();
            loadDashboardData();

        } else {
            const errorData = await response.json().catch(() => ({ message: 'Invalid credentials' }));
            showLoginError(errorData.message || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);

        // For demo purposes, allow login with specific demo credentials
        if (username === 'admin' && password === 'admin') {
            currentUser = { username: 'admin', id: 1, firstName: 'Admin', lastName: 'User' };
            userRoles = ['ADMIN'];
            authToken = 'demo-admin-token';
        } else if (username === 'manager' && password === 'manager') {
            currentUser = { username: 'manager', id: 2, firstName: 'Manager', lastName: 'User' };
            userRoles = ['MANAGER'];
            authToken = 'demo-manager-token';
        } else if (username === 'user' && password === 'user') {
            currentUser = { username: 'user', id: 3, firstName: 'Regular', lastName: 'User' };
            userRoles = ['USER'];
            authToken = 'demo-user-token';
        } else {
            showLoginError('Invalid credentials. Demo credentials: admin/admin, manager/manager, user/user');
            return;
        }

        // Store demo data
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        localStorage.setItem('userRoles', JSON.stringify(userRoles));

        showDashboard();
        setupRoleBasedAccess();
        loadDashboardData();
    } finally {
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
    }
}

function showLoginError(message) {
    const errorDiv = document.getElementById('loginError');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

async function validateToken() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/validate`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            currentUser = data.user || JSON.parse(localStorage.getItem('currentUser'));
            userRoles = data.roles || JSON.parse(localStorage.getItem('userRoles')) || [];

            showDashboard();
            setupRoleBasedAccess();
            loadDashboardData();
        } else {
            // Token invalid, clear storage and show login
            clearAuthData();
            showLogin();
        }
    } catch (error) {
        console.error('Token validation error:', error);

        // For demo, try to use stored data if available
        const storedUser = localStorage.getItem('currentUser');
        const storedRoles = localStorage.getItem('userRoles');

        if (storedUser && storedRoles) {
            currentUser = JSON.parse(storedUser);
            userRoles = JSON.parse(storedRoles);
            showDashboard();
            setupRoleBasedAccess();
            loadDashboardData();
        } else {
            clearAuthData();
            showLogin();
        }
    }
}

function logout() {
    clearAuthData();
    showLogin();
}

function clearAuthData() {
    authToken = null;
    currentUser = null;
    userRoles = [];
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userRoles');
}

// UI Functions
function showLogin() {
    document.getElementById('loginSection').style.display = 'block';
    document.getElementById('dashboard').style.display = 'none';

    // Clear form
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    document.getElementById('loginError').style.display = 'none';
}

function showDashboard() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';

    // Update current user display
    const userDisplay = currentUser ? `Welcome, ${currentUser.firstName || currentUser.username}` : 'Welcome, User';
    document.getElementById('currentUser').textContent = userDisplay;
}

// Role-based access control
function setupRoleBasedAccess() {
    const adminSection = document.getElementById('adminSection');
    const masterDataSection = document.getElementById('masterDataSection');
    const ordersSection = document.getElementById('ordersSection');
    const inventorySection = document.getElementById('inventorySection');
    const financialSection = document.getElementById('financialSection');

    // Reset all sections
    [adminSection, masterDataSection, ordersSection, inventorySection, financialSection].forEach(section => {
        if (section) section.style.display = 'none';
    });

    // Show sections based on roles
    if (userRoles.includes('ADMIN')) {
        // Admin can see everything
        adminSection.style.display = 'block';
        masterDataSection.style.display = 'block';
        ordersSection.style.display = 'block';
        inventorySection.style.display = 'block';
        financialSection.style.display = 'block';
    } else if (userRoles.includes('MANAGER')) {
        // Manager can see most sections except admin
        masterDataSection.style.display = 'block';
        ordersSection.style.display = 'block';
        inventorySection.style.display = 'block';
        financialSection.style.display = 'block';
    } else if (userRoles.includes('USER')) {
        // Regular user can see basic sections
        ordersSection.style.display = 'block';
        inventorySection.style.display = 'block';
    }
}

// API Helper functions
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        },
        ...options
    };

    try {
        const response = await fetch(url, config);

        if (response.status === 401) {
            // Unauthorized - redirect to login
            clearAuthData();
            showLogin();
            throw new Error('Unauthorized');
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API request failed:', error);

        // Return mock data for demo purposes
        return getMockData(endpoint);
    }
}

// Mock data for demo
function getMockData(endpoint) {
    const mockData = {
        '/products': [
            { id: 1, name: 'Laptop', description: 'High-performance laptop', price: 1299.99, category: { name: 'Electronics' } },
            { id: 2, name: 'Mouse', description: 'Wireless mouse', price: 29.99, category: { name: 'Electronics' } },
            { id: 3, name: 'Keyboard', description: 'Mechanical keyboard', price: 89.99, category: { name: 'Electronics' } }
        ],
        '/categories': [
            { id: 1, name: 'Electronics', description: 'Electronic devices' },
            { id: 2, name: 'Accessories', description: 'Computer accessories' }
        ],
        '/orders': [
            { id: 1, orderDate: '2024-01-15', orderStatus: 'DELIVERED', user: { username: 'john_doe' } },
            { id: 2, orderDate: '2024-01-16', orderStatus: 'PROCESSING', user: { username: 'jane_smith' } }
        ],
        '/warehouses': [
            { id: 1, name: 'Main Warehouse', location: 'New York' },
            { id: 2, name: 'Secondary Warehouse', location: 'Los Angeles' }
        ],
        '/users': [
            { id: 1, username: 'admin', email: 'admin@example.com', firstName: 'Admin', lastName: 'User' },
            { id: 2, username: 'manager', email: 'manager@example.com', firstName: 'Manager', lastName: 'User' },
            { id: 3, username: 'user', email: 'user@example.com', firstName: 'Regular', lastName: 'User' }
        ]
    };

    return mockData[endpoint] || [];
}

// Dashboard data loading
async function loadDashboardData() {
    try {
        const [products, orders, warehouses, users] = await Promise.all([
            apiRequest('/products'),
            apiRequest('/orders'),
            apiRequest('/warehouses'),
            apiRequest('/users')
        ]);

        document.getElementById('totalProducts').textContent = products.length;
        document.getElementById('totalOrders').textContent = orders.length;
        document.getElementById('totalWarehouses').textContent = warehouses.length;
        document.getElementById('totalUsers').textContent = users.length;

        loadRecentActivities();
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

function loadRecentActivities() {
    const activitiesContainer = document.getElementById('recentActivities');
    activitiesContainer.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <i class="${activity.icon}"></i>
            <div class="activity-content">
                <p>${activity.text}</p>
                <small>${activity.time}</small>
            </div>
        </div>
    `).join('');
}

// Utility functions
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString();
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Export functions for use in other pages
window.apiRequest = apiRequest;
window.formatDate = formatDate;
window.formatCurrency = formatCurrency;
window.getCurrentUser = () => currentUser;
window.getUserRoles = () => userRoles;
window.getAuthToken = () => authToken;