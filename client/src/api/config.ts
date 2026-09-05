/**
 * Global API Configuration for Vercel deployment.
 * Unified deployment serves frontend and API serverless functions on the same origin.
 * Relative path ('') routes requests to Vercel's /api and /v1 rewrites cleanly.
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
