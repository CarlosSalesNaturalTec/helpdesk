export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Espelha backend/src/lib/branding.ts: `APP_NAME` cai no padrão quando vazio,
// mas um `CLIENT_NAME` vazio é uma escolha deliberada de quem publicou e deve
// ser preservado — é o que faz o sistema exibir apenas o nome da aplicação.
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'SOLUTUS';
export const CLIENT_NAME = import.meta.env.VITE_CLIENT_NAME ?? 'Instituto Setes';
export const FULL_NAME = CLIENT_NAME ? `${APP_NAME} — ${CLIENT_NAME}` : APP_NAME;
export const BRANDING_SLUG = FULL_NAME
  .normalize('NFD')
  .replace(new RegExp('[\\u0300-\\u036f]', 'g'), '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '_')
  .replace(/^_+|_+$/g, '');
