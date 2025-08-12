// Simple fetch wrapper using the public base URL
export const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL!;
const apiKey = process.env.NEXT_PUBLIC_API_KEY;

if (!apiBase) {
  console.warn('NEXT_PUBLIC_API_BASE_URL is not defined');
}

if (!apiKey) {
  console.warn('NEXT_PUBLIC_API_KEY is not defined - API calls may fail');
}

export async function api<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const url = apiBase.replace(/\/$/, '') + path; // ensure no double slash
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  // Merge with existing headers
  if (init?.headers) {
    const initHeaders = new Headers(init.headers as HeadersInit);
    initHeaders.forEach((value, key) => {
      headers[key] = value as string;
    });
  }
  
  // Add API key if available
  if (apiKey) {
    headers['X-API-Key'] = apiKey;
  }
  
  const res = await fetch(url, {
    ...init,
    headers,
    cache: 'no-store',
  });
  
  if (!res.ok) {
    const errorText = await res.text().catch(() => 'Unknown error');
    throw new Error(`Request failed ${res.status} ${res.statusText}: ${errorText}`);
  }
  
  return res.json() as Promise<T>;
}

// Special function for file uploads (multipart/form-data)
export async function uploadFile<T = unknown>(path: string, file: File): Promise<T> {
  const url = apiBase.replace(/\/$/, '') + path;
  
  const formData = new FormData();
  formData.append('file', file);
  
  const headers: Record<string, string> = {};
  
  // Add API key if available
  if (apiKey) {
    headers['X-API-Key'] = apiKey;
  }
  
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: formData,
    cache: 'no-store',
  });
  
  if (!res.ok) {
    const errorText = await res.text().catch(() => 'Unknown error');
    throw new Error(`Upload failed ${res.status} ${res.statusText}: ${errorText}`);
  }
  
  return res.json() as Promise<T>;
}

// Helper for endpoints that return binary (e.g., PDF download)
export async function apiBlob(path: string, init?: RequestInit): Promise<Blob> {
  const url = apiBase.replace(/\/$/, '') + path;

  const headers: Record<string, string> = {};

  // Merge with existing headers
  if (init?.headers) {
    const initHeaders = new Headers(init.headers as HeadersInit);
    initHeaders.forEach((value, key) => {
      headers[key] = value as string;
    });
  }

  // Add API key if available
  if (apiKey) {
    headers['X-API-Key'] = apiKey;
  }

  const res = await fetch(url, {
    ...init,
    headers,
    cache: 'no-store',
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => 'Unknown error');
    throw new Error(`Request failed ${res.status} ${res.statusText}: ${errorText}`);
  }

  return res.blob();
}
