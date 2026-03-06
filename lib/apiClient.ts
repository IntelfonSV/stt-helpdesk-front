const API_BASE_URL = import.meta.env.VITE_API_URL;

if (!API_BASE_URL) {
  console.warn("⚠️ VITE_API_URL no está definido en .env");
}

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface ApiRequestOptions extends RequestInit {
  authToken?: string;
  query?: Record<string, string | number | boolean | undefined>;
}

export class ApiError extends Error {
  status: number;
  data: unknown;
  url: string;

  constructor(message: string, status: number, data: unknown, url: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
    this.url = url;
  }
}

/**
 * Función para cerrar sesión y limpiar datos locales
 */
export function logout() {
  console.warn("🔐 Cerrando sesión");
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/login";
}

/**
 * Construye querystring ?a=1&b=2 a partir de un objeto
 */
function buildQueryString(query?: ApiRequestOptions["query"]): string {
  if (!query) return "";
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, String(value));
    }
  });

  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

function isJsonResponse(response: Response): boolean {
  const contentType = response.headers.get("content-type") || "";
  return contentType.includes("application/json");
}

/**
 * Wrapper genérico de fetch.
 */
export async function apiRequest<T>(
  path: string,
  method: HttpMethod = "GET",
  options: ApiRequestOptions = {}
): Promise<T> {
  const { authToken, query, headers, body, ...rest } = options;

  const url = `${API_BASE_URL}${path}${buildQueryString(query)}`;

  const finalHeaders: HeadersInit = {
    ...(headers || {}),
  };

  if (!(body instanceof FormData)) {
    finalHeaders["Content-Type"] = "application/json";
  }

  if (authToken) {
    finalHeaders["Authorization"] = `Bearer ${authToken}`;
  }

  const response = await fetch(url, {
    method,
    headers: finalHeaders,
    body:
      body instanceof FormData
        ? body
        : body
          ? JSON.stringify(body)
          : undefined,
    ...rest,
  });

  console.log(response);

  if (!response.ok) {
    let errorData: unknown = null;
    let errorMessage = `Error ${response.status} en ${url}: ${response.statusText}`;

    try {
      if (isJsonResponse(response)) {
        errorData = await response.json();

        if (
          errorData &&
          typeof errorData === "object" &&
          "message" in errorData &&
          typeof (errorData as { message?: unknown }).message === "string"
        ) {
          errorMessage = (errorData as { message: string }).message;
        } else if (
          errorData &&
          typeof errorData === "object" &&
          "error" in errorData &&
          typeof (errorData as { error?: unknown }).error === "string"
        ) {
          errorMessage = (errorData as { error: string }).error;
        }
      } else {
        const text = await response.text();
        errorData = text;
        if (text) {
          errorMessage = text;
        }
      }
    } catch (parseErr) {
      console.warn("No se pudo parsear la respuesta de error:", parseErr);
    }

    const isAuthRoute = path.startsWith("/auth/login");

    // Solo cerrar sesión automáticamente si es una ruta protegida,
    // no durante el intento de login.
    if (!isAuthRoute && (response.status === 401 || response.status === 403)) {
      logout();
    }

    throw new ApiError(errorMessage, response.status, errorData, url);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  if (isJsonResponse(response)) {
    return (await response.json()) as T;
  }

  return (await response.text()) as T;
}