// Simple fetch wrapper using local API routes
export const apiBase = '/api/proxy'; // Use single proxy route

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
