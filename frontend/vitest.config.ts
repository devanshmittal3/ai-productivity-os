import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(viteConfig, defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    exclude: ['e2e/**', 'node_modules/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'src/main.tsx',
        'src/App.tsx',
        'src/setupTests.ts',
        'src/vite-env.d.ts',
        'dist/**',
        'vite.config.ts',
        'vitest.config.ts',
      ]
    }
  },
}))
