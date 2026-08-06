import react from '@vitejs/plugin-react'
// defineConfig vem de 'vitest/config', e não de 'vite': é a mesma função,
// só que ciente da chave `test` abaixo. Importar de 'vite' faz o tsc acusar
// propriedade desconhecida.
import { defineConfig, coverageConfigDefaults } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  test: {
    // jsdom dá ao teste um DOM de mentira — sem ele não há document para
    // a Testing Library consultar.
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],

    // Sem globals: cada teste importa describe/it/expect de 'vitest'.
    // Fica explícito de onde vem cada coisa e o tsc não precisa de tipos
    // globais extras.
    globals: false,

    // styled-components injeta CSS de verdade; sem isto o Vitest ignora
    // os estilos e asserção sobre classe/estilo computado mente.
    css: true,

    include: ['src/**/*.{test,spec}.{ts,tsx}'],

    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        ...coverageConfigDefaults.exclude,
        'src/main.tsx',
        'src/test/**',
        'src/types/**',
        'src/**/styles.ts',
        'src/styles/**',
      ],
    },
  },
})
