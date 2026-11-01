# Express + TypeORM + MySQL Starter (Modular Architecture)

## Setup
```bash
npm install
cp .env.example .env     # edit DB credentials
# create the database first:  CREATE DATABASE app_db;
npm run dev
```

## Folder Structure
```
src/
├── config/
│   ├── data-source.ts           # TypeORM MySQL connection config
│   └── env.ts                   # Environment variable mappings
├── entities/                    # Centralized TypeORM entities folder
│   ├── index.ts                 # Entity barrel export
│   └── user.entity.ts           # User entity definition
├── middlewares/
│   ├── error.middleware.ts      # Global error handling + Joi validation formatting
│   └── validate.middleware.ts   # Reusable request schema validation middleware
├── modules/
│   ├── health/
│   │   ├── health.controller.ts # Health HTTP handlers
│   │   ├── health.routes.ts     # Health routes
│   │   └── health.service.ts    # Health status & database ping
│   └── user/
│       ├── user.controller.ts   # User HTTP request/response handlers with sendResponse
│       ├── user.routes.ts       # Direct, clean route definitions
│       ├── user.service.ts      # User database queries & business logic
│       └── user.validation.ts   # Joi request validation schemas
├── routes/
│   └── index.ts                 # Main router mounting all module routes
├── utils/
│   ├── AppError.ts              # Custom operational error class
│   └── response.ts              # Standardized API response helper
├── app.ts                       # Express app configuration & global error integration
└── server.ts                    # Server initialization & DB connection
```

## Endpoints
| Method | Path             | Description                    |
|--------|------------------|--------------------------------|
| GET    | /api/health      | Health check (app + DB status) |
| GET    | /api/users       | List users                     |
| GET    | /api/users/:id   | Get user                       |
| POST   | /api/users       | Create user `{name, email}`    |
| PUT    | /api/users/:id   | Update user                    |
| DELETE | /api/users/:id   | Delete user                    |

## Production
```bash
npm run build && npm start
```
`synchronize` is only on in development. Use migrations (`npm run migration:generate`, `npm run migration:run`) in production.
