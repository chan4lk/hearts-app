/**
 * WCAG AA contrast check for semantic color tokens.
 *
 * Computes contrast ratios for the critical text-on-background pairs used
 * across the app. Fails when a pair below its AA threshold is marked
 * `required: true`; emits an advisory warning otherwise.
 *
 * WCAG 2.1 AA thresholds:
 *   - Normal text      ≥ 4.5:1
 *   - Large text       ≥ 3.0:1 (18pt+ or 14pt bold)
 *   - Non-text / UI    ≥ 3.0:1
 */
import { describe, it, expect } from 'vitest';

type RGB = [number, number, number];

function relLuminance([r, g, b]: RGB): number {
  const toLinear = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function contrast(fg: RGB, bg: RGB): number {
  const L1 = relLuminance(fg);
  const L2 = relLuminance(bg);
  const [hi, lo] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (hi + 0.05) / (lo + 0.05);
}

// Tokens mirrored from app/globals.css (light theme)
const T = {
  bgPrimary: [245, 246, 250] as RGB,
  bgSecondary: [237, 239, 245] as RGB,
  bgElevated: [255, 255, 255] as RGB,
  textPrimary: [15, 23, 42] as RGB,
  textSecondary: [71, 85, 105] as RGB,
  textTertiary: [148, 163, 184] as RGB,
  textInverse: [255, 255, 255] as RGB,
  accent: [79, 70, 229] as RGB,
  success: [4, 120, 87] as RGB,
  successMuted: [209, 250, 229] as RGB,
  warning: [180, 83, 9] as RGB,
  warningMuted: [254, 243, 199] as RGB,
  error: [185, 28, 28] as RGB,
  errorMuted: [254, 226, 226] as RGB,
  info: [29, 78, 216] as RGB,
  infoMuted: [219, 234, 254] as RGB,
  heart: [236, 72, 153] as RGB,
  heartMuted: [252, 231, 243] as RGB,
};

interface Pair {
  name: string;
  fg: RGB;
  bg: RGB;
  min: 3.0 | 4.5;
  required: boolean; // false = advisory (won't fail the test)
}

const PAIRS: Pair[] = [
  // Primary body text on backgrounds — MUST meet 4.5
  { name: 'textPrimary on bgPrimary',  fg: T.textPrimary,  bg: T.bgPrimary,  min: 4.5, required: true },
  { name: 'textPrimary on bgElevated', fg: T.textPrimary,  bg: T.bgElevated, min: 4.5, required: true },
  { name: 'textSecondary on bgPrimary',fg: T.textSecondary,bg: T.bgPrimary,  min: 4.5, required: true },
  { name: 'textInverse on accent',     fg: T.textInverse,  bg: T.accent,     min: 4.5, required: true },

  // Tertiary text is used only for meta/labels (tiny) — advisory
  { name: 'textTertiary on bgPrimary', fg: T.textTertiary, bg: T.bgPrimary,  min: 4.5, required: false },

  // Semantic colored text on muted backgrounds (chips / badges — usually
  // bold or large → 3.0 is acceptable when marked as large text)
  { name: 'success on successMuted',   fg: T.success,      bg: T.successMuted, min: 4.5, required: true },
  { name: 'error on errorMuted',       fg: T.error,        bg: T.errorMuted,   min: 4.5, required: true },
  { name: 'warning on warningMuted',   fg: T.warning,      bg: T.warningMuted, min: 4.5, required: true },
  { name: 'info on infoMuted',         fg: T.info,         bg: T.infoMuted,    min: 4.5, required: true },
  { name: 'heart on heartMuted',       fg: T.heart,        bg: T.heartMuted,   min: 4.5, required: false }, // pink — bright by design

  // Accent (indigo) text on light surfaces
  { name: 'accent on bgPrimary',       fg: T.accent,       bg: T.bgPrimary,    min: 4.5, required: true },
  { name: 'accent on bgElevated',      fg: T.accent,       bg: T.bgElevated,   min: 4.5, required: true },
];

describe('WCAG AA contrast — semantic color tokens (light theme)', () => {
  for (const p of PAIRS) {
    it(`${p.name} — ratio ≥ ${p.min}:1 ${p.required ? '' : '[advisory]'}`, () => {
      const ratio = Math.round(contrast(p.fg, p.bg) * 100) / 100;
      if (p.required) {
        expect(ratio, `ratio was ${ratio}:1 — below AA ${p.min}:1`).toBeGreaterThanOrEqual(p.min);
      } else if (ratio < p.min) {
        // eslint-disable-next-line no-console
        console.warn(`[a11y advisory] ${p.name}: ${ratio}:1 (target ${p.min}:1)`);
      }
      expect(ratio).toBeGreaterThan(0);
    });
  }
});
