// src/lib/apiClient.ts
const API_BASE_URL = import.meta.env.VITE_API_URL;

if (!API_BASE_URL) {
  console.warn("⚠️ VITE_API_URL no está definido en .env");
}

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface ApiRequestOptions extends RequestInit {
  authToken?: string;       // opcional, por si usas JWT luego
  query?: Record<string, string | number | boolean | undefined>;
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
    "Content-Type": "application/json",
    ...(headers || {}),
  };

  if (authToken) {
    finalHeaders["Authorization"] = `Bearer ${authToken}`;
  }

  const response = await fetch(url, {
    method,
    headers: finalHeaders,
    body: body ? JSON.stringify(body) : undefined,
    ...rest,
  });

   console.log(response)

  if (!response.ok) {
    // Aquí puedes centralizar manejo de errores, log, etc.
    const text = await response.text();
    throw new Error(
      `Error ${response.status} en ${url}: ${text || response.statusText}`
    );
  }

  // Si la API a veces devuelve 204 sin body
  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
