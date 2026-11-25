// src/api/client.ts



export interface ApiResponse<T = any> {
  isSuccess: boolean;
  statusCode: number; 
  result: T | null;
  errorMessages: string[];
}

export async function apiFetch<T = any>(
  path: string,
  options: RequestInit & { accessToken?: string | null } = {}
): Promise<ApiResponse<T>> {
  const { accessToken, ...rest } = options;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(rest.headers || {}),
  };



  const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}${path}`, {
    ...rest,
    headers,
    credentials: "include", 
  });

  const data = (await res.json()) as ApiResponse<T>;
  return data;
}
