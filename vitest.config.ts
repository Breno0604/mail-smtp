import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.js'],
    exclude: ['tests/app-init.test.js'],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'tests/**/*.test.{js,ts}'],
  },
})
