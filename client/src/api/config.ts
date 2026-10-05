import { getBackendUrl } from '@/lib/api';

/**
 * Global API Configuration.
 * Dynamically resolves the backend URL from localStorage or environment variables.
 */
export function getApiBaseUrl(): string {
  return getBackendUrl();
}

export const API_BASE_URL = {
  toString() {
    return getBackendUrl();
  },
  valueOf() {
    return getBackendUrl();
  },
  [Symbol.toPrimitive]() {
    return getBackendUrl();
  },
};

export function getApiUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const base = getBackendUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
}
