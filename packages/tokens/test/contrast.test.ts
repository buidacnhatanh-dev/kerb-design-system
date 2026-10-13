import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Reads the built output, so run `pnpm build` first.
type Colors = Record<string, string>;
const tokens = JSON.parse(
  readFileSync(new URL('../dist/tokens.json', import.meta.url), 'utf8'),
) as Record<string, { color: Colors }>;

/** WCAG 2.x relative luminance of a #RRGGBB colour. */
function luminance(hex: string): number {
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!match?.[1]) throw new Error(`Expected a #RRGGBB colour, got "${hex}"`);
  const value = parseInt(match[1], 16);
  const [r, g, b] = [value >> 16, (value >> 8) & 0xff, value & 0xff].map((channel) => {
    const c = channel / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (light + 0.05) / (dark + 0.05);
}

const TEXT = 4.5;
const NON_TEXT = 3;

describe.each(['light', 'dark', 'comfort'])('%s theme contrast', (theme) => {
  const color = (name: string): string => {
    const value = tokens[theme]?.color[name];
    if (!value) throw new Error(`Missing token color.${name} in ${theme}`);
    return value;
  };
  const ratio = (fg: string, bg: string) => contrast(color(fg), color(bg));

  it.each(
    ['text', 'text-muted', 'danger', 'success', 'link'].flatMap((fg) => [
      [fg, 'bg'],
      [fg, 'surface'],
    ]),
  )('%s on %s is at least 4.5 : 1', (fg, bg) => {
    expect(ratio(fg, bg)).toBeGreaterThanOrEqual(TEXT);
  });

  it.each([
    ['on-primary', 'action-primary'],
    ['on-primary', 'action-primary-hover'],
    ['on-danger', 'danger'],
  ])('%s on %s is at least 4.5 : 1', (fg, bg) => {
    expect(ratio(fg, bg)).toBeGreaterThanOrEqual(TEXT);
  });

  it('border-input on bg is at least 3 : 1', () => {
    expect(ratio('border-input', 'bg')).toBeGreaterThanOrEqual(NON_TEXT);
  });

  it('one of the two focus rings is at least 3 : 1 on bg', () => {
    expect(Math.max(ratio('focus', 'bg'), ratio('focus-ink', 'bg'))).toBeGreaterThanOrEqual(
      NON_TEXT,
    );
  });
});
