const base = (import.meta.env.VITE_API_BASE_URL as string) ||
  (typeof window !== 'undefined' ? window.location.origin : '');

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const url = `${base}${path}`;
  return fetch(url, {
    ...init,
    cache: 'no-store',
  });
}
