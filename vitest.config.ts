import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      'server-only': new URL('./node_modules/server-only/empty.js', import.meta.url).pathname,
    },
  },
  test: {
    setupFiles: ['./tests/setup.ts'],
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    fileParallelism: false,
  },
})
