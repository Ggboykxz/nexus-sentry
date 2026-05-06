import { z } from 'zod';

export const severitySchema = z.enum(['critical', 'error', 'warning', 'info']);
export const eventStatusSchema = z.enum(['open', 'resolved', 'ignored']);

export const eventSchema = z.object({
  id: z.string().uuid().optional(),
  source: z.string(),
  sourceId: z.string().optional(),
  title: z.string(),
  description: z.string().optional(),
  severity: severitySchema.default('info'),
  status: eventStatusSchema.default('open'),
  payload: z.record(z.unknown()).default({}),
  tags: z.array(z.string()).default([]),
  incidentId: z.string().uuid().optional(),
  createdAt: z.string().datetime().optional(),
  resolvedAt: z.string().datetime().optional(),
});

export type Event = z.infer<typeof eventSchema>;
export type Severity = z.infer<typeof severitySchema>;
export type EventStatus = z.infer<typeof eventStatusSchema>;

export const createEventSchema = eventSchema.omit({
  id: true,
  createdAt: true,
  resolvedAt: true,
});

export const updateEventStatusSchema = z.object({
  status: eventStatusSchema,
});

export const eventFilterSchema = z.object({
  source: z.string().optional(),
  severity: severitySchema.optional(),
  status: eventStatusSchema.optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

export type EventFilter = z.infer<typeof eventFilterSchema>;