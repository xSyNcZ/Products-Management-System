# Products Management System (PMS)

## Overview
The Products Management System (PMS) is a comprehensive web-based application designed to efficiently manage products, warehouses, orders, and invoices. It provides businesses with a centralized platform for inventory tracking, order processing, and financial management, integrating data from multiple warehouses and offering real-time insights into stock levels and order fulfillment statuses.

## Motivation
Many businesses struggle with inefficient inventory management, leading to overstocking, stockouts, and revenue loss. Manual tracking systems or disparate software solutions create inefficiencies, and managing large quantities of stock across multiple warehouses is challenging. This system aims to centralize product and order management, ensuring accuracy and improving operational efficiency.

## Goals
- Automate inventory management through a centralized platform
- Streamline order processing with a structured workflow
- Generate financial documents such as invoices automatically
- Enhance decision-making via analytics dashboards
- Implement role-based access control for secure data access

## Technology Stack
- **Database**: MySQL
- **Backend**: Spring Framework + Hibernate
- **Frontend**: HTML, CSS, JavaScript
- **Build Tool**: Maven
- **API Documentation**: Swagger

## System Architecture
The system follows a standard layered architecture:
1. **Presentation Layer**: REST API endpoints exposed via Spring MVC controllers
2. **Business Logic Layer**: Service components implementing business rules
3. **Data Access Layer**: Repository interfaces extending Spring Data JPA
4. **Data Layer**: Entity classes mapped to database tables via Hibernate

## Key Features
- User and role management with fine-grained permissions
- Product catalog with categorization and multi-warehouse inventory tracking
- Order management with approval workflow and status tracking
- Invoice generation and payment processing
- Stock movement tracking between warehouses
- Reporting and analytics dashboard

## User Roles
### Business Roles
- **CEO**: Highest level of access, manages users and system settings
- **Warehouse Manager**: Oversees stock levels and manages product movements
- **Regular Worker**: Moves stock between locations
- **Sales Manager**: Handles order approvals and customer relations
- **Accountant**: Generates invoices and manages payments
- **Customer**: Places orders and tracks shipments

### Technical Roles
- **System Administrator**: Manages user accounts and system permissions
- **Database Administrator**: Ensures data integrity and handles database operations
- **Developer**: Modifies system code and deploys updates
- **IT Support Technician**: Troubleshoots system issues
- **Security Officer**: Monitors system security
- **DevOps Engineer**: Manages deployments and infrastructure
- **Integration Specialist**: Configures external system integrations

## Project Structure
```
products-management-system/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/
│   │   │       └── pms/
│   │   │           ├── ProductsManagementSystemApplication.java
│   │   │           ├── config/
│   │   │           ├── model/
│   │   │           │   ├── entity/
│   │   │           │   ├── enums/
│   │   │           │   └── dto/
│   │   │           ├── repository/
│   │   │           ├── service/
│   │   │           │   ├── interfaces/
│   │   │           │   └── impl/
│   │   │           ├── controller/
│   │   │           ├── security/
│   │   │           ├── exception/
│   │   │           └── util/
│   │   └── resources/
│   │       ├── application.properties
│   │       ├── data.sql
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

### Stock Movement
- `GET /api/stock-movements` - List all stock movements
- `GET /api/stock-movements/{id}` - Get stock movement by ID
- `POST /api/stock-movements` - Create new stock movement
- `PUT /api/stock-movements/{id}` - Update stock movement
- `PUT /api/stock-movements/{id}/status` - Update movement status

## Database Schema
The system uses MySQL as the database with the following main tables:
- `users` - User information
- `roles` - User roles
- `permissions` - Access permissions
- `role_permissions` - Many-to-many mapping of roles and permissions
- `products` - Product catalog
- `categories` - Product categories
- `warehouses` - Warehouse information
- `product_warehouse` - Product stock in warehouses
- `orders` - Customer orders
- `order_items` - Items in orders
- `invoices` - Financial invoices
- `payments` - Payment transactions
- `stock_movements` - Movement of stock between warehouses
- `addresses` - Address information

## Security Implementation
- JWT (JSON Web Token) for authentication and authorization
- Role-based access control (RBAC) for fine-grained permissions
- Password encryption using BCrypt
- HTTPS for secure communication
- Input validation and sanitization
- Protection against common web vulnerabilities (XSS, CSRF, SQL Injection)

## Getting Started

### Prerequisites
- Java 17 or higher
- MySQL 8.0 or higher
- Maven 3.8 or higher

### Installation
1. Clone the repository
   ```
   git clone https://github.com/yourcompany/products-management-system.git
   ```
2. Navigate to the project directory
   ```
   cd products-management-system
   ```
3. Configure the database connection in `src/main/resources/application.properties`
   ```
   spring.datasource.url=jdbc:mysql://localhost:3306/pms
   spring.datasource.username=your_username
   spring.datasource.password=your_password
   ```
4. Build the project
   ```
   mvn clean install
   ```
5. Run the application
   ```
   mvn spring-boot:run
   ```
6. Access the application at `http://localhost:8080`

### Initial Setup
1. The system will create default admin user on first run
   - Username: admin
   - Password: admin123 (change immediately after first login)
2. Initialize the system with base data using the provided SQL scripts
3. Configure roles and permissions according to your organizational structure

## Development

### Development Environment Setup
1. Install Java 17 JDK
2. Install MySQL 8.0
3. Install Maven 3.8
4. Install your preferred IDE (IntelliJ IDEA, Eclipse, VS Code)
5. Import the project as a Maven project

### Running Tests
```
mvn test
```

### API Documentation
The API documentation is available through Swagger UI at `http://localhost:8080/swagger-ui.html` when the application is running.

## Deployment

### Production Deployment
1. Build the project
   ```
   mvn clean package -Pprod
   ```
2. Deploy the WAR file to your application server
3. Configure the application server for HTTPS
4. Set up a production-ready MySQL database
5. Configure environment-specific properties

### Monitoring and Maintenance
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
- Mateusz Marciniak
- Oskar Wojtkowiak

## Acknowledgments
- Spring Framework team
- Hibernate team
- All contributors to the open-source libraries used in this project
