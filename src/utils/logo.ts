import festoriaLogoUrl from '../assets/festoria-logo.jpg';
import { getAppUrl } from './navigation';

/**
 * Universal Festoria Logo Asset
 * Automatically resolves the bundled asset URL respecting Vite's base path (/festoria/ on GitHub Pages),
 * preventing broken image 404 errors across all hosting environments.
 */
export const FESTORIA_LOGO: string = festoriaLogoUrl || getAppUrl('festoria-logo.jpg');
