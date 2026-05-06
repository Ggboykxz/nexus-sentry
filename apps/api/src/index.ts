import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serve } from '@hono/node-server';
import { v4 as uuidv4 } from 'uuid';
import { eventsRouter } from './routes/events.js';
import { incidentsRouter } from './routes/incidents.js';
import { webhooksRouter } from './routes/webhooks.js';
import { metricsRouter } from './routes/metrics.js';
import { aiRouter } from './routes/ai.js';
import { db } from './db/index.js';
import { events, incidents } from './db/schema.js';

const app = new Hono();

app.use('*', cors());
app.use('*', logger());

app.get('/health', async (c) => {
  try {
    await db.select().from(events).limit(1);
    return c.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch {
    return c.json({ status: 'degraded', timestamp: new Date().toISOString() }, 503);
  }
});

app.route('/api/v1/events', eventsRouter);
app.route('/api/v1/incidents', incidentsRouter);
app.route('/api/v1/metrics', metricsRouter);
app.route('/api/v1/ai', aiRouter);
app.route('/webhooks', webhooksRouter);

app.notFound((c) => {
  return c.json({ error: { code: 'NOT_FOUND', message: 'Route not found' } }, 404);
});

app.onError((err, c) => {
  console.error('Error:', err);
  return c.json({ error: { code: 'INTERNAL_ERROR', message: err.message } }, 500);
});

const port = parseInt(process.env.PORT || '3001');

console.log(`🚀 Server running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});

export default app;