import AuthError from "@/exceptions/auth_error";
import { createLogger } from "@/libraries/logger";

interface APIClientProps {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string;
  params?: Record<string, string | number | boolean | null>;
  body?: Record<string, unknown>;
  accessToken?: string;
}

const apiClientLogger = createLogger("api_client");

function resolveBasePath(isClient: boolean): string | undefined {
  const serverBasePath =
    process.env.NEXT_SERVER_COMPONENT_BACKEND_API_BASE_URL ||
    process.env.NEXT_BACKEND_API_BASE_URL;
  const clientBasePath =
    process.env.NEXT_PUBLIC_CLIENT_COMPONENT_BACKEND_API_BASE_URL ||
    process.env.NEXT_BACKEND_API_BASE_URL;

  return serverBasePath || (isClient ? clientBasePath : undefined);
}

function toPathname(path: string): string {
  try {
    return new URL(path, "http://localhost").pathname;
  } catch {
    return path.split("?")[0] ?? path;
  }
}

export async function APIClient<T>({
  method = "GET",
  path,
  params = undefined,
  body = undefined,
  accessToken = undefined,
}: APIClientProps): Promise<T> {
  const isClient = typeof window !== "undefined";
  const basePath = resolveBasePath(isClient) ?? "";
  let url = `${basePath}${path}`;
  if (params) {
    // remove undefined values
    Object.keys(params).forEach(
      (key) => params[key] === undefined && delete params[key]
    );
    const searchParams: Record<string, string> = {};
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null) {
        searchParams[key] = String(value);
      }
    });
    url += "?" + new URLSearchParams(searchParams).toString();
  }

  apiClientLogger.debug("api_client.request", "API request", {
    context: {
      method,
      pathname: toPathname(path),
    },
  });

  const headers: Record<string, string> = {};
  if (accessToken) {
    headers.authorization = "bearer " + accessToken;
  }

  if (body) {
    headers["Content-Type"] = "application/json";
  }
  const response = await fetch(url, {
    method: method,
    headers: headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401) {
    throw new AuthError("Unauthorized");
  }

  if (response.status === 403) {
    throw new AuthError("Unauthorized");
  }

  return response.json();
}
