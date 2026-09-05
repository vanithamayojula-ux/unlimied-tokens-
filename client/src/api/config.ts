/**
 * Global API Configuration for Frontend -> Backend communication.
 * Reads VITE_API_URL or VITE_API_BASE_URL from environment variables (e.g. Vercel dashboard or .env).
 * Falls back to relative path ('') for local dev / same-origin deployments.
 */
export const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  ''
).replace(/\/$/, '');

export function getApiUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
}
