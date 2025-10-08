export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const;

export type SpacingToken = keyof typeof spacing;

export const radii = {
  sm: 4,
  md: 8,
  lg: 12,
} as const;

export type RadiusToken = keyof typeof radii;

export const fontSizes = {
  xs: '12px',
  sm: '14px',
  md: '16px',
  lg: '20px',
  xl: '24px',
} as const;

export type FontSizeToken = keyof typeof fontSizes;

export const tokens = {
  spacing,
  radii,
  fontSizes,
};

export type ThemeTokens = typeof tokens;
