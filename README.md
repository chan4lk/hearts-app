# Bistec AspireHub

A comprehensive Bistec AspireHub built with Next.js, Prisma, and PostgreSQL.

## Features

- User authentication with NextAuth.js
- Role-based access control (Admin, Manager, Employee)
- Goal setting and approval workflow
- Performance ratings and feedback
- Modern UI with Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose
- PostgreSQL (or use the Docker container)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/performance-management-system.git
   cd performance-management-system
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit the `.env` file with your configuration.

### Database Setup

#### Using Docker (Recommended)

1. Start the database and pgAdmin:

   ```bash
   scripts\db-manage.bat start
   ```

2. Access pgAdmin at http://localhost:5050

   - Login with admin@example.com / admin
   - Add a new server with these settings:
     - Host: postgres
     - Port: 5432
     - Database: performance_management
     - Username: postgres
     - Password: postgres

3. Run migrations and seed the database:
   ```bash
   scripts\db-manage.bat migrate
   scripts\db-manage.bat seed
   ```

#### Using Local PostgreSQL

1. Create a PostgreSQL database named `performance_management`
2. Update the `.env` file with your database connection string
3. Run migrations and seed the database:
   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```

### Running the Application

1. Start the development server:

   ```bash
   npm run dev
   ```

2. Open http://localhost:3003 in your browser

## Database Management

The `scripts\db-manage.bat` script provides several commands for managing the Docker database:

- `start` - Start the database and pgAdmin
- `stop` - Stop the database and pgAdmin
- `restart` - Restart the database and pgAdmin
- `status` - Show the status of containers
- `logs` - Show logs from containers
- `reset` - Reset the database (delete all data)
- `migrate` - Run Prisma migrations
- `seed` - Seed the database with initial data
- `help` - Show help message

## Test Accounts

- Admin: admin@example.com / admin123
- Manager: manager@example.com / manager123
- Employee: employee@example.com / employee123

## Deploying Infrastructure with Pulumi on Azure

### Prerequisites

- [Pulumi CLI](https://www.pulumi.com/docs/get-started/install/) installed
- Azure account and access to create resources
- Azure CLI installed and logged in (`az login`)
- Node.js and npm installed

### Steps

1. **Install dependencies:**
   ```sh
   cd infra
   npm install
   ```
2. **Login to Pulumi:**
   ```sh
   pulumi login
   ```
3. **Set up your stack:**
   ```sh
   pulumi stack init <stack-name>
   ```
   Replace `<stack-name>` with your environment (e.g., `dev`, `prod`).
4. **Configure Azure credentials:**
   Pulumi uses your Azure CLI credentials by default. Ensure you are logged in with `az login`.
5. **Configure stack variables:**
   ```sh
   pulumi config set azure:location <location>
   pulumi config set dbAdminUser <db-admin-username>
   pulumi config set dbAdminPassword <db-admin-password> --secret
   ```
   Adjust variable names as needed for your stack.
6. **Preview the deployment:**
   ```sh
   pulumi preview
   ```
7. **Deploy infrastructure:**
   ```sh
   pulumi up
   ```
8. **Destroy infrastructure:**
   ```sh
   pulumi destroy
   ```

For more details, see the `infra/README.md` or Pulumi documentation.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
