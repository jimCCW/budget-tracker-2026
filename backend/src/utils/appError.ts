/**
 * Creates a typed error that errorHandler maps to the correct HTTP response.
 * @param code - Machine-readable error code (e.g. 'NOT_FOUND', 'CONFLICT').
 * @param message - Human-readable message returned to the client.
 * @param status - HTTP status code to send.
 * @returns An Error instance with `code` and `status` properties attached.
 */
export function appError(
  code: string,
  message: string,
  status: number
): Error & { code: string; status: number } {
  const err = new Error(message) as Error & { code: string; status: number };
  err.code = code;
  err.status = status;
  return err;
}
