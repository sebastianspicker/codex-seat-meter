/**
 * Extract a safe error message from an unknown thrown value.
 */
export function getErrorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}
