# Slice Backend - Modular Architecture & RBAC System

Express + TypeORM + MySQL backend featuring Role-Based Access Control (RBAC), multi-tenant Merchant architecture, Staff management, and secure JWT authentication.

---

## 🛠️ Tech Stack
* **Framework:** Express.js + TypeScript
* **Database & ORM:** MySQL + TypeORM (with transactional operations & camelCase columns)
* **Authentication:** JWT (`jsonwebtoken`) + Password Hashing (`bcryptjs`)
* **Validation:** Joi Schema Validation Middleware
* **Architecture:** Modular, domain-driven (`modules/<domain>/`)

---

## 🚀 Getting Started

### 1. Environment Setup
Copy the example environment file and adjust your database and JWT credentials:
```bash
cp .env.example .env
```

Configuration in `.env`:
```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_NAME=app_db

# Initial Admin Seeding
ADMIN_EMAIL=admin@slice.com
ADMIN_PASSWORD=AdminSecurePassword123!

# JWT Authentication
JWT_SECRET=slice_backend_jwt_super_secret_key_2026
JWT_EXPIRES_IN=1d
```

### 2. Install & Run
```bash
npm install

# Start in development mode (auto-seeds default Admin on startup):
npm run dev

# Or run admin seeding independently:
npm run seed:admin

# Build for production:
npm run build
npm start
```

---

## 📁 Project Structure

```
src/
├── config/
│   ├── data-source.ts                 # TypeORM DataSource & Entity configuration
│   └── env.ts                         # Validated environment configuration
├── constants/
│   └── index.ts                       # Domain enums (UserRole, AccountStatus, etc.)
├── entities/                          # Centralized database entities (camelCase)
│   ├── index.ts                       # Entity barrel export
│   ├── user.entity.ts                 # Common Users table (Admin & Staff)
│   ├── merchant.entity.ts             # Merchants table
│   └── staff.entity.ts                # Staff table (profile & assignment)
├── middlewares/
│   ├── auth.middleware.ts             # authenticate & authorize guards
│   ├── error.middleware.ts            # Global error handler with Joi formatting
│   └── validate.middleware.ts         # Joi request schema validation
├── migrations/
│   └── 1730450000000-InitialMigration.ts # Production database migration (camelCase)
├── modules/
│   ├── auth/                          # Common login & profile endpoints
│   ├── merchant/                      # Merchant management (Admin-only)
│   ├── staff/                         # Transactional staff creation & management
│   ├── user/                          # User accounts management
│   └── health/                        # System & DB health check
├── routes/
│   └── index.ts                       # Central router mounting all modules
├── seed/
│   ├── admin.seed.ts                  # Secure admin seeder function
│   └── run-seed.ts                    # Standalone seeding script
├── utils/
│   ├── AppError.ts                    # Operational error factory
│   └── response.ts                    # Standardized API response helper
├── app.ts                             # Express application configuration
└── server.ts                          # Server listener & database initializer
```

---

## 🔐 Role-Based Access Control (RBAC)

The system supports two distinct roles:
* `admin`: Complete access to all management APIs (Merchants, Staff, Users).
* `staff`: Access to authenticated profile and staff-permitted endpoints.

Guards are applied directly on routes:
* `authenticate`: Validates JWT token signature, expiration, and ensures user `status === 'Active'`.
* `authorize(UserRole.ADMIN)`: Ensures the authenticated user has the `admin` role. Returns `403 Forbidden` otherwise.

---

## 📡 API Endpoints

### 1. Authentication (`/api/auth`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/auth/login` | Common login for Admin & Staff (`{ email, password }`) | Public |
| `GET` | `/api/auth/me` | Get authenticated user profile & assignments | Authenticated |
| `POST` | `/api/auth/logout` | Invalidate / logout session | Authenticated |

### 2. Merchant Management (`/api/merchants`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/merchants` | Create new merchant | Admin |
| `GET` | `/api/merchants` | List merchants with search, filter, pagination & staffCount | Admin |
| `GET` | `/api/merchants/:id` | Get merchant details with staff list & staffCount | Admin |
| `PUT` | `/api/merchants/:id` | Update merchant details | Admin |
| `PATCH` | `/api/merchants/:id/status`| Update merchant status (`Active`/`Inactive`) | Admin |

#### `GET /api/merchants` Query Parameters:
| Param | Type | Required | Validation & Description |
|---|---|---|---|
| `status` | string | No | `all`, `active`, or `inactive`. Default `all`. |
| `search` | string | No | Matches merchant name, registration code, location (city/address/country), or primary contact (name/email/phone). |
| `page` | number | No | Whole number, at least 1. Default `1`. |
| `limit` | number | No | Whole number, 1 to 50. Default `7`. |

**Response Format:**
```json
{
  "success": true,
  "message": "Merchants retrieved successfully",
  "data": [
    {
      "id": "1",
      "merchantCode": "MERC_001",
      "businessName": "Acme Supermarket",
      "businessEmail": "contact@acme.com",
      "contactPerson": "Alice Smith",
      "city": "New York",
      "status": "Active",
      "staffCount": 4,
      "createdAt": "2026-11-01T10:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 7,
    "total": 1,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

### 3. Staff Management (`/api/staff`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/staff` | Create Staff profile & User account (in transaction) | Admin |
| `GET` | `/api/staff` | List all staff with user & merchant relations | Admin |
| `GET` | `/api/staff/:id` | Get staff details | Admin |
| `PUT` | `/api/staff/:id` | Update staff details | Admin |
| `PATCH` | `/api/staff/:id/status`| Update staff active/inactive status | Admin |

### 4. Health Check (`/api/health`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/health` | App uptime and MySQL connection health | Public |
