/**
 * White-label branding configuration.
 *
 * Central place for all white-label customizations. Change colors, theme, logo,
 * and metadata here; the app and design system consume these values.
 *
 * To white-label for a different client:
 * 1. Update logo (type, imageSrc or svgPath)
 * 2. Change brandName
 * 3. Update metadata for SEO and favicon
 * 4. Customize colors.primaryPalette (main color source). primary, primaryHover, primaryMuted
 *    are derived from it (600, 700, 100). Other semantic tokens (background, text, etc.) stay separate.
 * 5. Set termsOfServiceUrl, privacyPolicyUrl, supportUrl as needed
 *
 * @see design.json and design/design-system.json for semantic usage.
 */

export type LogoType = 'svg' | 'image';

export type PrimaryColorPalette = Record<
  '50' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900',
  string
>;

export interface LogoConfig {
  type: LogoType;
  imageSrc?: string;
  alt: string;
  backgroundColor?: string;
  svgViewBox?: string;
  /** Space-separated polygon/polyline points (for SVG type) */
  svgPath?: string;
}

export interface MetadataConfig {
  title: string;
  description: string;
  favicon?: string;
}

/** Semantic color tokens used by main.jsx for CSS variables and design system */
export interface SemanticColors {
  primary: string;
  primaryHover: string;
  primaryMuted: string;
  background: string;
  surface: string;
  surfaceElevated: string;
  text: string;
  textMuted: string;
  border: string;
  success: string;
  warning: string;
  error: string;
}

export interface BrandingConfig {
  logo: LogoConfig;
  brandName: string;
  metadata: MetadataConfig;
  theme: 'light' | 'dark';
  typography?: {
    fontFamily?: string;
    fontFamilyHeading?: string;
  };
  colors: {
    primaryPalette: PrimaryColorPalette;
  } & SemanticColors;
  termsOfServiceUrl?: string;
  privacyPolicyUrl?: string;
  supportUrl?: string;
}

/**
 * Main color palette (50–900). This is the single source for primary colors.
 * - primary = 600 (buttons, links, active nav)
 * - primaryHover = 700 (hover state)
 * - primaryMuted = 100 (badges, inactive hover). Change these shades in the colors object if needed.
 */
// const PRIMARY_PALETTE: PrimaryColorPalette = {
//   '50': '#FAF5FF',
//   '100': '#F3E8FF',
//   '200': '#E9D5FF',
//   '300': '#D8B4FE',
//   '400': '#C084FC',
//   '500': '#A855F7',
//   '600': '#9333EA',
//   '700': '#7E22CE',
//   '800': '#6B21A8',
//   '900': '#581C87',
// };
const PRIMARY_PALETTE: PrimaryColorPalette = {
  '50': '#EFF6FF',
  '100': '#DBEAFE',
  '200': '#BFDBFE',
  '300': '#93C5FD',
  '400': '#60A5FA',
  '500': '#3B82F6',
  '600': '#2563EB',
  '700': '#1D4ED8',
  '800': '#1E40AF',
  '900': '#1E3A8A',
}

export const BRANDING: BrandingConfig = {
  logo: {
    type: 'image',
    imageSrc: '/logo.svg',
    alt: 'n8n WhatsApp',
    // For SVG: type: 'svg', svgViewBox: '0 0 24 24', svgPath: '13 2 3 14 12 14 11 22 21 10 12 10 13 2', backgroundColor: 'bg-primary'
  },
  brandName: 'n8n WhatsApp',
  metadata: {
    title: 'n8n WhatsApp — WhatsApp at scale',
    description: 'Manage your WhatsApp conversations, campaigns, and AI agents in one place.',
    favicon: '/favicon.ico',
  },
  theme: 'light',
  typography: {
    fontFamily: undefined,
    fontFamilyHeading: undefined,
  },
  colors: {
    primaryPalette: PRIMARY_PALETTE,
    primary: PRIMARY_PALETTE['600'],
    primaryHover: PRIMARY_PALETTE['700'],
    primaryMuted: PRIMARY_PALETTE['100'],
    background: '#f8fafc',
    surface: '#ffffff',
    surfaceElevated: '#ffffff',
    text: '#0f172a',
    textMuted: '#64748b',
    border: '#e2e8f0',
    success: '#059669',
    warning: '#d97706',
    error: '#dc2626',
  },
  termsOfServiceUrl: undefined,
  privacyPolicyUrl: undefined,
  supportUrl: undefined,
};

export default BRANDING;
