import Fastify from 'fastify';
import { authRoutes } from './routes/auth.js';
import { unidadeRoutes } from './routes/unidades.js';
import { usuarioRoutes } from './routes/usuarios.js';
import { ticketRoutes } from './routes/tickets.js';
import { notificationRoutes } from './routes/notifications.js';
import { dashboardRoutes } from './routes/dashboard.js';
import { reportsRoutes } from './routes/reports.js';

const fastify = Fastify({ logger: true });

// CORS Hook
fastify.addHook('onRequest', async (request, reply) => {
  reply.header('Access-Control-Allow-Origin', '*');
  reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (request.method === 'OPTIONS') {
    return reply.status(204).send();
  }
});

// Health check
fastify.get('/api/health', async () => {
  return { status: 'ok' };
});

// Register routes
fastify.register(authRoutes);
fastify.register(unidadeRoutes);
fastify.register(usuarioRoutes);
fastify.register(ticketRoutes);
fastify.register(notificationRoutes);
fastify.register(dashboardRoutes);
fastify.register(reportsRoutes);

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3001;
    const host = process.env.HOST || '0.0.0.0';
    await fastify.listen({ port, host });
    console.log(`Backend escutando na porta ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
