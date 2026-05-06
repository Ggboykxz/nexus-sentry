import { Hono } from 'hono';
import { db } from '../db/index.js';
import { metrics } from '../db/schema.js';
import { eq, desc, and, sql, gte, lte } from 'drizzle-orm';
import { z } from 'zod';

const createMetricSchema = z.object({
  name: z.string(),
  value: z.number(),
  unit: z.string().optional(),
  tags: z.record(z.string()).default({}),
  source: z.string().optional(),
});

const metricsRouter = new Hono();

metricsRouter.post('/', async (c) => {
  const body = await c.req.json();
  const parsed = createMetricSchema.safeParse(body);
  
  if (!parsed.success) {
    return c.json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0].message } }, 400);
  }
  
  const [created] = await db.insert(metrics).values({
    ...parsed.data,
    recordedAt: new Date(),
  }).returning();
  
  return c.json({ data: created }, 201);
});

metricsRouter.get('/', async (c) => {
  const query = c.req.query();
  const name = query.name as string | undefined;
  const from = query.from as string | undefined;
  const to = query.to as string | undefined;
  const limit = parseInt(query.limit as string || '100');
  
  const conditions = [];
  if (name) conditions.push(eq(metrics.name, name));
  if (from) conditions.push(gte(metrics.recordedAt, from));
  if (to) conditions.push(lte(metrics.recordedAt, to));
  
  const result = await db.select()
    .from(metrics)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(metrics.recordedAt))
    .limit(limit);
  
  return c.json({ data: result });
});

metricsRouter.get('/summary', async (c) => {
  const query = c.req.query();
  const from = query.from as string | undefined;
  const to = query.to as string | undefined;
  
  const conditions = [];
  if (from) conditions.push(gte(metrics.recordedAt, from));
  if (to) conditions.push(lte(metrics.recordedAt, to));
  
  const result = await db.select()
    .from(metrics)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(metrics.recordedAt));
  
  const summary: Record<string, { count: number; avg: number; min: number; max: number }> = {};
  
  for (const m of result) {
    if (!summary[m.name]) {
      summary[m.name] = { count: 0, avg: 0, min: m.value, max: m.value };
    }
    summary[m.name].count++;
    summary[m.name].min = Math.min(summary[m.name].min, m.value);
    summary[m.name].max = Math.max(summary[m.name].max, m.value);
    summary[m.name].avg = (summary[m.name].avg * (summary[m.name].count - 1) + m.value) / summary[m.name].count;
  }
  
  return c.json({ data: summary });
});

export { metricsRouter };