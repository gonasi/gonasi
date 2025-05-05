/**
 * Converts a CSS HSL color string into an HSLA string using a percentage-based opacity.
 *
 * @param {string} hsl - The HSL color string (e.g., `"hsl(0 100% 45%)"`). Only space-separated format is supported.
 * @param {number} opacity - Opacity as an integer from 1 to 99 (representing 1% to 99% opacity).
 * @returns {string} The resulting HSLA color string (e.g., `"hsla(0 100% 45% / 0.41)"`).
 *
 * @throws {Error} If the HSL string format is invalid.
 * @throws {Error} If the opacity is not a whole number between 1 and 99.
 */
export function hslToHsla(hsl: string, opacity: number): string {
  // Validate HSL format
  const match = hsl.match(/^hsl\(([^)]+)\)$/);

  if (!match) {
    throw new Error('Invalid HSL format. Expected format: hsl(0 100% 45%)');
  }

  // Validate opacity range and ensure it's an integer between 1 and 99
  if (!Number.isInteger(opacity) || opacity < 1 || opacity > 99) {
    throw new Error('Opacity must be an integer between 1 and 99.');
  }
  const alpha = opacity / 100;
  const hslValues = match[1]?.trim();

  return `hsla(${hslValues} / ${alpha})`;
}
