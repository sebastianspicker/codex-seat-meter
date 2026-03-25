export function getDashboardAuthRequestInit(
  secret?: string | null
): RequestInit | undefined {
  const trimmed = typeof secret === "string" ? secret.trim() : "";
  if (!trimmed) return undefined;
  return {
    headers: {
      "x-dashboard-secret": trimmed,
    },
  };
}
