/**
 * Central Navigation & Asset Resolution Utility
 * Ensures safe relative and base-aware routing across Local Dev,
 * Firebase Hosting, and GitHub Pages (/festoria/ subpath).
 */

export const getBaseUrl = (): string => {
  return import.meta.env.BASE_URL || '/';
};

export const getAppUrl = (path: string = ''): string => {
  const base = getBaseUrl().replace(/\/$/, '');
  const cleanPath = path.replace(/^\//, '');
  if (!cleanPath) {
    return `${base}/`;
  }
  if (cleanPath.startsWith('?') || cleanPath.startsWith('#')) {
    return `${base}/${cleanPath}`;
  }
  return `${base}/${cleanPath}`;
};

export const navigateTo = (path: string = '') => {
  window.location.href = getAppUrl(path);
};

