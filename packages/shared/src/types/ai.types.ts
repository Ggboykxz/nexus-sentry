import { z } from 'zod';

export const aiStatusSchema = z.object({
  available: z.boolean(),
  model: z.string().optional(),
  embeddingModels: z.array(z.string()).optional(),
});

export type AIStatus = z.infer<typeof aiStatusSchema>;

export const aiChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
});

export const aiChatRequestSchema = z.object({
  messages: z.array(aiChatMessageSchema),
  incidentId: z.string().uuid().optional(),
});

export type AIChatMessage = z.infer<typeof aiChatMessageSchema>;
export type AIChatRequest = z.infer<typeof aiChatRequestSchema>;

export const aiChatResponseSchema = z.object({
  message: aiChatMessageSchema,
  context: z.object({
    incidentId: z.string().uuid().optional(),
    events: z.array(z.unknown()).default([]),
  }).optional(),
});

export type AIChatResponse = z.infer<typeof aiChatResponseSchema>;

export const aiSummarizeRequestSchema = z.object({
  incidentId: z.string().uuid(),
});

export const aiAnalyzeRequestSchema = z.object({
  eventIds: z.array(z.string().uuid()).optional(),
  incidentId: z.string().uuid().optional(),
});

export type AISummarizeRequest = z.infer<typeof aiSummarizeRequestSchema>;
export type AIAnalyzeRequest = z.infer<typeof aiAnalyzeRequestSchema>;