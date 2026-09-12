// Redux thunks reject with the plain ApiError object produced by lib/apiError
// (not an Error instance), so err instanceof Error misses it. This helper
// extracts the backend's message plus class-validator details when present.
export const getApiErrorMessage = (err: unknown, fallback: string): string => {
  if (err && typeof err === 'object') {
    const e = err as { message?: unknown; validationMessages?: unknown };
    const parts: string[] = [];

    if (typeof e.message === 'string' && e.message.trim()) {
      parts.push(e.message.trim());
    }
    if (Array.isArray(e.validationMessages) && e.validationMessages.length > 0) {
      const details = e.validationMessages
        .filter((m): m is string => typeof m === 'string' && m.trim().length > 0)
        .join(', ');
      if (details) parts.push(details);
    }
    if (parts.length > 0) return parts.join(' — ');
  }

  if (err instanceof Error && err.message) return err.message;
  return fallback;
};
