export class AppError extends Error {
  public readonly isOperational: boolean = true;

  constructor(public statusCode: number, message: string) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }

  static badRequest(message: string): AppError {
    return new AppError(400, message);
  }

  static unauthorized(message = "Unauthorized"): AppError {
    return new AppError(401, message);
  }

  static forbidden(message = "Forbidden"): AppError {
    return new AppError(403, message);
  }

  static notFound(message = "Resource not found"): AppError {
    return new AppError(404, message);
  }

  static conflict(message: string): AppError {
    return new AppError(409, message);
  }

  static internal(message = "Internal server error"): AppError {
    return new AppError(500, message);
  }
}
