import BRANDING from '../../branding';

type Props = {
  className?: string;
};

/**
 * Renders the app logo from branding config. Supports image (path) or inline SVG.
 */
export default function Logo({ className = '' }: Props) {
  const { logo } = BRANDING;

  if (logo.type === 'image' && logo.imageSrc) {
    return (
      <img
        src={logo.imageSrc}
        alt={logo.alt}
        className={`shrink-0 ${className}`.trim()}
        aria-hidden
      />
    );
  }

  if (logo.type === 'svg' && logo.svgPath) {
    const viewBox = logo.svgViewBox ?? '0 0 24 24';
    const wrapClass = logo.backgroundColor ? `inline-flex ${logo.backgroundColor} rounded` : '';
    const svg = (
      <svg
        viewBox={viewBox}
        className={`shrink-0 ${className}`.trim()}
        aria-hidden
      >
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={logo.svgPath}
        />
      </svg>
    );
    return wrapClass ? <span className={wrapClass}>{svg}</span> : svg;
  }

  return null;
}
