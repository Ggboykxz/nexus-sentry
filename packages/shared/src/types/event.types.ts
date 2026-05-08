import { z } from 'zod';

export const eventSourceSchema = z.enum(['github', 'sentry', 'generic', 'cli']);

export const eventTypeSchema = z.object({
  id: z.string().uuid(),
  source: eventSourceSchema,
  sourceId: z.string().optional(),
  title: z.string(),
  description: z.string().optional(),
  severity: z.enum(['critical', 'error', 'warning', 'info']),
  status: z.enum(['open', 'resolved', 'ignored']),
  payload: z.record(z.unknown()),
  tags: z.array(z.string()),
  incidentId: z.string().uuid().optional(),
  createdAt: z.string().datetime(),
  resolvedAt: z.string().datetime().optional(),
});

export type EventType = z.infer<typeof eventTypeSchema>;
export type EventSource = z.infer<typeof eventSourceSchema>;

export const metricSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  value: z.number(),
  unit: z.string().optional(),
  tags: z.record(z.string()).default({}),
  source: z.string().optional(),
  recordedAt: z.string().datetime(),
});

export type Metric = z.infer<typeof metricSchema>;

export const wsEventSchema = z.object({
  type: z.enum(['event:created', 'event:updated', 'incident:created', 'incident:updated']),
  payload: z.unknown(),
});

export type WSEvent = z.infer<typeof wsEventSchema>;