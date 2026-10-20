
const API_BASE =
  (import.meta.env.VITE_API_BASE_URL || "http://localhost:4000").replace(
    /\/+$/,
    "",
  );

type ApiOptions = {
  method?: "GET" | "POST";
  body?: unknown;
};

export async function api<T>(
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method ?? "GET",
    credentials: "include",
    headers: options.body
      ? { "Content-Type": "application/json" }
      : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const data = (await response.json().catch(() => ({}))) as {
    error?: string;
  };

  if (!response.ok) {
    throw new Error(data.error || "Something went wrong. Please try again.");
  }

  return data as T;
}

export type AuthUser = {
  id: string;
  name: string;
  email: string;
};
