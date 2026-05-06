import { z } from 'zod';

export const incidentSeveritySchema = z.enum(['critical', 'error', 'warning', 'info']);
export const incidentStatusSchema = z.enum(['open', 'resolved', 'ignored']);

export const suggestedActionSchema = z.object({
  priority: z.enum(['immediate', 'short_term', 'long_term']),
  action: z.string(),
  reason: z.string(),
});

export const incidentSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string(),
  summary: z.string().optional(),
  rootCause: z.string().optional(),
  suggestedActions: z.array(suggestedActionSchema).default([]),
  severity: incidentSeveritySchema.default('error'),
  status: incidentStatusSchema.default('open'),
  eventCount: z.number().default(0),
  aiAnalyzed: z.boolean().default(false),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  resolvedAt: z.string().datetime().optional(),
});

export type Incident = z.infer<typeof incidentSchema>;
export type IncidentSeverity = z.infer<typeof incidentSeveritySchema>;
export type IncidentStatus = z.infer<typeof incidentStatusSchema>;
export type SuggestedAction = z.infer<typeof suggestedActionSchema>;

export const createIncidentSchema = incidentSchema.omit({
  id: true,
  aiAnalyzed: true,
  createdAt: true,
  updatedAt: true,
  resolvedAt: true,
});

export const updateIncidentSchema = incidentSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  resolvedAt: true,
}).partial();

export type UpdateIncident = z.infer<typeof updateIncidentSchema>;

export const llmAnalysisResultSchema = z.object({
  summary: z.string(),
  rootCause: z.string(),
  severity: incidentSeveritySchema,
  suggestedActions: z.array(suggestedActionSchema),
  confidence: z.number().min(0).max(1),
});

export type LLMAnalysisResult = z.infer<typeof llmAnalysisResultSchema>;