// Payment Management JavaScript
class PaymentManager {
    constructor() {
        this.apiUrl = '/api/payments';
        this.currentPayment = null;
        this.userRole = this.getUserRole();
        this.init();
    }

    getUserRole() {
        const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
        return user.roles?.[0]?.name || 'USER';
    }

    init() {
        this.bindEvents();
        this.loadPayments();
        this.checkPermissions();
    }

    checkPermissions() {
        const isAdmin = this.userRole === 'ADMIN';
        const createBtn = document.getElementById('createPaymentBtn');

        if (!isAdmin) {
            createBtn.style.display = 'none';
        }
    }

    bindEvents() {
        // Create payment button
        document.getElementById('createPaymentBtn').addEventListener('click', () => {
            this.openPaymentModal();
        });

        // Search functionality
        document.getElementById('searchBtn').addEventListener('click', () => {
            this.searchPayments();
        });

        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchPayments();
            }
        });

        // Filter functionality
        document.getElementById('statusFilter').addEventListener('change', () => {
            this.filterPayments();
        });

        // Modal events
        document.querySelector('#paymentModal .close').addEventListener('click', () => {
            this.closeModal('paymentModal');
        });

        document.getElementById('cancelBtn').addEventListener('click', () => {
            this.closeModal('paymentModal');
        });

        // Form submission
        document.getElementById('paymentForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.savePayment();
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });
    }

    async loadPayments() {
        try {
            const response = await fetch(this.apiUrl, {
                headers: this.getAuthHeaders()
            });

            if (!response.ok) throw new Error('Failed to load payments');

            const payments = await response.json();
            this.payments = payments;
            this.displayPayments(payments);
        } catch (error) {
            console.error('Error loading payments:', error);
            this.showError('Failed to load payments');
        }
    }

    displayPayments(payments) {
        const tbody = document.getElementById('paymentsTableBody');
        tbody.innerHTML = '';

        payments.forEach(payment => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${payment.id}</td>
                <td>${this.formatDateTime(payment.paymentDate)}</td>
                <td>$${payment.amount?.toFixed(2) || '0.00'}</td>
                <td>${this.formatPaymentMethod(payment.paymentMethod)}</td>
                <td>
                    <span class="status-badge ${payment.paymentStatus?.toLowerCase() || 'pending'}">
                        ${payment.paymentStatus || 'PENDING'}
                    </span>
                </td>
                <td>${payment.invoice?.id || 'N/A'}</td>
                <td>
                    ${this.userRole === 'ADMIN' ? `
                        <button class="btn btn-sm btn-primary" onclick="paymentManager.editPayment(${payment.id})">
                            Edit
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="paymentManager.deletePayment(${payment.id})">
                            Delete
                        </button>
                    ` : `
                        <button class="btn btn-sm btn-info" onclick="paymentManager.viewPayment(${payment.id})">
                            View
                        </button>
                    `}
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    formatPaymentMethod(method) {
        const methods = {
            'CREDIT_CARD': 'Credit Card',
            'DEBIT_CARD': 'Debit Card',
            'PAYPAL': 'PayPal',
            'BANK_TRANSFER': 'Bank Transfer',
            'CASH': 'Cash'
        };
        return methods[method] || method;
    }

    async openPaymentModal(payment = null) {
        this.currentPayment = payment;
        const modal = document.getElementById('paymentModal');
        const title = document.getElementById('modalTitle');
        const form = document.getElementById('paymentForm');

        title.textContent = payment ? 'Edit Payment' : 'Record Payment';
        form.reset();

        if (payment) {
            document.getElementById('amount').value = payment.amount || '';
            document.getElementById('paymentMethod').value = payment.paymentMethod || '';
            document.getElementById('paymentStatus').value = payment.paymentStatus || '';
        } else {
            document.getElementById('paymentStatus').value = 'PAID';
        }

        modal.style.display = 'block';
    }

    async savePayment() {
        const formData = new FormData(document.getElementById('paymentForm'));
        const paymentData = {
            amount: parseFloat(formData.get('amount')),
            paymentMethod: formData.get('paymentMethod'),
            paymentStatus: formData.get('paymentStatus')
        };

        try {
            const url = this.currentPayment ?
                `${this.apiUrl}/${this.currentPayment.id}` :
                this.apiUrl;

            const method = this.currentPayment ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    ...this.getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(paymentData)
            });

            if (!response.ok) throw new Error('Failed to save payment');

            this.closeModal('paymentModal');
            this.loadPayments();
            this.showSuccess(this.currentPayment ? 'Payment updated successfully' : 'Payment recorded successfully');
        } catch (error) {
            console.error('Error saving payment:', error);
            this.showError('Failed to save payment');
        }
    }

    async editPayment(id) {
        try {
            const response = await fetch(`${this.apiUrl}/${id}`, {
                headers: this.getAuthHeaders()
            });

            const payment = await response.json();
            this.openPaymentModal(payment);
        } catch (error) {
            console.error('Error loading payment:', error);
            this.showError('Failed to load payment details');
        }
    }

    async viewPayment(id) {
        try {
            const response = await fetch(`${this.apiUrl}/${id}`, {
                headers: this.getAuthHeaders()
            });

            const payment = await response.json();
            this.showPaymentDetails(payment);
        } catch (error) {
            console.error('Error loading payment:', error);
            this.showError('Failed to load payment details');
        }
    }

    showPaymentDetails(payment) {
        const details = `
            Payment ID: ${payment.id}
            Date: ${this.formatDateTime(payment.paymentDate)}
            Amount: $${payment.amount?.toFixed(2)}
            Method: ${this.formatPaymentMethod(payment.paymentMethod)}
            Status: ${payment.paymentStatus}
            ${payment.invoice ? `Invoice ID: ${payment.invoice.id}` : 'No associated invoice'}
        `;
        alert(details);
    }

    async deletePayment(id) {
        if (!confirm('Are you sure you want to delete this payment?')) {
            return;
        }

        try {
            const response = await fetch(`${this.apiUrl}/${id}`, {
                method: 'DELETE',
                headers: this.getAuthHeaders()
            });

            if (!response.ok) throw new Error('Failed to delete payment');

            this.loadPayments();
            this.showSuccess('Payment deleted successfully');
        } catch (error) {
            console.error('Error deleting payment:', error);
            this.showError('Failed to delete payment');
        }
    }

    searchPayments() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        this.filterAndDisplayPayments();
    }

    filterPayments() {
        this.filterAndDisplayPayments();
    }

    filterAndDisplayPayments() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const statusFilter = document.getElementById('statusFilter').value;

        let filteredPayments = this.payments;

        // Apply search filter
        if (searchTerm) {
            filteredPayments = filteredPayments.filter(payment => {
                return payment.id.toString().includes(searchTerm) ||
                    payment.paymentMethod?.toLowerCase().includes(searchTerm) ||
                    payment.amount?.toString().includes(searchTerm);
            });
        }

        // Apply status filter
        if (statusFilter) {
            filteredPayments = filteredPayments.filter(payment =>
                payment.paymentStatus === statusFilter
            );
        }

        this.displayPayments(filteredPayments);
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
    window.paymentManager = new PaymentManager();
});