// Invoice Management JavaScript - Updated for Java API
class InvoiceManager {
    constructor() {
        this.apiUrl = 'http://localhost:8080/api/invoices';
        this.ordersApiUrl = 'http://localhost:8080/api/orders';
        this.paymentsApiUrl = 'http://localhost:8080/api/payments';
        this.currentInvoice = null;
        this.userRole = this.getUserRole();
        this.init();
    }

    getUserRole() {
        // Get userRoles from localStorage directly (as stored by app.js)
        const userRoles = JSON.parse(localStorage.getItem('userRoles') || '[]');
        console.log('User roles from localStorage:', userRoles); // Debug log

        // Return the first role if available
        if (userRoles && userRoles.length > 0) {
            return userRoles[0];
        }

        console.log('No valid role found, defaulting to USER');
        return 'USER';
    }

    init() {
        // Add a small delay to ensure DOM is fully loaded
        setTimeout(() => {
            this.bindEvents();
            this.loadInvoices();
            this.checkPermissions();
        }, 100);
    }

    checkPermissions() {
        const allowedRoles = ['ADMIN', 'MANAGER', 'ACCOUNTANT'];
        const hasPermission = allowedRoles.includes(this.userRole);
        console.log('Current user role:', this.userRole); // Debug log
        console.log('Has permission:', hasPermission); // Debug log

        const createBtn = document.getElementById('createInvoiceBtn');

        if (createBtn) {
            if (hasPermission) {
                createBtn.style.display = 'inline-block'; // Changed from 'block' to 'inline-block'
                createBtn.disabled = false;
            } else {
                createBtn.style.display = 'none'; // Hide for regular users
            }
        } else {
            console.error('Create invoice button not found in DOM');
        }
    }

    bindEvents() {
        // Create invoice button - with better error handling
        const createBtn = document.getElementById('createInvoiceBtn');
        if (createBtn) {
            console.log('Create invoice button found, binding event'); // Debug log

            // Remove any existing event listeners
            createBtn.removeEventListener('click', this.handleCreateInvoice);

            // Bind the event with proper context
            this.handleCreateInvoice = this.handleCreateInvoice.bind(this);
            createBtn.addEventListener('click', this.handleCreateInvoice);

            console.log('Event listener bound successfully'); // Debug log
        } else {
            console.error('Create invoice button not found');
            // Try to find it again after a short delay
            setTimeout(() => {
                const retryBtn = document.getElementById('createInvoiceBtn');
                if (retryBtn) {
                    console.log('Found create button on retry');
                    this.handleCreateInvoice = this.handleCreateInvoice.bind(this);
                    retryBtn.addEventListener('click', this.handleCreateInvoice);
                }
            }, 500);
        }

        // Search functionality
        const searchBtn = document.getElementById('searchBtn');
        const searchInput = document.getElementById('searchInput');

        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.searchInvoices();
            });
        }

        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.searchInvoices();
                }
            });
        }

        // Modal events
        this.bindModalEvents();

        // Form submission
        const invoiceForm = document.getElementById('invoiceForm');
        if (invoiceForm) {
            invoiceForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveInvoice();
            });
        }

        // Order selection change
        const orderSelect = document.getElementById('orderId');
        if (orderSelect) {
            orderSelect.addEventListener('change', (e) => {
                this.calculateTotalAmount(e.target.value);
            });
        }

        // Print invoice
        const printBtn = document.getElementById('printInvoiceBtn');
        if (printBtn) {
            printBtn.addEventListener('click', () => {
                this.printInvoice();
            });
        }

        // Logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }
    }

    // Separate method for handling create invoice button click
    handleCreateInvoice(event) {
        console.log('Create invoice button clicked'); // Debug log
        event.preventDefault();
        event.stopPropagation();

        try {
            this.openInvoiceModal();
        } catch (error) {
            console.error('Error opening invoice modal:', error);
            this.showError('Failed to open invoice creation form');
        }
    }

    // Separate method for binding modal events
    bindModalEvents() {
        const invoiceModalClose = document.querySelector('#invoiceModal .close');
        const cancelBtn = document.getElementById('cancelBtn');
        const detailsModalClose = document.querySelector('#invoiceDetailsModal .close');
        const closeDetailsBtn = document.querySelector('.close-details');

        if (invoiceModalClose) {
            invoiceModalClose.addEventListener('click', () => {
                this.closeModal('invoiceModal');
            });
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.closeModal('invoiceModal');
            });
        }

        if (detailsModalClose) {
            detailsModalClose.addEventListener('click', () => {
                this.closeModal('invoiceDetailsModal');
            });
        }

        if (closeDetailsBtn) {
            closeDetailsBtn.addEventListener('click', () => {
                this.closeModal('invoiceDetailsModal');
            });
        }

        // Close modal when clicking outside
        window.addEventListener('click', (event) => {
            const invoiceModal = document.getElementById('invoiceModal');
            const detailsModal = document.getElementById('invoiceDetailsModal');

            if (event.target === invoiceModal) {
                this.closeModal('invoiceModal');
            }
            if (event.target === detailsModal) {
                this.closeModal('invoiceDetailsModal');
            }
        });
    }

    async loadInvoices() {
        try {
            const response = await fetch(this.apiUrl, {
                headers: this.getAuthHeaders()
            });

            if (!response.ok) throw new Error('Failed to load invoices');

            const invoices = await response.json();
            this.displayInvoices(invoices);
        } catch (error) {
            console.error('Error loading invoices:', error);
            this.showError('Failed to load invoices');
        }
    }

    displayInvoices(invoices) {
        const tbody = document.getElementById('invoicesTableBody');
        if (!tbody) {
            console.error('Invoice table body not found');
            return;
        }

        tbody.innerHTML = '';

        // Check if user has admin/manager permissions
        const allowedRoles = ['ADMIN', 'MANAGER', 'ACCOUNTANT'];
        const hasEditPermissions = allowedRoles.includes(this.userRole);

        invoices.forEach(invoice => {
            const row = document.createElement('tr');
            // Get the first payment status if payments array exists
            const firstPayment = invoice.payments && invoice.payments.length > 0 ? invoice.payments[0] : null;
            const paymentStatus = firstPayment?.paymentStatus || invoice.paymentStatus || 'PENDING';

            row.innerHTML = `
            <td>${invoice.id}</td>
            <td>${this.formatDateTime(invoice.issueDate)}</td>
            <td>${invoice.totalAmount?.toFixed(2) || '0.00'}</td>
            <td>${invoice.orderId || 'N/A'}</td>
            <td>
                <span class="status-badge ${paymentStatus.toLowerCase()}">
                    ${paymentStatus}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-info" onclick="invoiceManager.viewInvoice(${invoice.id})">
                    View
                </button>
                ${hasEditPermissions ? `
                    <button class="btn btn-sm btn-warning" onclick="invoiceManager.editInvoice(${invoice.id})">
                        Edit
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="invoiceManager.deleteInvoice(${invoice.id})">
                        Delete
                    </button>
                ` : ''}
            </td>
        `;
            tbody.appendChild(row);
        });
    }

    async openInvoiceModal(invoice = null) {
        console.log('Opening invoice modal', invoice ? 'for edit' : 'for create'); // Debug log

        this.currentInvoice = invoice;
        const modal = document.getElementById('invoiceModal');
        const title = document.getElementById('modalTitle');
        const form = document.getElementById('invoiceForm');

        if (!modal || !title || !form) {
            console.error('Modal elements not found');
            this.showError('Modal elements not found');
            return;
        }

        title.textContent = invoice ? 'Edit Invoice' : 'Create Invoice';
        form.reset();

        try {
            // Load orders and payments for select
            await this.loadOrdersForSelect();
            await this.loadPaymentsForSelect();

            if (invoice) {
                // For editing, populate the form with existing invoice data
                const orderSelect = document.getElementById('orderId');
                const paymentSelect = document.getElementById('paymentId');
                const totalAmountInput = document.getElementById('totalAmount');

                if (orderSelect) orderSelect.value = invoice.orderId || '';
                if (paymentSelect) paymentSelect.value = invoice.payments && invoice.payments[0] ? invoice.payments[0].id : '';
                if (totalAmountInput) totalAmountInput.value = invoice.totalAmount || '';
            }

            modal.style.display = 'block';
            console.log('Modal opened successfully'); // Debug log
        } catch (error) {
            console.error('Error opening modal:', error);
            this.showError('Failed to open invoice form');
        }
    }

    async editInvoice(id) {
        try {
            const response = await fetch(`${this.apiUrl}/${id}`, {
                headers: this.getAuthHeaders()
            });

            if (!response.ok) throw new Error('Failed to load invoice');

            const invoice = await response.json();
            this.openInvoiceModal(invoice);
        } catch (error) {
            console.error('Error loading invoice for edit:', error);
            this.showError('Failed to load invoice for editing');
        }
    }

    async loadOrdersForSelect() {
        try {
            const response = await fetch(this.ordersApiUrl, {
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                console.warn('Failed to load orders, using empty list');
                return;
            }

            const orders = await response.json();
            const select = document.getElementById('orderId');

            if (select) {
                select.innerHTML = '<option value="">Select Order</option>';
                orders.forEach(order => {
                    const option = document.createElement('option');
                    option.value = order.id;
                    option.textContent = `Order #${order.id} - ${order.user?.username || 'Unknown'}`;
                    select.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error loading orders:', error);
        }
    }

    async loadPaymentsForSelect() {
        try {
            const response = await fetch(this.paymentsApiUrl, {
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                console.warn('Failed to load payments, using empty list');
                return;
            }

            const payments = await response.json();
            const select = document.getElementById('paymentId');

            if (select) {
                select.innerHTML = '<option value="">Select Payment</option>';
                payments.forEach(payment => {
                    const option = document.createElement('option');
                    option.value = payment.id;
                    option.textContent = `Payment #${payment.id} - $${payment.amount?.toFixed(2)}`;
                    select.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error loading payments:', error);
        }
    }

    async calculateTotalAmount(orderId) {
        if (!orderId) {
            const totalAmountInput = document.getElementById('totalAmount');
            if (totalAmountInput) totalAmountInput.value = '';
            return;
        }

        try {
            const response = await fetch(`${this.ordersApiUrl}/${orderId}`, {
                headers: this.getAuthHeaders()
            });

            if (response.ok) {
                const order = await response.json();
                let total = 0;

                if (order.orderItems) {
                    total = order.orderItems.reduce((sum, item) => {
                        return sum + (item.quantity * item.unitPrice);
                    }, 0);
                } else if (order.totalAmount) {
                    // If order already has totalAmount calculated
                    total = order.totalAmount;
                }

                const totalAmountInput = document.getElementById('totalAmount');
                if (totalAmountInput) {
                    totalAmountInput.value = total.toFixed(2);
                }
            }
        } catch (error) {
            console.error('Error calculating total:', error);
        }
    }

    async saveInvoice() {
        const form = document.getElementById('invoiceForm');
        if (!form) {
            this.showError('Form not found');
            return;
        }

        const formData = new FormData(form);
        const invoiceData = {
            orderId: parseInt(formData.get('orderId')),
            // Generate a simple invoice number if creating new invoice
            invoiceNumber: this.currentInvoice?.invoiceNumber || `INV-${Date.now()}`,
            // Set due date to 30 days from now if not specified
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            tax: 0, // Default tax rate
            paymentStatus: 'PENDING'
        };

        try {
            const url = this.currentInvoice ?
                `${this.apiUrl}/${this.currentInvoice.id}` :
                this.apiUrl;

            const method = this.currentInvoice ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    ...this.getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(invoiceData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to save invoice: ${errorText}`);
            }

            this.closeModal('invoiceModal');
            this.loadInvoices();
            this.showSuccess(this.currentInvoice ? 'Invoice updated successfully' : 'Invoice created successfully');
        } catch (error) {
            console.error('Error saving invoice:', error);
            this.showError(error.message || 'Failed to save invoice');
        }
    }

    async viewInvoice(id) {
        try {
            const response = await fetch(`${this.apiUrl}/${id}`, {
                headers: this.getAuthHeaders()
            });

            if (!response.ok) throw new Error('Failed to load invoice');

            const invoice = await response.json();

            // Also fetch the order details to get order items
            let orderDetails = null;
            if (invoice.orderId) {
                try {
                    const orderResponse = await fetch(`${this.ordersApiUrl}/${invoice.orderId}`, {
                        headers: this.getAuthHeaders()
                    });
                    if (orderResponse.ok) {
                        orderDetails = await orderResponse.json();
                    }
                } catch (orderError) {
                    console.warn('Could not load order details:', orderError);
                }
            }

            this.displayInvoiceDetails(invoice, orderDetails);
        } catch (error) {
            console.error('Error loading invoice details:', error);
            this.showError('Failed to load invoice details');
        }
    }

    displayInvoiceDetails(invoice, orderDetails) {
        const content = document.getElementById('invoiceDetailsContent');
        if (!content) {
            console.error('Invoice details content element not found');
            return;
        }

        const orderItems = orderDetails?.orderItems || [];
        const payments = invoice.payments || [];

        content.innerHTML = `
            <div class="invoice-details">
                <div class="invoice-header">
                    <h3>Invoice #${invoice.invoiceNumber || invoice.id}</h3>
                    <p><strong>Issue Date:</strong> ${this.formatDateTime(invoice.issueDate)}</p>
                    <p><strong>Due Date:</strong> ${this.formatDateTime(invoice.dueDate)}</p>
                    <p><strong>Order ID:</strong> ${invoice.orderId || 'N/A'}</p>
                </div>
                
                ${orderDetails?.user ? `
                    <div class="customer-info">
                        <h4>Customer Information</h4>
                        <p><strong>Name:</strong> ${orderDetails.user.firstName || ''} ${orderDetails.user.lastName || ''}</p>
                        <p><strong>Email:</strong> ${orderDetails.user.email || 'N/A'}</p>
                        <p><strong>Username:</strong> ${orderDetails.user.username || 'N/A'}</p>
                    </div>
                ` : ''}

                ${orderItems.length > 0 ? `
                    <div class="order-items">
                        <h4>Order Items</h4>
                        <table class="items-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Quantity</th>
                                    <th>Unit Price</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${orderItems.map(item => `
                                    <tr>
                                        <td>${item.product?.name || 'Unknown Product'}</td>
                                        <td>${item.quantity}</td>
                                        <td>$${item.unitPrice?.toFixed(2)}</td>
                                        <td>$${(item.quantity * item.unitPrice).toFixed(2)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                ` : ''}

                <div class="invoice-summary">
                    <p><strong>Tax Rate:</strong> ${invoice.tax || 0}%</p>
                    <h3>Total Amount: $${invoice.totalAmount?.toFixed(2) || '0.00'}</h3>
                    <p><strong>Payment Status:</strong> 
                        <span class="status-badge ${invoice.paymentStatus?.toLowerCase() || 'pending'}">
                            ${invoice.paymentStatus || 'PENDING'}
                        </span>
                    </p>
                </div>

                ${payments.length > 0 ? `
                    <div class="payment-info">
                        <h4>Payment Information</h4>
                        ${payments.map(payment => `
                            <div class="payment-item">
                                <p><strong>Payment #${payment.id}</strong></p>
                                <p><strong>Amount:</strong> $${payment.amount?.toFixed(2)}</p>
                                <p><strong>Method:</strong> ${payment.method}</p>
                                <p><strong>Status:</strong> 
                                    <span class="status-badge ${payment.paymentStatus?.toLowerCase()}">
                                        ${payment.paymentStatus}
                                    </span>
                                </p>
                                <p><strong>Date:</strong> ${this.formatDateTime(payment.paymentDate)}</p>
                                ${payment.transactionId ? `<p><strong>Transaction ID:</strong> ${payment.transactionId}</p>` : ''}
                                ${payment.notes ? `<p><strong>Notes:</strong> ${payment.notes}</p>` : ''}
                                <hr>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;

        document.getElementById('invoiceDetailsModal').style.display = 'block';
    }

    printInvoice() {
        const printContent = document.getElementById('invoiceDetailsContent').innerHTML;
        const printWindow = window.open('', '_blank');

        printWindow.document.write(`
            <html>
                <head>
                    <title>Invoice</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        .invoice-details { max-width: 800px; margin: 0 auto; }
                        .invoice-header { text-align: center; margin-bottom: 30px; }
                        .customer-info, .order-items, .payment-info, .invoice-summary { margin-bottom: 20px; }
                        .items-table { width: 100%; border-collapse: collapse; }
                        .items-table th, .items-table td { 
                            border: 1px solid #ddd; padding: 8px; text-align: left; 
                        }
                        .items-table th { background-color: #f5f5f5; }
                        .invoice-summary { text-align: right; margin-top: 20px; }
                        .status-badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; }
                        .status-badge.paid { background-color: #d4edda; color: #155724; }
                        .status-badge.pending { background-color: #fff3cd; color: #856404; }
                        .status-badge.failed { background-color: #f8d7da; color: #721c24; }
                        .payment-item { margin-bottom: 15px; }
                        hr { margin: 10px 0; }
                    </style>
                </head>
                <body>
                    ${printContent}
                </body>
            </html>
        `);

        printWindow.document.close();
        printWindow.print();
    }

    async deleteInvoice(id) {
        if (!confirm('Are you sure you want to delete this invoice?')) {
            return;
        }

        try {
            const response = await fetch(`${this.apiUrl}/${id}`, {
                method: 'DELETE',
                headers: this.getAuthHeaders()
            });

            if (!response.ok) throw new Error('Failed to delete invoice');

            this.loadInvoices();
            this.showSuccess('Invoice deleted successfully');
        } catch (error) {
            console.error('Error deleting invoice:', error);
            this.showError('Failed to delete invoice');
        }
    }

    // Additional methods for specific API endpoints
    async getInvoicesByStatus(status) {
        try {
            const response = await fetch(`${this.apiUrl}/status/${status}`, {
                headers: this.getAuthHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('Error fetching invoices by status:', error);
            return [];
        }
    }

    async getOverdueInvoices() {
        try {
            const response = await fetch(`${this.apiUrl}/overdue`, {
                headers: this.getAuthHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('Error fetching overdue invoices:', error);
            return [];
        }
    }

    async getInvoicesByCustomer(customerId) {
        try {
            const response = await fetch(`${this.apiUrl}/customer/${customerId}`, {
                headers: this.getAuthHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('Error fetching invoices by customer:', error);
            return [];
        }
    }

    async getTotalAmountByCustomer(customerId) {
        try {
            const response = await fetch(`${this.apiUrl}/total/${customerId}`, {
                headers: this.getAuthHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('Error fetching total amount by customer:', error);
            return 0;
        }
    }

    searchInvoices() {
        const searchInput = document.getElementById('searchInput');
        if (!searchInput) return;

        const searchTerm = searchInput.value.toLowerCase();
        const rows = document.querySelectorAll('#invoicesTableBody tr');

        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }

    formatDateTime(dateString) {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString();
    }

    getAuthHeaders() {
        const token = localStorage.getItem('authToken');
        return token ? {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        } : {
            'Content-Type': 'application/json'
        };
    }

    showSuccess(message) {
        // Implement toast notification or alert
        alert(message);
    }

    showError(message) {
        // Implement toast notification or alert
        alert(message);
    }

    logout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('userRoles');
        window.location.href = 'login.html';
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing InvoiceManager'); // Debug log
    window.invoiceManager = new InvoiceManager();
});