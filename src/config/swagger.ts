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
      "Slice backend API. Log in via `POST /auth/login`, then click **Authorize** and paste the returned token (without the `Bearer ` prefix).",
  },
  servers: [{ url: "/api" }],
  tags: [
    { name: "Health", description: "Service health check" },
    { name: "Auth", description: "Login and profile" },
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
          merchantCode: { type: "string", example: "MER001" },
          businessName: { type: "string", example: "City Electronics" },
          businessEmail: { type: "string", example: "info@cityelectronics.com" },
          contactPerson: { type: "string", nullable: true },
          phoneNumber: { type: "string", nullable: true },
          businessType: { type: "string", nullable: true },
          countryMarket: { type: "string", nullable: true },
          registrationNumber: { type: "string", nullable: true },
          website: { type: "string", nullable: true },
          addressLine1: { type: "string", nullable: true },
          addressLine2: { type: "string", nullable: true },
          city: { type: "string", nullable: true },
          postalCode: { type: "string", nullable: true },
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
          userId: { type: "string", example: "2" },
          fullName: { type: "string", example: "John Doe" },
          merchantId: { type: "string", example: "1" },
          mobileNumber: { type: "string", example: "+971500000000" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time", nullable: true },
          user: ref("User"),
          merchant: ref("Merchant"),
        },
      },

      // ----- auth -----
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "admin@slice.com" },
          password: { type: "string", example: "AdminSecurePassword123!" },
        },
      },
      LoginData: {
        type: "object",
        properties: { token: { type: "string" }, user: ref("User") },
      },

      // ----- users -----
      CreateUserRequest: {
        type: "object",
        required: ["email"],
        properties: {
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
          email: { type: "string", format: "email", maxLength: 150 },
          status: { type: "string", enum: ["Active", "Inactive"] },
        },
      },

      // ----- merchants -----
      CreateMerchantRequest: {
        type: "object",
        required: ["merchantCode", "businessName", "businessEmail"],
        properties: {
          merchantCode: { type: "string", maxLength: 50, example: "MER001" },
          businessName: { type: "string", maxLength: 150, example: "City Electronics" },
          businessEmail: { type: "string", format: "email", maxLength: 150 },
          contactPerson: { type: "string", maxLength: 150, nullable: true },
          phoneNumber: { type: "string", maxLength: 20, nullable: true },
          businessType: { type: "string", maxLength: 100, nullable: true },
          countryMarket: { type: "string", maxLength: 100, nullable: true },
          registrationNumber: { type: "string", maxLength: 100, nullable: true },
          website: { type: "string", maxLength: 255, nullable: true },
          addressLine1: { type: "string", maxLength: 255, nullable: true },
          addressLine2: { type: "string", maxLength: 255, nullable: true },
          city: { type: "string", maxLength: 100, nullable: true },
          postalCode: { type: "string", maxLength: 20, nullable: true },
          status: { type: "string", enum: ["Active", "Inactive"], default: "Active" },
          incentivePercentage: { type: "number", minimum: 0, maximum: 100, default: 0, example: 5.5 },
          incentivePercentage: { type: "number", minimum: 0, maximum: 100, default: 0, example: 5.5 },
        },
      },
      UpdateMerchantRequest: {
        type: "object",
        minProperties: 1,
        description: "Any subset of the create fields (at least one).",
        properties: {
          merchantCode: { type: "string", maxLength: 50 },
          businessName: { type: "string", maxLength: 150 },
          businessEmail: { type: "string", format: "email", maxLength: 150 },
          contactPerson: { type: "string", maxLength: 150, nullable: true },
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
          mobileNumber: { type: "string", maxLength: 20, example: "+971500000000" },
        },
      },
      UpdateStaffRequest: {
        type: "object",
        minProperties: 1,
        properties: {
          fullName: { type: "string", maxLength: 150 },
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
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Log in and receive a JWT",
        requestBody: body("LoginRequest"),
        responses: {
          "200": ok("Login successful", ref("LoginData"), "Login successful"),
          "400": validation400,
          "401": errRes("Invalid email or password"),
          "403": errRes("Account is inactive"),
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
      post: {
        tags: ["Staff"],
        summary: "Create a staff member (also creates their login user)",
        security: secured,
        requestBody: body("CreateStaffRequest"),
        responses: {
          "201": ok("Staff created", ref("Staff"), "Staff created successfully"),
          "400": errRes("Validation failed or merchant inactive", "ValidationError"),
          ...authErrors,
          "404": errRes("Merchant not found"),
          "409": errRes("Email or mobile number already registered"),
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
