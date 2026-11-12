import React from 'react';
import festoriaLogoUrl from '../assets/festoria-logo.jpg';
import { getAppUrl } from './navigation';

/**
 * Universal Festoria Logo Asset
 * Automatically resolves the bundled asset URL respecting Vite's base path (/festoria/ on GitHub Pages),
 * preventing broken image 404 errors across all hosting environments.
 */
export const FESTORIA_LOGO: string = festoriaLogoUrl || getAppUrl('festoria-logo.jpg');

/**
 * Inline vector fallback SVG for the Festoria gradient monogram.
 * Guaranteed to render instantly without network requests if the primary asset is ever delayed or blocked.
 */
export const FESTORIA_FALLBACK_SVG: string =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%236366f1"/><stop offset="50%" stop-color="%238b5cf6"/><stop offset="100%" stop-color="%23ec4899"/></linearGradient></defs><rect width="100" height="100" rx="22" fill="url(%23g)"/><text x="50" y="66" font-family="system-ui,sans-serif" font-size="52" font-weight="900" fill="%23ffffff" text-anchor="middle">F</text></svg>';

/**
 * Safe error handler for <img> elements displaying the Festoria logo.
 */
export const handleLogoError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  const target = e.currentTarget;
  if (target.src !== FESTORIA_FALLBACK_SVG) {
    target.src = FESTORIA_FALLBACK_SVG;
  }
};
