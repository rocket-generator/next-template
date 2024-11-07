import AuthError from "@/exceptions/auth_error";

interface APIClientProps {
  method?: string;
  path: string;
  params?: Record<string, any>;
  body?: object;
  accessToken?: string;
}

const serverBasePath =
  process.env.NEXT_SERVER_COMPONENT_BACKEND_API_BASE_URL ||
  process.env.NEXT_BACKEND_API_BASE_URL;
const clientBasePath =
  process.env.NEXT_PUBLIC_CLIENT_COMPONENT_BACKEND_API_BASE_URL ||
  process.env.NEXT_BACKEND_API_BASE_URL;

export async function APIClient<T>({
  method = "GET",
  path,
  params = undefined,
  body = undefined,
  accessToken = undefined,
}: APIClientProps): Promise<T> {
  const isClient = typeof window !== "undefined";
  let url = (isClient ? clientBasePath : serverBasePath) + path;
  if (params) {
    // remove undefined values
    Object.keys(params).forEach(
      (key) => params[key] === undefined && delete params[key],
    );
    url += "?" + new URLSearchParams(params).toString();
  }
  console.log("URL:", url);
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
