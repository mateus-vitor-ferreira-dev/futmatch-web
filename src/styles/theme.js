const base = {
  fonts: {
    sans: "'Inter', 'Segoe UI', sans-serif",
  },

  fontSizes: {
    xs:   '0.75rem',
    sm:   '0.875rem',
    md:   '1rem',
    lg:   '1.125rem',
    xl:   '1.25rem',
    '2xl':'1.5rem',
    '3xl':'1.875rem',
  },

  fontWeights: {
    regular:  400,
    medium:   500,
    semibold: 600,
    bold:     700,
  },

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

  radii: {
    sm:   '6px',
    md:   '10px',
    lg:   '14px',
    xl:   '20px',
    full: '9999px',
  },

  shadows: {
    sm:  '0 1px 3px rgba(0,0,0,0.08)',
    md:  '0 4px 12px rgba(0,0,0,0.08)',
    lg:  '0 8px 24px rgba(0,0,0,0.1)',
  },

  sidebar: {
    width: '220px',
  },
}

export const lightTheme = {
  ...base,
  colors: {
    primary:       '#22c55e',
    primaryHover:  '#16a34a',
    primaryDark:   '#166534',
    primaryLight:  '#dcfce7',
    primarySubtle: '#f0fdf4',

    bgApp:         '#f0fdf4',
    bgPage:        '#f9fafb',
    bgSidebar:     '#ffffff',
    bgCard:        '#ffffff',
    bgOverlay:     'rgba(0, 0, 0, 0.4)',

    textPrimary:   '#111827',
    textSecondary: '#6b7280',
    textMuted:     '#9ca3af',
    textOnPrimary: '#ffffff',

    border:        '#e5e7eb',
    borderLight:   '#f3f4f6',

    success:       '#22c55e',
    successLight:  '#dcfce7',
    warning:       '#f59e0b',
    warningLight:  '#fef3c7',
    error:         '#ef4444',
    errorLight:    '#fee2e2',
    info:          '#3b82f6',
    infoLight:     '#dbeafe',

    white:         '#ffffff',
    black:         '#000000',
  },
}

export const darkTheme = {
  ...base,
  shadows: {
    sm:  '0 1px 3px rgba(0,0,0,0.3)',
    md:  '0 4px 12px rgba(0,0,0,0.3)',
    lg:  '0 8px 24px rgba(0,0,0,0.4)',
  },
  colors: {
    primary:       '#22c55e',
    primaryHover:  '#16a34a',
    primaryDark:   '#4ade80',
    primaryLight:  '#14532d',
    primarySubtle: '#052e16',

    bgApp:         '#0f172a',
    bgPage:        '#0f172a',
    bgSidebar:     '#1e293b',
    bgCard:        '#1e293b',
    bgOverlay:     'rgba(0, 0, 0, 0.6)',

    textPrimary:   '#f1f5f9',
    textSecondary: '#94a3b8',
    textMuted:     '#64748b',
    textOnPrimary: '#ffffff',

    border:        '#334155',
    borderLight:   '#1e293b',

    success:       '#22c55e',
    successLight:  '#14532d',
    warning:       '#f59e0b',
    warningLight:  '#422006',
    error:         '#f87171',
    errorLight:    '#450a0a',
    info:          '#60a5fa',
    infoLight:     '#1e3a5f',

    white:         '#ffffff',
    black:         '#000000',
  },
}

// backward compat — componentes que importam { theme } continuam funcionando
export const theme = lightTheme
