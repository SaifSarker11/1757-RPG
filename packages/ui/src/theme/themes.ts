/**
 * DaisyUI Theme Bridge for Dynamic SVG Components
 * 
 * Instead of maintaining a parallel JSON theme system, this maps DaisyUI's 
 * CSS variable tokens (oklch-based) into SVG-compatible hex colors at runtime.
 * 
 * This means ALL 35 DaisyUI themes work automatically with zero configuration.
 * When a user picks "cyberpunk" or "synthwave" in the theme modal, 
 * the SVGs instantly re-theme themselves.
 */

export type AssetColors = {
  primary: string;
  secondary: string;
  accent: string;
  neutral: string;
  base100: string;
  base200: string;
  base300: string;
  baseContent: string;
  primaryContent: string;
};

/**
 * Reads the current DaisyUI theme's computed CSS colors from the DOM.
 * Must be called client-side only (inside useEffect or event handlers).
 * Returns hex strings safe for SVG fill/stroke attributes.
 */
export function getComputedThemeColors(element?: HTMLElement): AssetColors {
  const el = element ?? document.documentElement;
  const style = getComputedStyle(el);

  const readColor = (varName: string, fallback: string): string => {
    // DaisyUI v4+ uses oklch. We resolve to the computed rgb by reading
    // the color from a temporary element, or just use the raw value.
    const raw = style.getPropertyValue(varName).trim();
    if (!raw) return fallback;

    // Create a temporary element to let the browser resolve oklch → rgb
    const temp = document.createElement('div');
    temp.style.color = raw.startsWith('oklch') ? raw : `oklch(${raw})`;
    temp.style.display = 'none';
    document.body.appendChild(temp);
    const resolved = getComputedStyle(temp).color;
    document.body.removeChild(temp);

    // Convert "rgb(r, g, b)" → "#rrggbb"
    const match = resolved.match(/(\d+),?\s*(\d+),?\s*(\d+)/);
    if (!match) return fallback;
    const [, r, g, b] = match;
    return `#${Number(r).toString(16).padStart(2, '0')}${Number(g).toString(16).padStart(2, '0')}${Number(b).toString(16).padStart(2, '0')}`;
  };

  return {
    primary: readColor('--color-primary', '#6419E6'),
    secondary: readColor('--color-secondary', '#D926A9'),
    accent: readColor('--color-accent', '#1FB2A6'),
    neutral: readColor('--color-neutral', '#2A323C'),
    base100: readColor('--color-base-100', '#FFFFFF'),
    base200: readColor('--color-base-200', '#F2F2F2'),
    base300: readColor('--color-base-300', '#E5E6E6'),
    baseContent: readColor('--color-base-content', '#1F2937'),
    primaryContent: readColor('--color-primary-content', '#FFFFFF'),
  };
}
