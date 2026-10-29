import react from '@vitejs/plugin-react'
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'

const REQUIRED_PRODUCTION_ENV = [
  'VITE_GOOGLE_CLIENT_ID',
  'VITE_API_BASE_URL',
] as const

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  if (mode === 'production') {
    const env = loadEnv(mode, process.cwd(), 'VITE_')
    const missing = REQUIRED_PRODUCTION_ENV.filter((name) => !env[name]?.trim())

    if (missing.length) {
      throw new Error(`正式環境缺少必要變數：${missing.join(', ')}`)
    }
  }

  return {
    plugins: [react()],
    server: {
      proxy: {
        '^/api/health$': 'http://127.0.0.1:5000',
        '^/api/(auth|user|chapters)(/|$)': 'http://127.0.0.1:5000',
        '/api': 'http://127.0.0.1:8000',
      },
    },
    test: {
      include: ['src/**/*.test.{ts,tsx}'],
    },
  }
})
