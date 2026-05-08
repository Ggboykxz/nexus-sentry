import { Hono } from 'hono';
import { db } from '../db/index.js';
import { incidents, events } from '../db/schema.js';
import { eq, desc, and, count } from 'drizzle-orm';
import { z } from 'zod';

const createIncidentSchema = z.object({
  title: z.string(),
  summary: z.string().optional(),
  rootCause: z.string().optional(),
  severity: z.enum(['critical', 'error', 'warning', 'info']).default('error'),
  status: z.enum(['open', 'resolved', 'ignored']).default('open'),
  suggestedActions: z.array(z.object({
    priority: z.string(),
    action: z.string(),
    reason: z.string(),
  })).optional(),
});

const updateIncidentSchema = z.object({
  title: z.string().optional(),
  summary: z.string().optional(),
  rootCause: z.string().optional(),
  severity: z.enum(['critical', 'error', 'warning', 'info']).optional(),
  status: z.enum(['open', 'resolved', 'ignored']).optional(),
  suggestedActions: z.array(z.object({
    priority: z.string(),
    action: z.string(),
    reason: z.string(),
  })).optional(),
});

const incidentsRouter = new Hono();

incidentsRouter.get('/', async (c) => {
  const query = c.req.query();
  const status = query.status as string | undefined;
  const limit = parseInt(query.limit as string || '50');
  const offset = parseInt(query.offset as string || '0');
  
  const conditions = [];
  if (status) conditions.push(eq(incidents.status, status as any));
  
  const result = await db.select()
    .from(incidents)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(incidents.createdAt))
    .limit(limit)
    .offset(offset);
  
  const [{ total }] = await db.select({ total: count() }).from(incidents);
  
  return c.json({ data: result, meta: { total, limit, offset } });
});

incidentsRouter.get('/:id', async (c) => {
  const id = c.req.param('id');
  const [incident] = await db.select().from(incidents).where(eq(incidents.id, id));
  
  if (!incident) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Incident not found' } }, 404);
  }
  
  const relatedEvents = await db.select()
    .from(events)
    .where(eq(events.incidentId, id))
    .orderBy(desc(events.createdAt));
  
  return c.json({ data: { ...incident, events: relatedEvents } });
});

incidentsRouter.post('/', async (c) => {
  const body = await c.req.json();
  const parsed = createIncidentSchema.safeParse(body);
  
  if (!parsed.success) {
    return c.json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0].message } }, 400);
  }
  
  const [created] = await db.insert(incidents).values({
    ...parsed.data,
    eventCount: 0,
    updatedAt: new Date(),
  }).returning();
  
  return c.json({ data: created }, 201);
});

incidentsRouter.patch('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const parsed = updateIncidentSchema.safeParse(body);
  
  if (!parsed.success) {
    return c.json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0].message } }, 400);
  }
  
  const [updated] = await db.update(incidents)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(incidents.id, id))
    .returning();
  
  if (!updated) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Incident not found' } }, 404);
  }
  
  return c.json({ data: updated });
});

incidentsRouter.post('/:id/analyze', async (c) => {
  const id = c.req.param('id');
  const [incident] = await db.select().from(incidents).where(eq(incidents.id, id));
  
  if (!incident) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Incident not found' } }, 404);
  }
  
  const relatedEvents = await db.select()
    .from(events)
    .where(eq(events.incidentId, id));
  
  const analysisPrompt = `Tu es un expert SRE/DevSecOps. Analyse cet incident et réponds UNIQUEMENT en JSON valide.

INCIDENT: ${incident.title}
ÉVÉNEMENTS (${relatedEvents.length} événements):
${relatedEvents.map(e => `- [${e.severity.toUpperCase()}] ${e.source}: ${e.title} - ${e.description || ''}`).join('\n')}

Réponds avec ce JSON exact :
{
  "summary": "résumé en 2-3 phrases",
  "rootCause": "cause probable",
  "severity": "critical|error|warning|info",
  "suggestedActions": [
    {"priority": "immediate", "action": "...", "reason": "..."}
  ],
  "confidence": 0.8
}`;
  
  try {
    const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.OLLAMA_MODEL || 'llama3.2:3b',
        prompt: analysisPrompt,
        format: 'json',
        stream: false,
      }),
    });
    
    if (!response.ok) {
      throw new Error('LLM request failed');
    }
    
    const llmResult = await response.json() as { response: string };
    const parsed = JSON.parse(llmResult.response);
    
    const [updated] = await db.update(incidents)
      .set({
        summary: parsed.summary,
        rootCause: parsed.rootCause,
        suggestedActions: parsed.suggestedActions,
        severity: parsed.severity,
        aiAnalyzed: true,
        updatedAt: new Date(),
      })
      .where(eq(incidents.id, id))
      .returning();
    
    return c.json({ data: { ...updated, analysis: parsed } });
  } catch (error) {
    return c.json({ error: { code: 'ANALYSIS_ERROR', message: error instanceof Error ? error.message : 'Analysis failed' } }, 500);
  }
});

incidentsRouter.get('/:id/runbook', async (c) => {
  const id = c.req.param('id');
  const [incident] = await db.select().from(incidents).where(eq(incidents.id, id));
  
  if (!incident) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Incident not found' } }, 404);
  }
  
  const runbook = `# Runbook: ${incident.title}

## Résumé
${incident.summary || 'Non analysé'}

## Cause Racine
${incident.rootCause || 'Non identifié'}

## Actions Recommandées
${(incident.suggestedActions as any[]).map(a => `- [${a.priority}] ${a.action}: ${a.reason}`).join('\n') || 'Aucune'}

## Événements Liés
${incident.eventCount} événement(s) lié(s)
`;
  
  return c.text(runbook, 200, { 'Content-Type': 'text/markdown' });
});

export { incidentsRouter };