// Simple fetch wrapper using the public base URL
export const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL!;
const apiKey = process.env.NEXT_PUBLIC_API_KEY;

if (!apiBase) {
  console.warn('NEXT_PUBLIC_API_BASE_URL is not defined');
}

if (!apiKey) {
  console.warn('NEXT_PUBLIC_API_KEY is not defined - API calls may fail');
}

export async function api<T = any>(path: string, init?: RequestInit): Promise<T> {
  const url = apiBase.replace(/\/$/, '') + path; // ensure no double slash
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  // Merge with existing headers
  if (init?.headers) {
    Object.assign(headers, init.headers);
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
export async function uploadFile<T = any>(path: string, file: File): Promise<T> {
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
