export const unwrapApiResponse = <T>(payload: unknown): T => {
  if (
    payload &&
    typeof payload === 'object' &&
    'success' in payload &&
    (payload as { success?: unknown }).success === true &&
    'data' in payload
  ) {
    return unwrapApiResponse<T>((payload as { data: unknown }).data);
  }

  return payload as T;
};