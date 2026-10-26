
const API_BASE = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000"
).replace(/\/+$/, "");

type ApiOptions = {
  method?: "GET" | "POST";
  body?: unknown;
};

type ApiErrorResponse = {
  error?: string;
  message?: string;
  requiresEmailVerification?: boolean;
  requiresLoginVerification?: boolean;
  email?: string;
};

export class ApiError extends Error {
  readonly status: number;
  readonly requiresEmailVerification: boolean;
  readonly requiresLoginVerification: boolean;
  readonly email?: string;

  constructor(
    message: string,
    status: number,
    requiresEmailVerification = false,
    email?: string,
    requiresLoginVerification = false,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.requiresEmailVerification = requiresEmailVerification;
    this.requiresLoginVerification = requiresLoginVerification;
  }
}

export async function api<T>(
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  const hasBody = options.body !== undefined;

  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method ?? "GET",
    credentials: "include",
    headers: hasBody
      ? { "Content-Type": "application/json" }
      : undefined,
    body: hasBody ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const data = (await response.json().catch(() => ({}))) as ApiErrorResponse;

  if (!response.ok) {
    throw new ApiError(
      data.error || data.message || "Something went wrong. Please try again.",
      response.status,
      data.requiresEmailVerification === true,
      data.email,
      data.requiresLoginVerification === true,
    );
  }

  return data as T;
}

export type AuthUser = {
  id: string;
  name: string;
  email: string;
};
