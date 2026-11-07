export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code = 'ERROR',
    public details?: unknown,
  ) {
    super(message);
  }

  static badRequest(msg: string, details?: unknown) {
    return new AppError(400, msg, 'BAD_REQUEST', details);
  }
  static unauthorized(msg = 'Authentication required') {
    return new AppError(401, msg, 'UNAUTHORIZED');
  }
  static forbidden(msg = 'You do not have permission to perform this action') {
    return new AppError(403, msg, 'FORBIDDEN');
  }
  static notFound(msg = 'Resource not found') {
    return new AppError(404, msg, 'NOT_FOUND');
  }
  static conflict(msg: string, code = 'CONFLICT', details?: unknown) {
    return new AppError(409, msg, code, details);
  }
  static unprocessable(msg: string, details?: unknown) {
    return new AppError(422, msg, 'UNPROCESSABLE', details);
  }
}

