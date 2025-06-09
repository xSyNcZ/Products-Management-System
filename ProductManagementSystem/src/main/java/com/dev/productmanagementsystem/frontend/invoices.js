// Invoice Management JavaScript
class InvoiceManager {
    constructor() {
        this.apiUrl = '/api/invoices';
        this.ordersApiUrl = '/api/orders';
        this.paymentsApiUrl = '/api/payments';
        this.currentInvoice = null;
        this.userRole = this.getUserRole();
        this.init();
    }

    getUserRole() {
        const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
        return user.roles?.[0]?.name || 'USER';
    }

    init() {
        this.bindEvents();
        this.loadInvoices();
        this.checkPermissions();
    }

    checkPermissions() {
        const isAdmin = this.userRole === 'ADMIN';
        const createBtn = document.getElementById('createInvoiceBtn');

        if (!isAdmin) {
            createBtn.style.display = 'none';
        }
    }

    bindEvents() {
        // Create invoice button
        document.getElementById('createInvoiceBtn').addEventListener('click', () => {
            this.openInvoiceModal();
        });

        // Search functionality
        document.getElementById('searchBtn').addEventListener('click', () => {
            this.searchInvoices();
        });

        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchInvoices();
            }
        });

        // Modal events
        document.querySelector('#invoiceModal .close').addEventListener('click', () => {
            this.closeModal('invoiceModal');
        });

        document.getElementById('cancelBtn').addEventListener('click', () => {
            this.closeModal('invoiceModal');
        });

        document.querySelector('#invoiceDetailsModal .close').addEventListener('click', () => {
            this.closeModal('invoiceDetailsModal');
        });

        document.querySelector('.close-details').addEventListener('click', () => {
            this.closeModal('invoiceDetailsModal');
        });

        // Form submission
        document.getElementById('invoiceForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveInvoice();
        });

        // Order selection change
        document.getElementById('orderId').addEventListener('change', (e) => {
            this.calculateTotalAmount(e.target.value);
        });

        // Print invoice
        document.getElementById('printInvoiceBtn').addEventListener('click', () => {
            this.printInvoice();
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
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
        tbody.innerHTML = '';

        invoices.forEach(invoice => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${invoice.id}</td>
                <td>${this.formatDateTime(invoice.invoiceDate)}</td>
                <td>$${invoice.totalAmount?.toFixed(2) || '0.00'}</td>
                <td>${invoice.order?.id || 'N/A'}</td>
                <td>
                    <span class="status-badge ${invoice.payment?.paymentStatus?.toLowerCase() || 'pending'}">
                        ${invoice.payment?.paymentStatus || 'PENDING'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="invoiceManager.viewInvoice(${invoice.id})">
                        View
                    </button>
                    ${this.userRole === 'ADMIN' ? `
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
        this.currentInvoice = invoice;
        const modal = document.getElementById('invoiceModal');
        const title = document.getElementById('modalTitle');
        const form = document.getElementById('invoiceForm');

        title.textContent = invoice ? 'Edit Invoice' : 'Create Invoice';
        form.reset();

        // Load orders and payments
        await this.loadOrdersForSelect();
        await this.loadPaymentsForSelect();

        if (invoice) {
            document.getElementById('orderId').value = invoice.order?.id || '';
            document.getElementById('paymentId').value = invoice.payment?.id || '';
            document.getElementById('totalAmount').value = invoice.totalAmount || '';
        }

        modal.style.display = 'block';
    }

    async loadOrdersForSelect() {
        try {
            const response = await fetch(this.ordersApiUrl, {
                headers: this.getAuthHeaders()
            });

            const orders = await response.json();
            const select = document.getElementById('orderId');

            select.innerHTML = '<option value="">Select Order</option>';
            orders.forEach(order => {
                const option = document.createElement('option');
                option.value = order.id;
                option.textContent = `Order #${order.id} - ${order.user?.username || 'Unknown'}`;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading orders:', error);
        }
    }

    async loadPaymentsForSelect() {
        try {
            const response = await fetch(this.paymentsApiUrl, {
                headers: this.getAuthHeaders()
            });

            const payments = await response.json();
            const select = document.getElementById('paymentId');

            select.innerHTML = '<option value="">Select Payment</option>';
            payments.forEach(payment => {
                const option = document.createElement('option');
                option.value = payment.id;
                option.textContent = `Payment #${payment.id} - $${payment.amount?.toFixed(2)}`;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading payments:', error);
        }
    }

    async calculateTotalAmount(orderId) {
        if (!orderId) {
            document.getElementById('totalAmount').value = '';
            return;
        }

        try {
            const response = await fetch(`${this.ordersApiUrl}/${orderId}`, {
                headers: this.getAuthHeaders()
            });

            const order = await response.json();
            let total = 0;

            if (order.orderItems) {
                total = order.orderItems.reduce((sum, item) => {
                    return sum + (item.quantity * item.unitPrice);
                }, 0);
            }

            document.getElementById('totalAmount').value = total.toFixed(2);
        } catch (error) {
            console.error('Error calculating total:', error);
        }
    }

    async saveInvoice() {
        const formData = new FormData(document.getElementById('invoiceForm'));
        const invoiceData = {
            order: { id: parseInt(formData.get('orderId')) },
            totalAmount: parseFloat(formData.get('totalAmount'))
        };

        const paymentId = formData.get('paymentId');
        if (paymentId) {
            invoiceData.payment = { id: parseInt(paymentId) };
        }

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

            if (!response.ok) throw new Error('Failed to save invoice');

            this.closeModal('invoiceModal');
            this.loadInvoices();
            this.showSuccess(this.currentInvoice ? 'Invoice updated successfully' : 'Invoice created successfully');
        } catch (error) {
            console.error('Error saving invoice:', error);
            this.showError('Failed to save invoice');
        }
    }

    async viewInvoice(id) {
        try {
            const response = await fetch(`${this.apiUrl}/${id}`, {
                headers: this.getAuthHeaders()
            });

            const invoice = await response.json();
            this.displayInvoiceDetails(invoice);
        } catch (error) {
            console.error('Error loading invoice details:', error);
            this.showError('Failed to load invoice details');
        }
    }

    displayInvoiceDetails(invoice) {
        const content = document.getElementById('invoiceDetailsContent');
        const orderItems = invoice.order?.orderItems || [];

        content.innerHTML = `
            <div class="invoice-details">
                <div class="invoice-header">
                    <h3>Invoice #${invoice.id}</h3>
                    <p><strong>Date:</strong> ${this.formatDateTime(invoice.invoiceDate)}</p>
                    <p><strong>Order ID:</strong> ${invoice.order?.id || 'N/A'}</p>
                </div>
                
                <div class="customer-info">
                    <h4>Customer Information</h4>
                    <p><strong>Name:</strong> ${invoice.order?.user?.firstName || ''} ${invoice.order?.user?.lastName || ''}</p>
                    <p><strong>Email:</strong> ${invoice.order?.user?.email || 'N/A'}</p>
                    <p><strong>Username:</strong> ${invoice.order?.user?.username || 'N/A'}</p>
                </div>

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

                <div class="invoice-total">
                    <h3>Total: $${invoice.totalAmount?.toFixed(2) || '0.00'}</h3>
                </div>

                ${invoice.payment ? `
                    <div class="payment-info">
                        <h4>Payment Information</h4>
                        <p><strong>Payment Method:</strong> ${invoice.payment.paymentMethod}</p>
                        <p><strong>Payment Status:</strong> 
                            <span class="status-badge ${invoice.payment.paymentStatus.toLowerCase()}">
                                ${invoice.payment.paymentStatus}
                            </span>
                        </p>
                        <p><strong>Payment Date:</strong> ${this.formatDateTime(invoice.payment.paymentDate)}</p>
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
                        .customer-info, .order-items, .payment-info { margin-bottom: 20px; }
                        .items-table { width: 100%; border-collapse: collapse; }
                        .items-table th, .items-table td { 
                            border: 1px solid #ddd; padding: 8px; text-align: left; 
                        }
                        .items-table th { background-color: #f5f5f5; }
                        .invoice-total { text-align: right; margin-top: 20px; }
                        .status-badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; }
                        .status-badge.paid { background-color: #d4edda; color: #155724; }
                        .status-badge.pending { background-color: #fff3cd; color: #856404; }
                        .status-badge.failed { background-color: #f8d7da; color: #721c24; }
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

    searchInvoices() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const rows = document.querySelectorAll('#invoicesTableBody tr');

        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm) ? '' : 'none';
        });
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
        window.location.href = 'login.html';
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.invoiceManager = new InvoiceManager();
});