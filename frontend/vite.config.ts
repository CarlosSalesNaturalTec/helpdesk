import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const appName = env.VITE_APP_NAME || 'SOLUTUS'
  const clientName = env.VITE_CLIENT_NAME || 'Instituto Setes'

  return {
    plugins: [
      react(),
      {
        name: 'branding-html',
        transformIndexHtml(html) {
          return html
            .replace(/%VITE_APP_NAME%/g, appName)
            .replace(/%VITE_CLIENT_NAME%/g, clientName)
        },
      },
    ],
    base: './',
  }
})
