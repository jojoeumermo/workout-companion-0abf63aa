// Always use absolute URL based on current origin to avoid mobile 404 issues
// Relative URLs can fail when the service worker intercepts or proxy mismatches ports
const base = (import.meta.env.VITE_API_BASE_URL as string) ||
  (typeof window !== 'undefined' ? window.location.origin : '');

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const url = `${base}${path}`;
  console.log('[api]', (init as RequestInit & { method?: string })?.method || 'GET', url);
  return fetch(url, {
    ...init,
    // Prevent service worker or browser cache from intercepting API calls
    cache: 'no-store',
  });
}
