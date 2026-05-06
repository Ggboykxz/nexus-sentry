import { Hono } from 'hono';
import { db } from '../db/index.js';
import { events, incidents } from '../db/schema.js';
import { eq, sql } from 'drizzle-orm';
import { genericWebhookPayloadSchema } from '@nexus-sentry/shared';

const webhooksRouter = new Hono({ strict: false });

webhooksRouter.post('/generic', async (c) => {
  const body = await c.req.json();
  const parsed = genericWebhookPayloadSchema.safeParse(body);
  
  if (!parsed.success) {
    return c.json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0].message } }, 400);
  }
  
  const payload = parsed.data;
  const [created] = await db.insert(events).values({
    source: 'generic',
    sourceId: payload.sourceId,
    title: payload.title,
    description: payload.description,
    severity: payload.severity,
    payload: payload.payload,
    tags: payload.tags,
    status: 'open',
  }).returning();
  
  return c.json({ data: created, message: 'Event received' }, 201);
});

webhooksRouter.post('/github', async (c) => {
  const body = await c.req.json();
  const payload = body;
  
  let title = 'GitHub Alert';
  let description = '';
  let severity = 'info';
  let sourceId = '';
  let tags = ['github'];
  
  if (payload.action === 'dependabot_alert') {
    const alert = payload.alert || {};
    title = `Dependabot: ${alert.package || 'Unknown package'}`;
    description = `Vulnerability: ${alert.vulnerability || 'Unknown'}\nSeverity: ${alert.severity || 'Unknown'}`;
    severity = alert.severity === 'critical' ? 'critical' : alert.severity === 'high' ? 'error' : 'warning';
    sourceId = `dependabot-${alert.number}`;
    tags.push('dependabot');
  } else if (payload.action === 'security_alert') {
    title = `Security Alert: ${payload.alert?.summary || 'Security issue'}`;
    description = payload.alert?.description || '';
    severity = 'critical';
    tags.push('security');
  }
  
  const [created] = await db.insert(events).values({
    source: 'github',
    sourceId,
    title,
    description,
    severity: severity as any,
    payload,
    tags,
    status: 'open',
  }).returning();
  
  return c.json({ data: created, message: 'GitHub webhook processed' }, 201);
});

webhooksRouter.post('/sentry', async (c) => {
  const body = await c.req.json();
  const payload = body;
  
  const event = payload.event || {};
  const culprit = event.culprit || 'Unknown';
  const level = event.level || 'error';
  const project = payload.project?.slug || 'unknown';
  
  const severity = level === 'fatal' || level === 'critical' ? 'critical' :
                  level === 'error' ? 'error' :
                  level === 'warning' ? 'warning' : 'info';
  
  const [created] = await db.insert(events).values({
    source: 'sentry',
    sourceId: String(event.id),
    title: `[${project}] ${culprit}`,
    description: event.message || '',
    severity: severity as any,
    payload,
    tags: ['sentry', project, level],
    status: 'open',
  }).returning();
  
  return c.json({ data: created, message: 'Sentry webhook processed' }, 201);
});

webhooksRouter.post('/prometheus', async (c) => {
  const body = await c.req.json();
  const alerts = body.alerts || [];
  
  const createdEvents = [];
  
  for (const alert of alerts) {
    const severity = alert.labels?.severity === 'critical' ? 'critical' :
                    alert.labels?.severity === 'warning' ? 'warning' : 'info';
    
    const [created] = await db.insert(events).values({
      source: 'prometheus',
      sourceId: alert.fingerprint,
      title: alert.labels?.alertname || 'Prometheus Alert',
      description: alert.annotations?.description || alert.annotations?.summary || '',
      severity: severity as any,
      payload: alert,
      tags: ['prometheus', alert.labels?.alertname || ''].filter(Boolean),
      status: 'open',
    }).returning();
    
    createdEvents.push(created);
  }
  
  return c.json({ data: createdEvents, message: `${createdEvents.length} alert(s) processed` }, 201);
});

webhooksRouter.post('/check', async (c) => {
  return c.json({ status: 'ok', message: 'Webhook endpoint active' });
});

export { webhooksRouter };