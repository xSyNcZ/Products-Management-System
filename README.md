# Products Management System (PMS)

## Overview

The Products Management System (PMS) is a comprehensive web-based application designed to efficiently manage products, warehouses, orders, and invoices. It provides businesses with a centralized platform for inventory tracking, order processing, and financial management, integrating data from multiple warehouses and offering real-time insights into stock levels and order fulfillment statuses.

## Problem Statement

Many businesses struggle with inefficient inventory management, leading to:
- Overstocking and stockouts
- Revenue loss due to poor inventory control
- Manual tracking systems creating inefficiencies
- Disparate software solutions
- Challenges managing large quantities of stock across multiple warehouses

## Solution Objectives

- **Automate inventory management** through a centralized platform
- **Streamline order processing** with a structured workflow
- **Generate financial documents** such as invoices automatically
- **Enhance decision-making** via analytics dashboards
- **Implement role-based access control** for secure data access

## Technology Stack

- **Database**: MySQL
- **Backend**: Spring Framework + Hibernate
- **Frontend**: HTML, CSS, JavaScript
- **Build Tool**: Maven
- **API Documentation**: Swagger
- **Authentication**: JWT (JSON Web Token)
- **Security**: BCrypt password encryption

## Architecture

The system follows a standard layered architecture:

- **Presentation Layer**: REST API endpoints exposed via Spring MVC controllers
- **Business Logic Layer**: Service components implementing business rules
- **Data Access Layer**: Repository interfaces extending Spring Data JPA
- **Data Layer**: Entity classes mapped to database tables via Hibernate

## Key Features

### Core Functionality
- User and role management with fine-grained permissions
- Product catalog with categorization and multi-warehouse inventory tracking
- Order management with approval workflow and status tracking
- Invoice generation and payment processing
- Stock movement tracking between warehouses
- Reporting and analytics dashboard

### Security Features
- JWT authentication and authorization
- Role-based access control (RBAC)
- Password encryption using BCrypt
- HTTPS support for secure communication
- Input validation and sanitization
- Protection against common web vulnerabilities (XSS, CSRF, SQL Injection)

## Project Structure

```
products-management-system/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/
│   │   │       └── pms/
│   │   │           ├── ProductsManagementSystemApplication.java
│   │   │           ├── entities/
│   │   │           ├── enums/
│   │   │           ├── dto/
│   │   │           ├── repositories/
│   │   │           ├── services/
│   │   │           ├── controllers/
│   │   │           └── exceptions/
│   │   └── resources/
│   │       ├── application.properties
│   │       └── static/
│   └── test/
│       └── java/
│           └── com/
│               └── pms/
│                   ├── controller/
│                   ├── service/
│                   └── repository/
└── pom.xml
```

## API Endpoints

### User Management
- `GET /api/users` - List all users (requires admin permission)
- `GET /api/users/{id}` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Delete user
- `GET /api/users/roles` - List all roles

### Authentication
- `POST /api/auth/login` - Authenticate user
- `POST /api/auth/refresh` - Refresh authentication token

### Product Management
- `GET /api/products` - List all products
- `GET /api/products/{id}` - Get product by ID
- `POST /api/products` - Create new product
- `PUT /api/products/{id}` - Update product
- `DELETE /api/products/{id}` - Delete product
- `GET /api/products/categories` - List all categories
- `GET /api/products/stock` - Get stock levels across warehouses

### Warehouse Management
- `GET /api/warehouses` - List all warehouses
- `GET /api/warehouses/{id}` - Get warehouse by ID
- `POST /api/warehouses` - Create new warehouse
- `PUT /api/warehouses/{id}` - Update warehouse
- `DELETE /api/warehouses/{id}` - Delete warehouse
- `GET /api/warehouses/{id}/stock` - Get stock levels in warehouse

### Order Management
- `GET /api/orders` - List all orders
- `GET /api/orders/{id}` - Get order by ID
- `POST /api/orders` - Create new order
- `PUT /api/orders/{id}` - Update order
- `DELETE /api/orders/{id}` - Delete order
- `PUT /api/orders/{id}/status` - Update order status
- `GET /api/orders/{id}/items` - Get order items

### Invoice Management
- `GET /api/invoices` - List all invoices
- `GET /api/invoices/{id}` - Get invoice by ID
- `POST /api/invoices` - Create new invoice
- `PUT /api/invoices/{id}` - Update invoice
- `DELETE /api/invoices/{id}` - Delete invoice
- `GET /api/invoices/{id}/payments` - Get invoice payments
- `POST /api/invoices/{id}/payments` - Add payment to invoice

### Stock Movement Management
- `GET /api/stock-movements` - List all stock movements
- `GET /api/stock-movements/{id}` - Get stock movement by ID
- `POST /api/stock-movements` - Create new stock movement
- `PUT /api/stock-movements/{id}` - Update stock movement
- `PUT /api/stock-movements/{id}/status` - Update movement status

## Database Schema

The system uses MySQL with the following main tables:

| Table | Description |
|-------|-------------|
| `users` | User information |
| `roles` | User roles |
| `permissions` | Access permissions |
| `role_permissions` | Many-to-many mapping of roles and permissions |
| `products` | Product catalog |
| `categories` | Product categories |
| `warehouses` | Warehouse information |
| `product_warehouse` | Product stock in warehouses |
| `orders` | Customer orders |
| `order_items` | Items in orders |
| `invoices` | Financial invoices |
| `payments` | Payment transactions |
| `stock_movements` | Movement of stock between warehouses |
| `addresses` | Address information |

## Prerequisites

- Java 17 or higher
- MySQL 8.0 or higher
- Maven 3.8 or higher

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/xSyNcZ/Products-Management-System.git
   ```

2. **Navigate to the project directory**
   ```bash
   cd Products-Management-System
   ```

3. **Configure the database connection**
   Update `src/main/resources/application.properties`:
   ```properties
   spring.datasource.url=jdbc:mysql://localhost:3306/pms
   spring.datasource.username=your_username
   spring.datasource.password=your_password
   ```

4. **Build the project**
   ```bash
   mvn clean install
   ```

5. **Run the application**
   ```bash
   mvn spring-boot:run
   ```

6. **Access the application**
   Navigate to `http://localhost:8080`

## Default Credentials

The system creates a default admin user on first run:
- **Username**: admin
- **Password**: admin123 *(change immediately after first login)*

## Initial Setup

1. Initialize the system with base data using the provided SQL scripts
2. Configure roles and permissions according to your organizational structure

## Development Setup

1. **Install prerequisites**:
   - Java 17 JDK
   - MySQL 8.0
   - Maven 3.8
   - Preferred IDE (IntelliJ IDEA, Eclipse, VS Code)

2. **Import the project** as a Maven project

## Testing

Run tests using:
```bash
mvn test
```

## API Documentation

The API documentation is available through Swagger UI at:
`http://localhost:8080/swagger-ui.html` when the application is running.

## Production Deployment

1. **Build the project**
   ```bash
   mvn clean package -Pprod
   ```

2. **Deploy the WAR file** to your application server

3. **Configure for production**:
   - Set up HTTPS on application server
   - Configure production-ready MySQL database
   - Set environment-specific properties

## Monitoring and Maintenance

- Use Spring Boot Actuator endpoints for monitoring
- Set up log rotation and archiving
- Implement regular database backups
- Schedule periodic system health checks

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Authors

- **Mateusz Marciniak**
- **Oskar Wojtkowiak**

## Acknowledgments

- Spring Framework team
- Hibernate team
- All contributors to the open-source libraries used in this project

## Support

For support and questions, please create an issue in the GitHub repository.
