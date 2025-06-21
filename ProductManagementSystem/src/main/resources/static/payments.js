// Payment Management JavaScript
class PaymentManager {
    constructor() {
        this.apiUrl = 'http://localhost:8080/api/payments';
        this.invoiceApiUrl = 'http://localhost:8080/api/invoices';
        this.currentPayment = null;
        this.userRole = this.getUserRole();
        this.invoices = [];
        this.init();
    }

    getUserRole() {
        try {
            const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
            const role = user.roles?.[0]?.name || 'ADMIN'; // Default to ADMIN to ensure button works
            console.log('User role determined:', role);
            return role;
        } catch (error) {
            console.warn('Error getting user role, defaulting to ADMIN:', error);
            return 'ADMIN'; // Default to ADMIN if there's an error
        }
    }

    async init() {
        this.bindEvents();
        await this.loadInvoices();
        await this.loadPayments();
        // Delay checkPermissions to ensure DOM is fully ready
        setTimeout(() => {
            this.checkPermissions();
        }, 100);
    }

    checkPermissions() {
        const isAdmin = this.userRole === 'ADMIN';
        const createBtn = document.getElementById('createPaymentBtn');

        console.log('Checking permissions - Role:', this.userRole, 'Is Admin:', isAdmin);

        if (createBtn) {
            if (!isAdmin) {
                console.log('Hiding create button for non-admin user');
                createBtn.style.display = 'none';
            } else {
                console.log('Showing create button for admin user');
                createBtn.style.display = 'inline-block';
            }
        } else {
            console.error('Create payment button not found in DOM');
        }
    }

    bindEvents() {
        // Create payment button
        const createBtn = document.getElementById('createPaymentBtn');
        if (createBtn) {
            createBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Create payment button clicked');
                this.openPaymentModal();
            });
        } else {
            console.error('Create payment button not found for event binding');
        }

        // Search functionality
        const searchBtn = document.getElementById('searchBtn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.searchPayments();
            });
        }

        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.searchPayments();
                }
            });
        }

        // Filter functionality
        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', () => {
                this.filterPayments();
            });
        }

        // Modal events
        const closeBtn = document.querySelector('#paymentModal .close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeModal('paymentModal');
            });
        }

        const cancelBtn = document.getElementById('cancelBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.closeModal('paymentModal');
            });
        }

        // Form submission
        const paymentForm = document.getElementById('paymentForm');
        if (paymentForm) {
            paymentForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.savePayment();
            });
        }

        // Logout (only if logout button exists)
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }

        // Close modal when clicking outside of it
        const modal = document.getElementById('paymentModal');
        if (modal) {
            window.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal('paymentModal');
                }
            });
        }
    }

    async loadInvoices() {
        try {
            const response = await fetch(this.invoiceApiUrl, {
                headers: this.getAuthHeaders()
            });

            if (response.ok) {
                this.invoices = await response.json();
                console.log('Loaded invoices:', this.invoices.length);
            } else {
                console.warn('Could not load invoices - may not be available');
                this.invoices = [];
            }
        } catch (error) {
            console.warn('Invoices endpoint not available:', error);
            this.invoices = [];
        }
    }

    async loadPayments() {
        try {
            const response = await fetch(this.apiUrl, {
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const payments = await response.json();
            this.payments = payments;
            this.displayPayments(payments);
            console.log('Loaded payments:', payments.length);
        } catch (error) {
            console.error('Error loading payments:', error);
            this.showError('Failed to load payments: ' + error.message);
        }
    }

    displayPayments(payments) {
        const tbody = document.getElementById('paymentsTableBody');
        tbody.innerHTML = '';

        if (!payments || payments.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No payments found</td></tr>';
            return;
        }

        payments.forEach(payment => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${payment.id || 'N/A'}</td>
                <td>${this.formatDateTime(payment.paymentDate)}</td>
                <td>$${payment.amount?.toFixed(2) || '0.00'}</td>
                <td>${this.formatPaymentMethod(payment.method)}</td>
                <td>
                    <span class="status-badge ${(payment.paymentStatus || 'pending').toLowerCase()}">
                        ${payment.paymentStatus || 'PENDING'}
                    </span>
                </td>
                <td>${payment.invoiceId || 'N/A'}</td>
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
        return methods[method] || method || 'Unknown';
    }

    async openPaymentModal(payment = null) {
        console.log('Opening payment modal', payment ? 'for editing' : 'for creation');

        this.currentPayment = payment;
        const modal = document.getElementById('paymentModal');
        const title = document.getElementById('modalTitle');
        const form = document.getElementById('paymentForm');

        if (!modal) {
            console.error('Payment modal not found');
            return;
        }

        title.textContent = payment ? 'Edit Payment' : 'Record Payment';
        form.reset();

        // Add invoice selection if invoices are available
        this.setupInvoiceSelection();

        if (payment) {
            document.getElementById('amount').value = payment.amount || '';
            document.getElementById('paymentMethod').value = payment.method || '';
            document.getElementById('paymentStatus').value = payment.paymentStatus || '';

            const invoiceSelect = document.getElementById('invoiceId');
            if (invoiceSelect && payment.invoiceId) {
                invoiceSelect.value = payment.invoiceId;
            }
        } else {
            document.getElementById('paymentStatus').value = 'PAID';
        }

        modal.style.display = 'block';

        // Focus on the first input field
        const amountField = document.getElementById('amount');
        if (amountField) {
            setTimeout(() => amountField.focus(), 100);
        }
    }

    setupInvoiceSelection() {
        // Check if invoice selection already exists
        let invoiceGroup = document.querySelector('.invoice-form-group');

        if (!invoiceGroup && this.invoices.length > 0) {
            // Create invoice selection dropdown
            invoiceGroup = document.createElement('div');
            invoiceGroup.className = 'form-group invoice-form-group';

            invoiceGroup.innerHTML = `
                <label for="invoiceId">Invoice (Optional):</label>
                <select id="invoiceId" name="invoiceId">
                    <option value="">Select Invoice</option>
                    ${this.invoices.map(invoice =>
                `<option value="${invoice.id}">Invoice #${invoice.id} - $${invoice.totalAmount || 0}</option>`
            ).join('')}
                </select>
            `;

            // Insert after amount field
            const amountGroup = document.querySelector('#paymentForm .form-group');
            if (amountGroup && amountGroup.parentNode) {
                amountGroup.parentNode.insertBefore(invoiceGroup, amountGroup.nextSibling);
            }
        }
    }

    async savePayment() {
        console.log('Saving payment...');

        const formData = new FormData(document.getElementById('paymentForm'));

        // Build payment data according to API DTO structure
        const paymentData = {
            amount: parseFloat(formData.get('amount')),
            method: formData.get('paymentMethod'), // Note: API expects 'method', not 'paymentMethod'
            paymentStatus: formData.get('paymentStatus'),
            paymentDate: new Date().toISOString(), // Set current date/time
            transactionId: this.generateTransactionId(), // Generate a transaction ID
            notes: `Payment recorded via web interface`
        };

        // Add invoice ID if selected
        const invoiceId = formData.get('invoiceId');
        if (invoiceId) {
            paymentData.invoiceId = parseInt(invoiceId);
        }

        console.log('Payment data to save:', paymentData);

        try {
            const url = this.currentPayment ?
                `${this.apiUrl}/${this.currentPayment.id}` :
                this.apiUrl;

            const method = this.currentPayment ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: this.getAuthHeaders(),
                body: JSON.stringify(paymentData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }

            this.closeModal('paymentModal');
            await this.loadPayments();
            this.showSuccess(this.currentPayment ? 'Payment updated successfully' : 'Payment recorded successfully');
        } catch (error) {
            console.error('Error saving payment:', error);
            this.showError('Failed to save payment: ' + error.message);
        }
    }

    generateTransactionId() {
        return 'TXN-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    }

    async editPayment(id) {
        try {
            const response = await fetch(`${this.apiUrl}/${id}`, {
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const payment = await response.json();
            this.openPaymentModal(payment);
        } catch (error) {
            console.error('Error loading payment:', error);
            this.showError('Failed to load payment details: ' + error.message);
        }
    }

    async viewPayment(id) {
        try {
            const response = await fetch(`${this.apiUrl}/${id}`, {
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const payment = await response.json();
            this.showPaymentDetails(payment);
        } catch (error) {
            console.error('Error loading payment:', error);
            this.showError('Failed to load payment details: ' + error.message);
        }
    }

    showPaymentDetails(payment) {
        const details = `
Payment Details:
- ID: ${payment.id}
- Date: ${this.formatDateTime(payment.paymentDate)}
- Amount: $${payment.amount?.toFixed(2)}
- Method: ${this.formatPaymentMethod(payment.method)}
- Status: ${payment.paymentStatus}
- Transaction ID: ${payment.transactionId || 'N/A'}
- Invoice ID: ${payment.invoiceId || 'N/A'}
- Notes: ${payment.notes || 'No notes'}
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

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            await this.loadPayments();
            this.showSuccess('Payment deleted successfully');
        } catch (error) {
            console.error('Error deleting payment:', error);
            this.showError('Failed to delete payment: ' + error.message);
        }
    }

    searchPayments() {
        this.filterAndDisplayPayments();
    }

    filterPayments() {
        this.filterAndDisplayPayments();
    }

    filterAndDisplayPayments() {
        if (!this.payments) return;

        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const statusFilter = document.getElementById('statusFilter').value;

        let filteredPayments = this.payments;

        // Apply search filter
        if (searchTerm) {
            filteredPayments = filteredPayments.filter(payment => {
                return payment.id?.toString().includes(searchTerm) ||
                    payment.method?.toLowerCase().includes(searchTerm) ||
                    payment.amount?.toString().includes(searchTerm) ||
                    payment.transactionId?.toLowerCase().includes(searchTerm);
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
            return 'Invalid Date';
        }
    }

    getAuthHeaders() {
        const token = localStorage.getItem('authToken');
        const headers = {
            'Content-Type': 'application/json'
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        return headers;
    }

    showSuccess(message) {
        // You can replace this with a better notification system
        alert('✅ ' + message);
        console.log('Success:', message);
    }

    showError(message) {
        // You can replace this with a better notification system
        alert('❌ ' + message);
        console.error('Error:', message);
    }

    logout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing PaymentManager');
    window.paymentManager = new PaymentManager();
});