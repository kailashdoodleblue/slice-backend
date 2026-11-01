/**
 * Application-wide Roles
 */
export enum UserRole {
  ADMIN = "admin",
  STAFF = "staff",
}

/**
 * Account and Entity Status
 */
export enum AccountStatus {
  ACTIVE = "Active",
  INACTIVE = "Inactive",
}

export const UserStatus = AccountStatus;
export type UserStatus = AccountStatus;

export enum MerchantStatus {
  ACTIVE = "Active",
  INACTIVE = "Inactive",
}

/**
 * Common HTTP Status Codes
 */
export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;

