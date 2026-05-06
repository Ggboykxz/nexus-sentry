import { z } from 'zod';

export const webhookProviderSchema = z.enum(['github', 'sentry', 'generic', 'prometheus']);

export const webhookConfigSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string(),
  provider: webhookProviderSchema,
  secret: z.string().optional(),
  enabled: z.boolean().default(true),
  createdAt: z.string().datetime().optional(),
});

export type WebhookProvider = z.infer<typeof webhookProviderSchema>;
export type WebhookConfig = z.infer<typeof webhookConfigSchema>;

export const genericWebhookPayloadSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  severity: z.enum(['critical', 'error', 'warning', 'info']).default('info'),
  source: z.string(),
  sourceId: z.string().optional(),
  tags: z.array(z.string()).default([]),
  payload: z.record(z.unknown()).default({}),
});

export type GenericWebhookPayload = z.infer<typeof genericWebhookPayloadSchema>;