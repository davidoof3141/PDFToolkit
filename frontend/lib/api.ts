// Simple fetch wrapper using the public base URL
export const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL!;

if (!apiBase) {
   
  console.warn('NEXT_PUBLIC_API_BASE_URL is not defined');
}

export async function api<T = any>(path: string, init?: RequestInit): Promise<T> {
  const url = apiBase.replace(/\/$/, '') + path; // ensure no double slash
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`Request failed ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}
