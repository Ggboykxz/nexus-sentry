import { Hono } from 'hono';
import { db } from '../db/index.js';
import { events } from '../db/schema.js';
import { eq, desc, and, sql } from 'drizzle-orm';
import { z } from 'zod';

const createEventSchema = z.object({
  source: z.string(),
  sourceId: z.string().optional(),
  title: z.string(),
  description: z.string().optional(),
  severity: z.enum(['critical', 'error', 'warning', 'info']).default('info'),
  payload: z.record(z.unknown()).default({}),
  tags: z.array(z.string()).default([]),
  incidentId: z.string().uuid().optional(),
});

const eventFilterSchema = z.object({
  source: z.string().optional(),
  severity: z.enum(['critical', 'error', 'warning', 'info']).optional(),
  status: z.enum(['open', 'resolved', 'ignored']).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

const updateEventStatusSchema = z.object({
  status: z.enum(['open', 'resolved', 'ignored']),
});

const eventsRouter = new Hono();

eventsRouter.get('/', async (c) => {
  const query = c.req.query();
  const parsed = eventFilterSchema.safeParse(query);
  
  if (!parsed.success) {
    return c.json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0].message } }, 400);
  }
  
  const { source, severity, status, from, to, limit, offset } = parsed.data;
  
  const conditions = [];
  if (source) conditions.push(eq(events.source, source as any));
  if (severity) conditions.push(eq(events.severity, severity as any));
  if (status) conditions.push(eq(events.status, status as any));
  if (from) conditions.push(sql`${events.createdAt} >= ${from}`);
  if (to) conditions.push(sql`${events.createdAt} <= ${to}`);
  
  const result = await db.select()
    .from(events)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(events.createdAt))
    .limit(limit)
    .offset(offset);
  
  return c.json({ data: result });
});

eventsRouter.get('/:id', async (c) => {
  const id = c.req.param('id');
  const [event] = await db.select().from(events).where(eq(events.id, id));
  
  if (!event) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Event not found' } }, 404);
  }
  
  return c.json({ data: event });
});

eventsRouter.post('/', async (c) => {
  const body = await c.req.json();
  const parsed = createEventSchema.safeParse(body);
  
  if (!parsed.success) {
    return c.json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0].message } }, 400);
  }
  
  const [created] = await db.insert(events).values(parsed.data as any).returning();
  
  return c.json({ data: created }, 201);
});

eventsRouter.patch('/:id/status', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const parsed = updateEventStatusSchema.safeParse(body);
  
  if (!parsed.success) {
    return c.json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0].message } }, 400);
  }
  
  const [updated] = await db.update(events)
    .set({ 
      status: parsed.data.status,
      resolvedAt: parsed.data.status === 'resolved' ? new Date() : null 
    })
    .where(eq(events.id, id))
    .returning();
  
  if (!updated) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Event not found' } }, 404);
  }
  
  return c.json({ data: updated });
});

eventsRouter.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const [deleted] = await db.delete(events).where(eq(events.id, id)).returning();
  
  if (!deleted) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Event not found' } }, 404);
  }
  
  return c.json({ data: deleted });
});

export { eventsRouter };