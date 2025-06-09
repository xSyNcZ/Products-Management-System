// Global variables
let currentUser = null;
let userRoles = [];
const API_BASE_URL = 'http://localhost:8080/api';

// Authentication token (in real app, use secure storage)
let authToken = localStorage.getItem('authToken');

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
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
            authToken = data.token;
            currentUser = data.user;
            userRoles = data.roles || [];

            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            localStorage.setItem('userRoles', JSON.stringify(userRoles));

            showDashboard();
            setupRoleBasedAccess();
            loadDashboardData();
        } else {
            alert('Invalid credentials');
        }
    } catch (error) {
        console.error('Login error:', error);
        // For demo purposes, allow login with any credentials
        currentUser = { username: username, id: 1 };
        userRoles = ['ADMIN']; // Default role for demo
        showDashboard();
        setupRoleBasedAccess();
        loadDashboardData();
    }
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
            currentUser = JSON.parse(localStorage.getItem('currentUser'));
            userRoles = JSON.parse(localStorage.getItem('userRoles')) || [];
            showDashboard();
            setupRoleBasedAccess();
            loadDashboardData();
        } else {
            showLogin();
        }
    } catch (error) {
        // For demo, assume valid token
        currentUser = JSON.parse(localStorage.getItem('currentUser')) || { username: 'Demo User', id: 1 };
        userRoles = JSON.parse(localStorage.getItem('userRoles')) || ['ADMIN'];
        showDashboard();
        setupRoleBasedAccess();
        loadDashboardData();
    }
}

function logout() {
    authToken = null;
    currentUser = null;
    userRoles = [];
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userRoles');
    showLogin();
}

// UI Functions
function showLogin() {
    document.getElementById('loginSection').style.display = 'block';
    document.getElementById('dashboard').style.display = 'none';
}

function showDashboard() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    document.getElementById('currentUser').textContent = `Welcome, ${currentUser.username}`;
}

// Role-based access control
function setupRoleBasedAccess() {
    const adminSection = document.getElementById('adminSection');

    // Show admin section only for admin users
    if (userRoles.includes('ADMIN') || userRoles.includes('MANAGER')) {
        adminSection.style.display = 'block';
    } else {
        adminSection.style.display = 'none';
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
            { id: 2, username: 'user', email: 'user@example.com', firstName: 'Regular', lastName: 'User' }
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
    const activities = [
        { icon: 'fas fa-plus', text: 'New product added: Laptop Pro', time: '2 hours ago' },
        { icon: 'fas fa-shopping-cart', text: 'Order #1234 completed', time: '4 hours ago' },
        { icon: 'fas fa-user', text: 'New user registered: john_doe', time: '6 hours ago' },
        { icon: 'fas fa-warehouse', text: 'Stock updated for Warehouse A', time: '8 hours ago' }
    ];

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
window.currentUser = currentUser;
window.userRoles = userRoles;