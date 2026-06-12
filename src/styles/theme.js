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
  mode: 'light',
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
    bgInput:       '#ffffff',
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
    warningText:   '#92400e',
    warningBorder: '#fde68a',
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
  mode: 'dark',
  shadows: {
    sm:  '0 1px 3px rgba(0,0,0,0.55), 0 1px 2px rgba(0,0,0,0.35)',
    md:  '0 4px 12px rgba(0,0,0,0.65), 0 2px 4px rgba(0,0,0,0.45)',
    lg:  '0 8px 24px rgba(0,0,0,0.75), 0 4px 8px rgba(0,0,0,0.55)',
  },
  colors: {
    // Verde só como acento, nunca como fundo — mesmo padrão do Recanto Vila Rica
    primary:       '#3ecf8e',
    primaryHover:  '#2db87a',
    primaryDark:   '#1da066',
    primaryLight:  '#0d1f15',
    primarySubtle: '#163d26',

    bgApp:         '#111111',
    bgPage:        '#111111',
    bgSidebar:     '#1c1c1c',
    bgCard:        '#1c1c1c',
    bgInput:       '#0e0e0e',
    bgOverlay:     'rgba(0, 0, 0, 0.7)',

    textPrimary:   '#e8e8e8',
    textSecondary: '#a0a0a0',
    textMuted:     '#666666',
    textOnPrimary: '#ffffff',

    border:        '#2c2c2c',
    borderLight:   '#272727',

    success:       '#4ade80',
    successLight:  '#0a2018',
    warning:       '#fbbf24',
    warningLight:  '#1a1000',
    warningText:   '#f59e0b',
    warningBorder: '#78350f',
    error:         '#f87171',
    errorLight:    '#1a0808',
    info:          '#93c5fd',
    infoLight:     '#080f1c',

    white:         '#ffffff',
    black:         '#000000',
  },
}

// backward compat — componentes que importam { theme } continuam funcionando
export const theme = lightTheme
