import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Mesma assimetria de src/config.ts: nome de aplicação vazio cai no padrão,
  // nome de cliente vazio é preservado como escolha de quem publicou.
  const appName = env.VITE_APP_NAME || 'SOLUTUS'
  const clientName = env.VITE_CLIENT_NAME ?? 'Instituto Setes'
  // O travessão é composto aqui, e não no template, para que um cliente vazio
  // não deixe um separador órfão no título da aba.
  const fullName = clientName ? `${appName} — ${clientName}` : appName

  return {
    plugins: [
      react(),
      {
        name: 'branding-html',
        transformIndexHtml(html) {
          return html
            .replace(/%VITE_FULL_NAME%/g, fullName)
            .replace(/%VITE_APP_NAME%/g, appName)
            .replace(/%VITE_CLIENT_NAME%/g, clientName)
        },
      },
    ],
    base: '/',
  }
})
