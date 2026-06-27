import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      'server-only': new URL('./node_modules/server-only/empty.js', import.meta.url).pathname,
      '@': new URL('./src', import.meta.url).pathname,
    },
  },
  test: {
    setupFiles: ['./tests/setup.ts'],
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    fileParallelism: false,
    // Route all DB tests to the LOCAL Supabase instance. .env.local points at
    // the remote/prod project; without this override `npm test` would insert
    // and delete against production. Requires local Supabase running
    // (`supabase start`). These are the well-known public local-dev keys.
    env: {
      NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
      NEXT_PUBLIC_SUPABASE_ANON_KEY:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
      SUPABASE_SERVICE_ROLE_KEY:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU',
    },
  },
})
