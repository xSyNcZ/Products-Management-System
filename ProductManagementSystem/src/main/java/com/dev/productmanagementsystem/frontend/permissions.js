// permissions.js - Defines all available permissions in the Product Management System

const PERMISSIONS = {
    // User Management Permissions
    USER_CREATE: 'user:create',
    USER_READ: 'user:read',
    USER_UPDATE: 'user:update',
    USER_DELETE: 'user:delete',
    USER_LIST: 'user:list',
    USER_MANAGE_ROLES: 'user:manage_roles',

    // Role Management Permissions
    ROLE_CREATE: 'role:create',
    ROLE_READ: 'role:read',
    ROLE_UPDATE: 'role:update',
    ROLE_DELETE: 'role:delete',
    ROLE_LIST: 'role:list',
    ROLE_ASSIGN_PERMISSIONS: 'role:assign_permissions',

    // Permission Management Permissions
    PERMISSION_CREATE: 'permission:create',
    PERMISSION_READ: 'permission:read',
    PERMISSION_UPDATE: 'permission:update',
    PERMISSION_DELETE: 'permission:delete',
    PERMISSION_LIST: 'permission:list',

    // Product Management Permissions
    PRODUCT_CREATE: 'product:create',
    PRODUCT_READ: 'product:read',
    PRODUCT_UPDATE: 'product:update',
    PRODUCT_DELETE: 'product:delete',
    PRODUCT_LIST: 'product:list',
    PRODUCT_IMPORT: 'product:import',
    PRODUCT_EXPORT: 'product:export',

    // Category Management Permissions
    CATEGORY_CREATE: 'category:create',
    CATEGORY_READ: 'category:read',
    CATEGORY_UPDATE: 'category:update',
    CATEGORY_DELETE: 'category:delete',
    CATEGORY_LIST: 'category:list',

    // Order Management Permissions
    ORDER_CREATE: 'order:create',
    ORDER_READ: 'order:read',
    ORDER_UPDATE: 'order:update',
    ORDER_DELETE: 'order:delete',
    ORDER_LIST: 'order:list',
    ORDER_CANCEL: 'order:cancel',
    ORDER_FULFILL: 'order:fulfill',
    ORDER_VIEW_ALL: 'order:view_all', // View orders from all users
    ORDER_VIEW_OWN: 'order:view_own',  // View only own orders

    // Order Item Permissions
    ORDER_ITEM_CREATE: 'order_item:create',
    ORDER_ITEM_READ: 'order_item:read',
    ORDER_ITEM_UPDATE: 'order_item:update',
    ORDER_ITEM_DELETE: 'order_item:delete',

    // Payment Management Permissions
    PAYMENT_CREATE: 'payment:create',
    PAYMENT_READ: 'payment:read',
    PAYMENT_UPDATE: 'payment:update',
    PAYMENT_DELETE: 'payment:delete',
    PAYMENT_LIST: 'payment:list',
    PAYMENT_PROCESS: 'payment:process',
    PAYMENT_REFUND: 'payment:refund',
    PAYMENT_VIEW_ALL: 'payment:view_all',

    // Invoice Management Permissions
    INVOICE_CREATE: 'invoice:create',
    INVOICE_READ: 'invoice:read',
    INVOICE_UPDATE: 'invoice:update',
    INVOICE_DELETE: 'invoice:delete',
    INVOICE_LIST: 'invoice:list',
    INVOICE_GENERATE: 'invoice:generate',
    INVOICE_DOWNLOAD: 'invoice:download',

    // Warehouse Management Permissions
    WAREHOUSE_CREATE: 'warehouse:create',
    WAREHOUSE_READ: 'warehouse:read',
    WAREHOUSE_UPDATE: 'warehouse:update',
    WAREHOUSE_DELETE: 'warehouse:delete',
    WAREHOUSE_LIST: 'warehouse:list',

    // Stock Movement Permissions
    STOCK_CREATE: 'stock:create',
    STOCK_READ: 'stock:read',
    STOCK_UPDATE: 'stock:update',
    STOCK_DELETE: 'stock:delete',
    STOCK_LIST: 'stock:list',
    STOCK_ADJUST: 'stock:adjust',
    STOCK_TRANSFER: 'stock:transfer',
    STOCK_VIEW_HISTORY: 'stock:view_history',

    // Address Management Permissions
    ADDRESS_CREATE: 'address:create',
    ADDRESS_READ: 'address:read',
    ADDRESS_UPDATE: 'address:update',
    ADDRESS_DELETE: 'address:delete',

    // System Administration Permissions
    SYSTEM_ADMIN: 'system:admin',
    SYSTEM_CONFIG: 'system:config',
    SYSTEM_BACKUP: 'system:backup',
    SYSTEM_RESTORE: 'system:restore',
    SYSTEM_LOGS: 'system:logs',

    // Reporting Permissions
    REPORT_SALES: 'report:sales',
    REPORT_INVENTORY: 'report:inventory',
    REPORT_USERS: 'report:users',
    REPORT_FINANCIAL: 'report:financial',
    REPORT_EXPORT: 'report:export'
};

// Permission Groups for easier role assignment
const PERMISSION_GROUPS = {
    // Customer permissions - basic user actions
    CUSTOMER: [
        PERMISSIONS.PRODUCT_READ,
        PERMISSIONS.PRODUCT_LIST,
        PERMISSIONS.CATEGORY_READ,
        PERMISSIONS.CATEGORY_LIST,
        PERMISSIONS.ORDER_CREATE,
        PERMISSIONS.ORDER_VIEW_OWN,
        PERMISSIONS.ORDER_CANCEL,
        PERMISSIONS.PAYMENT_CREATE,
        PERMISSIONS.INVOICE_READ,
        PERMISSIONS.INVOICE_DOWNLOAD,
        PERMISSIONS.ADDRESS_CREATE,
        PERMISSIONS.ADDRESS_READ,
        PERMISSIONS.ADDRESS_UPDATE,
        PERMISSIONS.ADDRESS_DELETE
    ],

    // Sales Staff permissions
    SALES_STAFF: [
        ...PERMISSION_GROUPS.CUSTOMER,
        PERMISSIONS.ORDER_READ,
        PERMISSIONS.ORDER_LIST,
        PERMISSIONS.ORDER_UPDATE,
        PERMISSIONS.ORDER_FULFILL,
        PERMISSIONS.PAYMENT_READ,
        PERMISSIONS.PAYMENT_LIST,
        PERMISSIONS.PAYMENT_PROCESS,
        PERMISSIONS.INVOICE_CREATE,
        PERMISSIONS.INVOICE_LIST,
        PERMISSIONS.USER_READ,
        PERMISSIONS.USER_LIST
    ],

    // Inventory Manager permissions
    INVENTORY_MANAGER: [
        PERMISSIONS.PRODUCT_CREATE,
        PERMISSIONS.PRODUCT_READ,
        PERMISSIONS.PRODUCT_UPDATE,
        PERMISSIONS.PRODUCT_DELETE,
        PERMISSIONS.PRODUCT_LIST,
        PERMISSIONS.PRODUCT_IMPORT,
        PERMISSIONS.PRODUCT_EXPORT,
        PERMISSIONS.CATEGORY_CREATE,
        PERMISSIONS.CATEGORY_READ,
        PERMISSIONS.CATEGORY_UPDATE,
        PERMISSIONS.CATEGORY_DELETE,
        PERMISSIONS.CATEGORY_LIST,
        PERMISSIONS.WAREHOUSE_CREATE,
        PERMISSIONS.WAREHOUSE_READ,
        PERMISSIONS.WAREHOUSE_UPDATE,
        PERMISSIONS.WAREHOUSE_DELETE,
        PERMISSIONS.WAREHOUSE_LIST,
        PERMISSIONS.STOCK_CREATE,
        PERMISSIONS.STOCK_READ,
        PERMISSIONS.STOCK_UPDATE,
        PERMISSIONS.STOCK_DELETE,
        PERMISSIONS.STOCK_LIST,
        PERMISSIONS.STOCK_ADJUST,
        PERMISSIONS.STOCK_TRANSFER,
        PERMISSIONS.STOCK_VIEW_HISTORY,
        PERMISSIONS.REPORT_INVENTORY
    ],

    // Manager permissions
    MANAGER: [
        ...PERMISSION_GROUPS.SALES_STAFF,
        ...PERMISSION_GROUPS.INVENTORY_MANAGER,
        PERMISSIONS.ORDER_VIEW_ALL,
        PERMISSIONS.PAYMENT_VIEW_ALL,
        PERMISSIONS.PAYMENT_REFUND,
        PERMISSIONS.USER_CREATE,
        PERMISSIONS.USER_UPDATE,
        PERMISSIONS.REPORT_SALES,
        PERMISSIONS.REPORT_FINANCIAL,
        PERMISSIONS.REPORT_USERS,
        PERMISSIONS.REPORT_EXPORT
    ],

    // Administrator permissions - full access
    ADMIN: [
        ...Object.values(PERMISSIONS)
    ]
};

// Helper functions for permission checking
const PermissionUtils = {
    /**
     * Check if a user has a specific permission
     * @param {Array} userPermissions - Array of user's permissions
     * @param {string} requiredPermission - Permission to check
     * @returns {boolean}
     */
    hasPermission: (userPermissions, requiredPermission) => {
        return userPermissions.includes(requiredPermission) ||
            userPermissions.includes(PERMISSIONS.SYSTEM_ADMIN);
    },

    /**
     * Check if a user has any of the specified permissions
     * @param {Array} userPermissions - Array of user's permissions
     * @param {Array} requiredPermissions - Array of permissions to check
     * @returns {boolean}
     */
    hasAnyPermission: (userPermissions, requiredPermissions) => {
        return requiredPermissions.some(permission =>
            PermissionUtils.hasPermission(userPermissions, permission)
        );
    },

    /**
     * Check if a user has all of the specified permissions
     * @param {Array} userPermissions - Array of user's permissions
     * @param {Array} requiredPermissions - Array of permissions to check
     * @returns {boolean}
     */
    hasAllPermissions: (userPermissions, requiredPermissions) => {
        return requiredPermissions.every(permission =>
            PermissionUtils.hasPermission(userPermissions, permission)
        );
    },

    /**
     * Get permissions for a specific role group
     * @param {string} roleGroup - Role group name
     * @returns {Array}
     */
    getPermissionsForRole: (roleGroup) => {
        return PERMISSION_GROUPS[roleGroup.toUpperCase()] || [];
    },

    /**
     * Filter permissions based on resource type
     * @param {string} resource - Resource type (e.g., 'product', 'order')
     * @returns {Array}
     */
    getPermissionsByResource: (resource) => {
        return Object.values(PERMISSIONS).filter(permission =>
            permission.startsWith(resource.toLowerCase() + ':')
        );
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        PERMISSIONS,
        PERMISSION_GROUPS,
        PermissionUtils
    };
}

// For browser environments
if (typeof window !== 'undefined') {
    window.ProductManagementPermissions = {
        PERMISSIONS,
        PERMISSION_GROUPS,
        PermissionUtils
    };
}