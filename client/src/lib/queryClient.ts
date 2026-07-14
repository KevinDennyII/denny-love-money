import { QueryClient, QueryFunction } from "@tanstack/react-query";

/** Prefer API `{ error: string }` bodies over opaque status text. */
export async function getErrorMessage(res: Response): Promise<string> {
  const text = await res.text();
  if (!text) return res.statusText || `Request failed (${res.status})`;

  try {
    const json = JSON.parse(text) as { error?: unknown; message?: unknown };
    if (typeof json.error === "string" && json.error.trim()) return json.error;
    if (typeof json.message === "string" && json.message.trim()) return json.message;
  } catch {
    // not JSON
  }

  return text.length > 300 ? `${text.slice(0, 300)}…` : text;
}

export function toErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error.trim()) return error;
  return fallback;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const message = await getErrorMessage(res);
    throw new Error(`${res.status}: ${message}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
