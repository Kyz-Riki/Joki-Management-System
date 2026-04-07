export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(m = 'Unauthorized') {
    super('UNAUTHORIZED', m, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(m = 'Forbidden') {
    super('FORBIDDEN', m, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(m = 'Not found') {
    super('NOT_FOUND', m, 404);
  }
}

export class ConflictError extends AppError {
  constructor(m = 'Conflict') {
    super('CONFLICT', m, 409);
  }
}

export class RateLimitError extends AppError {
  constructor(m = 'Too many requests') {
    super('RATE_LIMITED', m, 429);
  }
}

export class ValidationError extends AppError {
  constructor(m = 'Validation error') {
    super('VALIDATION_ERROR', m, 422);
  }
}

/**
 * Converts any thrown value into a structured JSON Response.
 * Response.json is inlined here to avoid a circular import with ./response.
 */
export function handleApiError(error: unknown): Response {
  if (error instanceof AppError) {
    return Response.json(
      { success: false, error: { code: error.code, message: error.message } },
      { status: error.status },
    );
  }

  console.error('[API Error]', error);

  return Response.json(
    { success: false, error: { code: 'INTERNAL_ERROR', message: 'Terjadi kesalahan internal.' } },
    { status: 500 },
  );
}
