/**
 * Strongly Typed Application Error Hierarchy
 * Standardizes API responses, status codes, and error serializations across all endpoints.
 */

import { NextResponse } from 'next/server';
import { HTTP_STATUS } from '@/constants/api';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, HTTP_STATUS.BAD_REQUEST);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Valid API key or authentication is required.') {
    super(message, HTTP_STATUS.UNAUTHORIZED);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'The requested resource was not found.') {
    super(message, HTTP_STATUS.NOT_FOUND);
  }
}

export class ProviderApiError extends AppError {
  public readonly providerName: string;

  constructor(providerName: string, message: string, statusCode: number = HTTP_STATUS.BAD_GATEWAY) {
    super(`[${providerName}] ${message}`, statusCode);
    this.providerName = providerName;
  }
}

/**
 * Global API Error Handler
 * Safely transforms unknown thrown errors into structured Next.js JSON responses.
 * Avoids leaking raw internal stack traces in production.
 */
export function handleApiError(error: unknown, fallbackMessage = 'An unexpected server error occurred.'): NextResponse {
  console.error('[API Error]:', error);

  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        statusCode: error.statusCode
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof Error) {
    // Clean up JSON error strings if provider returned serialized JSON in message
    let message = error.message;
    try {
      const parsed = JSON.parse(message);
      if (parsed?.error?.message) {
        message = parsed.error.message;
      }
    } catch {
      // not JSON
    }

    return NextResponse.json(
      {
        success: false,
        error: message || fallbackMessage,
        statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }

  return NextResponse.json(
    {
      success: false,
      error: fallbackMessage,
      statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR
    },
    { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
  );
}
