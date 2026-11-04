/* eslint-disable @typescript-eslint/no-explicit-any */

// ---------- helpers ----------
const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const json = (schema: any) => ({ "application/json": { schema } });
const body = (schemaName: string) => ({ required: true, content: json(ref(schemaName)) });
const secured = [{ bearerAuth: [] }];

const idParam = (description = "Numeric ID") => ({
  name: "id",
  in: "path",
  required: true,
  description,
  schema: { type: "string", pattern: "^\\d+$", example: "1" },
});

const errRes = (description: string, schema = "ErrorResponse") => ({
  description,
  content: json(ref(schema)),
});

const ok = (description: string, dataSchema?: any, message = "Success") => ({
  description,
  content: json({
    type: "object",
    properties: {
      success: { type: "boolean", example: true },
      message: { type: "string", example: message },
      ...(dataSchema ? { data: dataSchema } : {}),
    },
  }),
});

const authErrors = {
  "401": errRes("Missing, invalid or expired token"),
  "403": errRes("Insufficient permissions or inactive account"),
};
const validation400 = errRes("Validation failed", "ValidationError");

const statusBody = {
  required: true,
  content: json({
    type: "object",
    required: ["status"],
    properties: { status: { type: "string", enum: ["Active", "Inactive"], example: "Inactive" } },
  }),
};

// ---------- spec ----------
export const swaggerSpec = {
  openapi: "3.0.3",
  info: {
    title: "Slice API",
    version: "1.0.0",
    description:
      "Slice backend API. Log in via `POST /auth/admin/login` or `POST /auth/staff/login`, then click **Authorize** and paste the returned token (without the `Bearer ` prefix).",
  },
  servers: [{ url: "/api" }],
  tags: [
    { name: "Health", description: "Service health check" },
    { name: "Auth", description: "Login, session, and password recovery" },
    { name: "Admin Dashboard", description: "Admin dashboard stats and analytics (admin only)" },
    { name: "Staff Dashboard", description: "Staff dashboard metrics and activity (staff only)" },
    { name: "Users", description: "User management (admin only)" },
    { name: "Merchants", description: "Merchant management (admin only)" },
    { name: "Staff", description: "Staff management (admin only)" },
    { name: "Transactions", description: "Staff transaction submission (staff only)" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
      // ----- common -----
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string", example: "Merchant not found" },
        },
      },
      ValidationError: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string", example: "Validation failed" },
          errors: {
            type: "array",
            items: {
              type: "object",
              properties: {
                field: { type: "string", example: "body.email" },
                message: { type: "string", example: "Invalid email address" },
              },
            },
          },
        },
      },

      // ----- entities -----
      User: {
        type: "object",
        properties: {
          id: { type: "string", example: "1" },
          name: { type: "string", example: "John Doe", nullable: true },
          email: { type: "string", example: "admin@slice.com" },
          role: { type: "string", enum: ["admin", "staff"], example: "admin" },
          status: { type: "string", enum: ["Active", "Inactive"], example: "Active" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time", nullable: true },
          staff: { allOf: [ref("Staff")], nullable: true },
        },
      },
      Merchant: {
        type: "object",
        properties: {
          id: { type: "string", example: "1" },
          merchantCode: { type: "string", example: "MRC-001" },
          businessName: { type: "string", example: "City Electronics" },
          businessEmail: { type: "string", example: "info@cityelectronics.com" },
          contactPerson: { type: "string", nullable: true },
          countryCode: { type: "string", maxLength: 10, nullable: true, example: "+971" },
          phoneNumber: { type: "string", maxLength: 20, nullable: true },
          businessType: { type: "string", maxLength: 100, nullable: true },
          countryMarket: { type: "string", maxLength: 100, nullable: true },
          registrationNumber: { type: "string", maxLength: 100, nullable: true },
          website: { type: "string", maxLength: 255, nullable: true },
          addressLine1: { type: "string", maxLength: 255, nullable: true },
          addressLine2: { type: "string", maxLength: 255, nullable: true },
          city: { type: "string", maxLength: 100, nullable: true },
          postalCode: { type: "string", maxLength: 20, nullable: true },
          status: { type: "string", enum: ["Active", "Inactive"], example: "Active" },
          incentivePercentage: {
            type: "number",
            example: 5.5,
            description: "Incentive % applied to submitted transactions",
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time", nullable: true },
        },
      },
      Staff: {
        type: "object",
        properties: {
          staffId: { type: "string", example: "1" },
          staffCode: { type: "string", example: "STF-0001" },
          userId: { type: "string", example: "2" },
          fullName: { type: "string", example: "John Doe" },
          merchantId: { type: "string", example: "1" },
          countryCode: { type: "string", example: "+971" },
          mobileNumber: { type: "string", example: "+971500000000" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time", nullable: true },
          user: ref("User"),
          merchant: ref("Merchant"),
        },
      },

      // ----- auth -----
      AdminLoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "admin@slice.com" },
          password: { type: "string", example: "AdminSecurePassword123!" },
          remindMe: {
            type: "boolean",
            default: false,
            example: true,
            description: "If true, session token lasts 7 days instead of 1 day",
          },
        },
      },
      StaffLoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "staff@example.com" },
          password: { type: "string", example: "StaffPassword123!" },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "admin@slice.com" },
          password: { type: "string", example: "AdminSecurePassword123!" },
        },
      },
      ForgotPasswordRequest: {
        type: "object",
        required: ["email"],
        properties: {
          email: { type: "string", format: "email", example: "staff@example.com" },
          portal: { type: "string", enum: ["admin", "staff"], example: "staff" },
        },
      },
      ResetPasswordRequest: {
        type: "object",
        required: ["token", "password"],
        properties: {
          token: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
          password: { type: "string", minLength: 6, maxLength: 100, example: "NewSecurePassword123!" },
        },
      },
      LoginData: {
        type: "object",
        properties: {
          token: { type: "string" },
          user: {
            type: "object",
            properties: {
              email: { type: "string", format: "email", example: "admin@slice.com" },
              name: { type: "string", example: "Admin" },
            },
          },
        },
      },

      // ----- users -----
      CreateUserRequest: {
        type: "object",
        required: ["email"],
        properties: {
          name: { type: "string", maxLength: 150, example: "John Doe" },
          email: { type: "string", format: "email", maxLength: 150 },
          password: { type: "string", minLength: 6, maxLength: 100 },
          role: { type: "string", enum: ["admin", "staff"], default: "staff" },
          status: { type: "string", enum: ["Active", "Inactive"], default: "Active" },
        },
      },
      UpdateUserRequest: {
        type: "object",
        minProperties: 1,
        properties: {
          name: { type: "string", maxLength: 150 },
          email: { type: "string", format: "email", maxLength: 150 },
          status: { type: "string", enum: ["Active", "Inactive"] },
        },
      },

      // ----- merchants -----
      CreateMerchantRequest: {
        type: "object",
        required: ["businessName", "businessEmail"],
        properties: {
          businessName: { type: "string", maxLength: 150, example: "City Electronics" },
          businessEmail: { type: "string", format: "email", maxLength: 150, example: "info@cityelectronics.com" },
          contactPerson: { type: "string", maxLength: 150, nullable: true, example: "Ahmed Ali" },
          countryCode: { type: "string", maxLength: 10, nullable: true, example: "+971" },
          phoneNumber: { type: "string", maxLength: 20, nullable: true, example: "501234567" },
          businessType: { type: "string", maxLength: 100, nullable: true, example: "Retail" },
          countryMarket: { type: "string", maxLength: 100, nullable: true, example: "UAE" },
          registrationNumber: { type: "string", maxLength: 100, nullable: true, example: "REG-98765" },
          website: { type: "string", maxLength: 255, nullable: true, example: "https://cityelectronics.com" },
          addressLine1: { type: "string", maxLength: 255, nullable: true, example: "Financial Center Rd" },
          addressLine2: { type: "string", maxLength: 255, nullable: true, example: "Downtown" },
          city: { type: "string", maxLength: 100, nullable: true, example: "Dubai" },
          postalCode: { type: "string", maxLength: 20, nullable: true, example: "00000" },
          status: { type: "string", enum: ["Active", "Inactive"], default: "Active" },
          incentivePercentage: { type: "number", minimum: 0, maximum: 100, default: 0, example: 5.5 },
        },
      },
      UpdateMerchantRequest: {
        type: "object",
        minProperties: 1,
        description: "Any subset of the merchant fields (at least one).",
        properties: {
          businessName: { type: "string", maxLength: 150 },
          businessEmail: { type: "string", format: "email", maxLength: 150 },
          contactPerson: { type: "string", maxLength: 150, nullable: true },
          countryCode: { type: "string", maxLength: 10, nullable: true, example: "+971" },
          phoneNumber: { type: "string", maxLength: 20, nullable: true },
          businessType: { type: "string", maxLength: 100, nullable: true },
          countryMarket: { type: "string", maxLength: 100, nullable: true },
          registrationNumber: { type: "string", maxLength: 100, nullable: true },
          website: { type: "string", maxLength: 255, nullable: true },
          addressLine1: { type: "string", maxLength: 255, nullable: true },
          addressLine2: { type: "string", maxLength: 255, nullable: true },
          city: { type: "string", maxLength: 100, nullable: true },
          postalCode: { type: "string", maxLength: 20, nullable: true },
          status: { type: "string", enum: ["Active", "Inactive"] },
          incentivePercentage: { type: "number", minimum: 0, maximum: 100, example: 5.5 },
        },
      },

      // ----- staff -----
      CreateStaffRequest: {
        type: "object",
        required: ["email", "password", "fullName", "merchantId", "mobileNumber"],
        properties: {
          email: { type: "string", format: "email", maxLength: 150 },
          password: { type: "string", minLength: 6, maxLength: 100 },
          fullName: { type: "string", maxLength: 150, example: "John Doe" },
          merchantId: { type: "string", pattern: "^\\d+$", example: "1" },
          countryCode: { type: "string", maxLength: 10, default: "+971", example: "+971" },
          mobileNumber: { type: "string", maxLength: 20, example: "+971500000000" },
        },
      },
      UpdateStaffRequest: {
        type: "object",
        minProperties: 1,
        properties: {
          fullName: { type: "string", maxLength: 150 },
          countryCode: { type: "string", maxLength: 10, example: "+971" },
          mobileNumber: { type: "string", maxLength: 20 },
        },
      },

      // ----- transactions -----
      SubmitTransactionRequest: {
        type: "object",
        required: ["merchantId", "authCode", "transactionAmount"],
        properties: {
          merchantId: {
            type: "string",
            pattern: "^\\d+$",
            example: "1",
            description: "Merchant the transaction belongs to (must be the staff's merchant)",
          },
          authCode: {
            type: "string",
            pattern: "^[A-Z0-9]{6}$",
            example: "A7K9Q2",
            description: "6 letter/digit approval code from the payment receipt",
          },
          transactionAmount: {
            type: "number",
            format: "double",
            minimum: 100,
            example: 850.0,
            description: "Transaction amount in AED (minimum 100)",
          },
        },
      },
      TransactionData: {
        type: "object",
        properties: {
          id: { type: "string", example: "6" },
          reference: { type: "string", example: "TX-1006" },
          authCode: { type: "string", example: "B6R3L9" },
          status: { type: "string", enum: ["pending", "approved", "rejected"], example: "pending" },
          submittedAt: { type: "string", format: "date-time", example: "2026-10-21T07:00:00.000Z" },
          transactionAmount: { type: "number", example: 650 },
          currency: { type: "string", example: "AED" },
          incentiveAmount: {
            type: "number",
            example: 40,
            description: "transactionAmount x merchant incentive percentage / 100",
          },
          note: { type: "string", example: "Awaiting review · Not included in your balance." },
          rejectionReason: { type: "string", nullable: true, example: null },
        },
      },
      AlreadyClaimedError: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          code: { type: "string", example: "TRANSACTION_ALREADY_CLAIMED" },
          message: { type: "string", example: "Transaction already submitted" },
          errors: {
            type: "object",
            properties: {
              authCode: {
                type: "array",
                items: { type: "string" },
                example: ["This Approval code has already been claimed."],
              },
            },
          },
          existingTransaction: {
            type: "object",
            properties: {
              reference: { type: "string", example: "TX-1048" },
              authCode: { type: "string", example: "A7K9Q2" },
              status: { type: "string", example: "pending" },
              submittedAt: { type: "string", format: "date-time" },
            },
          },
        },
      },
    },
  },
  paths: {
    // ===== Staff Dashboard =====
    "/staff-dashboard": {
      get: {
        tags: ["Staff Dashboard"],
        summary: "Monthly incentive and performance summary",
        description:
          "Returns the logged-in staff member's incentive (sum of the transactions incentive column, rejected excluded) and performance (volume and submitted count) for a month. The incentive and performance cards have separate month filters; both default to the current month. Months run on GST (UTC+4).",
        security: secured,
        parameters: [
          {
            name: "incentiveMonth",
            in: "query",
            required: false,
            description: "Month for the incentive section (YYYY-MM). Defaults to current month.",
            schema: { type: "string", pattern: "^\\d{4}-(0[1-9]|1[0-2])$", example: "2026-10" },
          },
          {
            name: "performanceMonth",
            in: "query",
            required: false,
            description: "Month for the performance section (YYYY-MM). Defaults to current month.",
            schema: { type: "string", pattern: "^\\d{4}-(0[1-9]|1[0-2])$", example: "2026-10" },
          },
        ],
        responses: {
          "200": ok("Dashboard summary", {
            type: "object",
            properties: {
              month: { type: "string", example: "2026-10", description: "Incentive month" },
              currency: { type: "string", example: "AED" },
              cutoffAt: { type: "string", format: "date-time", example: "2026-10-31T19:59:00.000Z" },
              incentive: {
                type: "object",
                properties: {
                  amount: { type: "number", example: 480, description: "Sum of the transactions table incentive column (approved + pending, rejected excluded)" },
                  approvedCount: { type: "integer", example: 12 },
                  pendingCount: { type: "integer", example: 4 },
                  minimumApprovedCount: { type: "integer", example: 10 },
                },
              },
              performance: {
                type: "object",
                properties: {
                  month: { type: "string", example: "2026-10", description: "Performance month" },
                  transactionVolume: { type: "number", example: 2450, description: "Sum of amounts (approved + pending)" },
                  transactionsSubmitted: { type: "integer", example: 16 },
                  targetProgress: {
                    type: "object",
                    properties: {
                      current: { type: "integer", example: 70 },
                      target: { type: "integer", example: 100 },
                    },
                  },
                },
              },
            },
          }),
          "400": validation400,
          "401": authErrors["401"],
          "403": authErrors["403"],
        },
      },
    },

    "/staff-dashboard/recent-transactions": {
      get: {
        tags: ["Staff Dashboard"],
        summary: "Get latest 3 recent transactions",
        description: "Returns the latest 3 transactions submitted by the logged-in staff member.",
        security: secured,
        responses: {
          "200": {
            description: "Latest 3 recent transactions",
            content: json({
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                data: {
                  type: "array",
                  maxItems: 3,
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string", example: "tx-1" },
                      reference: { type: "string", example: "TX-1048" },
                      authCode: { type: "string", example: "A7K9Q2" },
                      status: { type: "string", enum: ["pending", "approved", "rejected"], example: "pending" },
                      submittedAt: { type: "string", format: "date-time", example: "2026-10-20T06:30:00.000Z" },
                      transactionAmount: { type: "number", example: 850 },
                      incentiveAmount: { type: "number", example: 40 },
                      note: {
                        type: "string",
                        nullable: true,
                        example: "Awaiting review · Not included in your balance.",
                      },
                      rejectionReason: { type: "string", nullable: true, example: null },
                    },
                  },
                },
              },
            }),
          },
          "401": authErrors["401"],
          "403": authErrors["403"],
        },
      },
    },

    // ===== Health =====
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Service health check",
        responses: {
          "200": ok("Service status", {
            type: "object",
            properties: {
              status: { type: "string", enum: ["ok", "error"], example: "ok" },
              timestamp: { type: "string", format: "date-time" },
              uptime: { type: "integer", example: 120 },
              services: {
                type: "object",
                properties: {
                  database: {
                    type: "object",
                    properties: {
                      status: { type: "string", enum: ["up", "down"] },
                      responseTimeMs: { type: "integer" },
                    },
                  },
                },
              },
              memory: { type: "object", properties: { rssMB: { type: "integer" } } },
            },
          }),
        },
      },
    },

    // ===== Auth =====
    "/auth/admin/login": {
      post: {
        tags: ["Auth"],
        summary: "Admin login and receive a JWT",
        description: "Authenticate with administrator credentials. Returns 403 if the user is not an administrator.",
        requestBody: body("AdminLoginRequest"),
        responses: {
          "200": ok("Admin login successful", ref("LoginData"), "Admin login successful"),
          "400": validation400,
          "401": errRes("Invalid email or password"),
          "403": errRes("Access denied: Not an administrator account or account is inactive"),
        },
      },
    },
    "/auth/staff/register": {
      post: {
        tags: ["Auth"],
        summary: "Staff self-registration",
        description: "Public endpoint to register a new staff member under an active merchant. Returns JWT token and staff profile.",
        requestBody: body("CreateStaffRequest"),
        responses: {
          "201": ok("Staff registered", ref("Staff"), "Staff registered successfully"),
          "400": errRes("Validation failed or merchant inactive", "ValidationError"),
          "404": errRes("Merchant not found"),
          "409": errRes("Email or mobile number already registered"),
        },
      },
    },
    "/auth/staff/login": {
      post: {
        tags: ["Auth"],
        summary: "Staff login and receive a JWT",
        description: "Authenticate with staff credentials. Returns 403 if the user is not a staff member.",
        requestBody: body("StaffLoginRequest"),
        responses: {
          "200": ok("Staff login successful", ref("LoginData"), "Staff login successful"),
          "400": validation400,
          "401": errRes("Invalid email or password"),
          "403": errRes("Access denied: Not a staff account or account is inactive"),
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "General login and receive a JWT",
        requestBody: body("LoginRequest"),
        responses: {
          "200": ok("Login successful", ref("LoginData"), "Login successful"),
          "400": validation400,
          "401": errRes("Invalid email or password"),
          "403": errRes("Account is inactive"),
        },
      },
    },
    "/auth/forgot-password": {
      post: {
        tags: ["Auth"],
        summary: "Request a password reset link",
        description: "Sends a password reset link via email. Generates portal-specific reset link depending on account role.",
        requestBody: body("ForgotPasswordRequest"),
        responses: {
          "200": ok(
            "Password reset link sent",
            {
              type: "object",
              properties: {
                email: { type: "string", example: "staff@example.com" },
                portal: { type: "string", example: "staff" },
              },
            },
            "Password reset link has been sent to your email"
          ),
          "400": validation400,
          "403": errRes("Account is inactive"),
          "404": errRes("Account not found with this email"),
        },
      },
    },
    "/auth/reset-password": {
      post: {
        tags: ["Auth"],
        summary: "Reset password using reset token",
        description: "Verifies the reset token from the link and updates the user's password.",
        requestBody: body("ResetPasswordRequest"),
        responses: {
          "200": ok(
            "Password reset successfully",
            undefined,
            "Password reset successfully. You can now log in with your new password."
          ),
          "400": validation400,
        },
      },
    },
    "/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Get the logged-in user's profile",
        security: secured,
        responses: {
          "200": ok("Profile", ref("User"), "User profile retrieved successfully"),
          "401": authErrors["401"],
          "403": authErrors["403"],
        },
      },
    },
    "/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Log out",
        security: secured,
        responses: {
          "200": ok("Logged out", undefined, "Logged out successfully"),
          "401": authErrors["401"],
          "403": authErrors["403"],
        },
      },
    },

    // ===== Admin Dashboard =====
    "/admin/dashboard": {
      get: {
        tags: ["Admin Dashboard"],
        summary: "Get admin dashboard KPI metrics",
        description:
          "Aggregates key KPI card metrics: total & pending transactions, approved & pending incentives, total & new merchants this month, total & new staff this month.",
        security: secured,
        responses: {
          "200": ok(
            "Admin dashboard statistics",
            {
              type: "object",
              properties: {
                transactions: {
                  type: "object",
                  properties: { total: { type: "integer", example: 120 }, pending: { type: "integer", example: 15 } },
                },
                incentives: {
                  type: "object",
                  properties: { approved: { type: "number", example: 4500.5 }, pending: { type: "number", example: 620 } },
                },
                merchants: {
                  type: "object",
                  properties: { total: { type: "integer", example: 45 }, thisMonth: { type: "integer", example: 8 } },
                },
                staff: {
                  type: "object",
                  properties: { total: { type: "integer", example: 130 }, thisMonth: { type: "integer", example: 22 } },
                },
              },
            },
            "Admin dashboard statistics retrieved successfully"
          ),
          ...authErrors,
        },
      },
    },
    "/admin/dashboard/graph": {
      get: {
        tags: ["Admin Dashboard"],
        summary: "Get 6-month incentive volume trend graph",
        description:
          "Returns approved and pending incentive volume for the 6 months ending in the target month. Filterable by month and merchant.",
        security: secured,
        parameters: [
          {
            name: "month",
            in: "query",
            schema: { type: "string", example: "Oct 2026" },
            description: "Target month (defaults to current month)",
          },
          {
            name: "merchantId",
            in: "query",
            schema: { type: "string", example: "1" },
            description: "Optional merchant filter",
          },
          {
            name: "year",
            in: "query",
            schema: { type: "integer", example: 2026 },
            description: "Optional year",
          },
        ],
        responses: {
          "200": ok(
            "Volume graph data",
            {
              type: "object",
              properties: {
                filter: {
                  type: "object",
                  properties: {
                    merchantId: { type: "string", example: "all" },
                    selectedMonth: { type: "string", example: "Oct 2026" },
                    startDate: { type: "string", example: "2026-05-01" },
                    endDate: { type: "string", example: "2026-11-01" },
                  },
                },
                volume: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      month: { type: "string", example: "May" },
                      year: { type: "integer", example: 2026 },
                      monthKey: { type: "string", example: "2026-05" },
                      approved: { type: "number", example: 3500 },
                      pending: { type: "number", example: 2800 },
                      total: { type: "number", example: 6300 },
                    },
                  },
                },
              },
            },
            "Dashboard incentive volume graph retrieved successfully"
          ),
          ...authErrors,
        },
      },
    },
    "/admin/dashboard/incentives": {
      get: {
        tags: ["Admin Dashboard"],
        summary: "Get monthly incentive distribution breakdown (Approved vs Unapproved vs Pending)",
        description:
          "Returns the pie chart distribution of approved, unapproved (rejected), and pending incentives for the selected month.",
        security: secured,
        parameters: [
          {
            name: "month",
            in: "query",
            schema: { type: "string", example: "Oct 2026" },
            description: "Target month (defaults to current month)",
          },
          {
            name: "merchantId",
            in: "query",
            schema: { type: "string", example: "1" },
            description: "Optional merchant filter",
          },
          {
            name: "year",
            in: "query",
            schema: { type: "integer", example: 2026 },
            description: "Optional year",
          },
        ],
        responses: {
          "200": ok(
            "Incentive distribution data",
            {
              type: "object",
              properties: {
                month: { type: "string", example: "October 2026" },
                currency: { type: "string", example: "AED" },
                totalIncentive: { type: "number", example: 100000 },
                breakdown: {
                  type: "object",
                  properties: {
                    approved: {
                      type: "object",
                      properties: { amount: { type: "number" }, percentage: { type: "number" }, count: { type: "integer" } },
                    },
                    unapproved: {
                      type: "object",
                      properties: { amount: { type: "number" }, percentage: { type: "number" }, count: { type: "integer" } },
                    },
                    pending: {
                      type: "object",
                      properties: { amount: { type: "number" }, percentage: { type: "number" }, count: { type: "integer" } },
                    },
                  },
                },
                chart: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      label: { type: "string", example: "Approved" },
                      status: { type: "string", example: "approved" },
                      amount: { type: "number", example: 50000 },
                      percentage: { type: "number", example: 50 },
                      formatted: { type: "string", example: "Approved: 50% (50,000)" },
                    },
                  },
                },
              },
            },
            "Dashboard incentive distribution retrieved successfully"
          ),
          ...authErrors,
        },
      },
    },

    // ===== Users =====
    "/users": {
      get: {
        tags: ["Users"],
        summary: "List users",
        security: secured,
        responses: {
          "200": ok("User list", { type: "array", items: ref("User") }),
          ...authErrors,
        },
      },
      post: {
        tags: ["Users"],
        summary: "Create a user",
        security: secured,
        requestBody: body("CreateUserRequest"),
        responses: {
          "201": ok("User created", ref("User"), "User created successfully"),
          "400": validation400,
          ...authErrors,
          "409": errRes("Email already registered"),
        },
      },
    },
    "/users/{id}": {
      get: {
        tags: ["Users"],
        summary: "Get a user by ID",
        security: secured,
        parameters: [idParam("User ID")],
        responses: {
          "200": ok("User", ref("User")),
          "400": validation400,
          ...authErrors,
          "404": errRes("User not found"),
        },
      },
      put: {
        tags: ["Users"],
        summary: "Update a user",
        security: secured,
        parameters: [idParam("User ID")],
        requestBody: body("UpdateUserRequest"),
        responses: {
          "200": ok("User updated", ref("User"), "User updated successfully"),
          "400": validation400,
          ...authErrors,
          "404": errRes("User not found"),
          "409": errRes("Email already registered"),
        },
      },
      delete: {
        tags: ["Users"],
        summary: "Delete a user",
        security: secured,
        parameters: [idParam("User ID")],
        responses: {
          "200": ok("User deleted", undefined, "User deleted successfully"),
          "400": validation400,
          ...authErrors,
          "404": errRes("User not found"),
        },
      },
    },

    // ===== Merchants =====
    "/merchants/dropdown": {
      get: {
        tags: ["Merchants"],
        summary: "Get merchant dropdown list (Public)",
        description: "Returns simplified list of merchants (id, businessName) for dropdown selection. No authentication required.",
        responses: {
          "200": ok(
            "Merchant dropdown list",
            {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string", example: "1" },
                  businessName: { type: "string", example: "Slice Electronics LLC" },
                },
              },
            },
            "Merchant dropdown list retrieved successfully"
          ),
        },
      },
    },
    "/merchants/locations": {
      get: {
        tags: ["Merchants"],
        summary: "Get distinct merchant locations/cities (Public)",
        description: "Returns distinct list of cities for location filtering. No authentication required.",
        responses: {
          "200": ok(
            "Location list",
            {
              type: "array",
              items: { type: "string", example: "Dubai" },
            },
            "Locations retrieved successfully"
          ),
        },
      },
    },
    "/merchants": {
      get: {
        tags: ["Merchants"],
        summary: "List merchants",
        security: secured,
        responses: {
          "200": ok("Merchant list", { type: "array", items: ref("Merchant") }),
          ...authErrors,
        },
      },
      post: {
        tags: ["Merchants"],
        summary: "Create a merchant",
        security: secured,
        requestBody: body("CreateMerchantRequest"),
        responses: {
          "201": ok("Merchant created", ref("Merchant")),
          "400": validation400,
          ...authErrors,
          "409": errRes("Merchant code already exists"),
        },
      },
    },
    "/merchants/{id}": {
      get: {
        tags: ["Merchants"],
        summary: "Get a merchant by ID",
        security: secured,
        parameters: [idParam("Merchant ID")],
        responses: {
          "200": ok("Merchant", ref("Merchant")),
          "400": validation400,
          ...authErrors,
          "404": errRes("Merchant not found"),
        },
      },
      put: {
        tags: ["Merchants"],
        summary: "Update a merchant",
        security: secured,
        parameters: [idParam("Merchant ID")],
        requestBody: body("UpdateMerchantRequest"),
        responses: {
          "200": ok("Merchant updated", ref("Merchant")),
          "400": validation400,
          ...authErrors,
          "404": errRes("Merchant not found"),
          "409": errRes("Merchant code already exists"),
        },
      },
    },
    "/merchants/{id}/status": {
      patch: {
        tags: ["Merchants"],
        summary: "Activate / deactivate a merchant",
        security: secured,
        parameters: [idParam("Merchant ID")],
        requestBody: statusBody,
        responses: {
          "200": ok("Status updated", ref("Merchant")),
          "400": validation400,
          ...authErrors,
          "404": errRes("Merchant not found"),
        },
      },
    },

    // ===== Staff =====
    "/staff": {
      get: {
        tags: ["Staff"],
        summary: "List staff",
        security: secured,
        responses: {
          "200": ok("Staff list", { type: "array", items: ref("Staff") }, "Staff list retrieved successfully"),
          ...authErrors,
        },
      },
    },
    "/staff/{id}": {
      get: {
        tags: ["Staff"],
        summary: "Get a staff member by ID",
        security: secured,
        parameters: [idParam("Staff ID")],
        responses: {
          "200": ok("Staff member", ref("Staff"), "Staff details retrieved successfully"),
          "400": validation400,
          ...authErrors,
          "404": errRes("Staff member not found"),
        },
      },
      put: {
        tags: ["Staff"],
        summary: "Update a staff member",
        security: secured,
        parameters: [idParam("Staff ID")],
        requestBody: body("UpdateStaffRequest"),
        responses: {
          "200": ok("Staff updated", ref("Staff"), "Staff updated successfully"),
          "400": validation400,
          ...authErrors,
          "404": errRes("Staff member not found"),
          "409": errRes("Mobile number already registered"),
        },
      },
    },
    "/staff/{id}/status": {
      patch: {
        tags: ["Staff"],
        summary: "Activate / deactivate a staff member",
        security: secured,
        parameters: [idParam("Staff ID")],
        requestBody: statusBody,
        responses: {
          "200": ok("Status updated", ref("Staff"), "Staff status updated successfully"),
          "400": validation400,
          ...authErrors,
          "404": errRes("Staff member not found"),
        },
      },
    },

    // ===== Transactions =====
    "/transactions": {
      get: {
        tags: ["Transactions"],
        summary: "Get all transactions (paginated)",
        description:
          "Returns a paginated list of transactions submitted by the logged-in staff member, ordered with the latest transaction on top. Defaults to page 1 with 10 items per page.",
        security: secured,
        parameters: [
          {
            name: "page",
            in: "query",
            required: false,
            description: "Page number (defaults to 1)",
            schema: { type: "integer", minimum: 1, default: 1, example: 1 },
          },
          {
            name: "limit",
            in: "query",
            required: false,
            description: "Items per page (defaults to 10, max 50)",
            schema: { type: "integer", minimum: 1, maximum: 50, default: 10, example: 10 },
          },
          {
            name: "month",
            in: "query",
            required: false,
            description: "Optional month filter in YYYY-MM format",
            schema: { type: "string", pattern: "^\\d{4}-(0[1-9]|1[0-2])$", example: "2026-10" },
          },
          {
            name: "status",
            in: "query",
            required: false,
            description: "Optional status filter",
            schema: {
              type: "string",
              enum: ["all", "pending", "approved", "rejected"],
              default: "all",
            },
          },
          {
            name: "search",
            in: "query",
            required: false,
            description: "Search by approval code or reference ID",
            schema: { type: "string", example: "A7K9Q2" },
          },
        ],
        responses: {
          "200": {
            description: "Paginated transactions list",
            content: json({
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                message: { type: "string", example: "Transactions retrieved successfully" },
                defaultMonth: { type: "string", example: "2026-10" },
                data: {
                  type: "array",
                  items: ref("TransactionData"),
                },
                meta: {
                  type: "object",
                  properties: {
                    page: { type: "integer", example: 1 },
                    limit: { type: "integer", example: 10 },
                    total: { type: "integer", example: 35 },
                    totalPages: { type: "integer", example: 4 },
                    hasNextPage: { type: "boolean", example: true },
                    hasPrevPage: { type: "boolean", example: false },
                  },
                },
              },
            }),
          },
          "400": validation400,
          "401": authErrors["401"],
          "403": authErrors["403"],
        },
      },
      post: {
        tags: ["Transactions"],
        summary: "Submit a transaction",
        description:
          "Staff submits a transaction to claim an incentive. The incentive is calculated from the merchant's incentive percentage and stored with the transaction. Each approval code can be claimed only once.",
        security: secured,
        requestBody: body("SubmitTransactionRequest"),
        responses: {
          "201": ok("Transaction submitted", ref("TransactionData"), "Transaction submitted"),
          "400": errRes("Validation failed or merchant inactive", "ValidationError"),
          "401": authErrors["401"],
          "403": errRes("Not a staff user, or not assigned to the merchant"),
          "404": errRes("Merchant not found"),
          "409": errRes("Approval code already claimed", "AlreadyClaimedError"),
          "500": errRes("Internal server error"),
        },
      },
    },
  },
};
