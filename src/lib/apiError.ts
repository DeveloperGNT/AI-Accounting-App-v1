import axios from 'axios';
import type { ApiError } from '../api/types';

export const toApiError = (error: unknown): ApiError => {
  // Check AxiosError FIRST: AxiosError carries both `code` and `message`, so a
  // generic 'code' in error check would swallow it and lose the backend's
  // real error body (message + validationMessages).
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return {
        code: 'NETWORK_ERROR',
        message: 'Unable to reach the accounting API. Check your connection and try again.',
      };
    }

    const response = error.response.data as { error?: Partial<ApiError> } | undefined;
    const backendError = response?.error;
    const statusCode = error.response.status;

    return {
      code: backendError?.code || `HTTP_${statusCode}`,
      message:
        backendError?.message ||
        (statusCode === 401
          ? 'Your session is no longer authorized.'
          : statusCode === 403
            ? 'You do not have permission to perform this action.'
            : statusCode === 400
              ? 'The request contains invalid data.'
              : statusCode === 404
                ? 'The requested resource was not found.'
                : statusCode >= 500
                  ? 'The accounting service encountered an error.'
                  : 'The request could not be completed.'),
      statusCode: backendError?.statusCode || statusCode,
      path: backendError?.path,
      timestamp: backendError?.timestamp,
      requestId: backendError?.requestId,
      validationMessages: Array.isArray((error.response.data as { message?: unknown })?.message)
        ? ((error.response.data as { message: string[] }).message)
        : undefined,
    };
  }

  if (
    error &&
    typeof error === 'object' &&
    'code' in error &&
    'message' in error
  ) {
    return error as ApiError;
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: error instanceof Error ? error.message : 'An unexpected error occurred.',
  };
};