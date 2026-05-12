export const theme = {
  colors: {
    // ── Brand ──────────────────────────────────────────────────────────────
    primary:        '#22c55e',
    primaryHover:   '#16a34a',
    primaryDark:    '#166534',
    primaryLight:   '#dcfce7',
    primarySubtle:  '#f0fdf4',

    // ── Backgrounds ─────────────────────────────────────────────────────────
    bgApp:          '#f0fdf4',   // tela principal (mint claro)
    bgSidebar:      '#ffffff',
    bgCard:         '#ffffff',
    bgOverlay:      'rgba(0, 0, 0, 0.4)',

    // ── Texto ────────────────────────────────────────────────────────────────
    textPrimary:    '#111827',
    textSecondary:  '#6b7280',
    textMuted:      '#9ca3af',
    textOnPrimary:  '#ffffff',

    // ── Borda ────────────────────────────────────────────────────────────────
    border:         '#e5e7eb',
    borderLight:    '#f3f4f6',

    // ── Status ───────────────────────────────────────────────────────────────
    success:        '#22c55e',
    successLight:   '#dcfce7',
    warning:        '#f59e0b',
    warningLight:   '#fef3c7',
    error:          '#ef4444',
    errorLight:     '#fee2e2',
    info:           '#3b82f6',
    infoLight:      '#dbeafe',

    // ── Outros ───────────────────────────────────────────────────────────────
    white:          '#ffffff',
    black:          '#000000',
  },

  // ── Tipografia ─────────────────────────────────────────────────────────────
  fonts: {
    sans: "'Inter', 'Segoe UI', sans-serif",
  },

  fontSizes: {
    xs:   '0.75rem',   // 12px
    sm:   '0.875rem',  // 14px
    md:   '1rem',      // 16px
    lg:   '1.125rem',  // 18px
    xl:   '1.25rem',   // 20px
    '2xl':'1.5rem',    // 24px
    '3xl':'1.875rem',  // 30px
  },

  fontWeights: {
    regular:   400,
    medium:    500,
    semibold:  600,
    bold:      700,
  },

  // ── Espaçamento ────────────────────────────────────────────────────────────
  spacing: {
    1:  '4px',
    2:  '8px',
    3:  '12px',
    4:  '16px',
    5:  '20px',
    6:  '24px',
    8:  '32px',
    10: '40px',
    12: '48px',
  },

  // ── Bordas ─────────────────────────────────────────────────────────────────
  radii: {
    sm:   '6px',
    md:   '10px',
    lg:   '14px',
    xl:   '20px',
    full: '9999px',
  },

  // ── Sombras ────────────────────────────────────────────────────────────────
  shadows: {
    sm:  '0 1px 3px rgba(0,0,0,0.08)',
    md:  '0 4px 12px rgba(0,0,0,0.08)',
    lg:  '0 8px 24px rgba(0,0,0,0.1)',
  },

  // ── Layout ─────────────────────────────────────────────────────────────────
  sidebar: {
    width: '220px',
  },
}
