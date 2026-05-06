import { Hono } from 'hono';
import { db } from '../db/index.js';
import { events, incidents } from '../db/schema.js';
import { eq } from 'drizzle-orm';

const aiRouter = new Hono();

aiRouter.get('/status', async (c) => {
  const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
  
  try {
    const response = await fetch(`${ollamaUrl}/api/tags`, { method: 'GET' });
    
    if (!response.ok) {
      return c.json({ data: { available: false, error: 'Ollama not accessible' } });
    }
    
    const data = await response.json();
    return c.json({ 
      data: { 
        available: true, 
        model: data.models?.[0]?.name || 'llama3.2:3b',
        embeddingModels: data.models?.filter((m: any) => m.name.includes('embedding'))?.map((m: any) => m.name) || []
      } 
    });
  } catch {
    return c.json({ data: { available: false, error: 'Cannot connect to Ollama' } });
  }
});

aiRouter.post('/summarize', async (c) => {
  const body = await c.req.json();
  const { incidentId } = body;
  
  if (!incidentId) {
    return c.json({ error: { code: 'VALIDATION_ERROR', message: 'incidentId required' } }, 400);
  }
  
  const [incident] = await db.select().from(incidents).where(eq(incidents.id, incidentId));
  
  if (!incident) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Incident not found' } }, 404);
  }
  
  const relatedEvents = await db.select()
    .from(events)
    .where(eq(events.incidentId, incidentId));
  
  const prompt = `Tu es un expert SRE. Résume cet incident en 2-3 phrases.

Incident: ${incident.title}
Événements: ${relatedEvents.length}
${relatedEvents.slice(0, 5).map(e => `- ${e.title}`).join('\n')}

Réponds uniquement en JSON: {"summary": "...", "severity": "critical|error|warning|info"}`;
  
  try {
    const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.OLLAMA_MODEL || 'llama3.2:3b',
        prompt,
        format: 'json',
        stream: false,
      }),
    });
    
    if (!response.ok) {
      throw new Error('LLM request failed');
    }
    
    const llmResult = await response.json();
    const parsed = JSON.parse(llmResult.response);
    
    return c.json({ data: parsed });
  } catch (error) {
    return c.json({ error: { code: 'ANALYSIS_ERROR', message: error instanceof Error ? error.message : 'Analysis failed' } }, 500);
  }
});

aiRouter.post('/chat', async (c) => {
  const body = await c.req.json();
  const { messages, incidentId } = body;
  
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return c.json({ error: { code: 'VALIDATION_ERROR', message: 'messages array required' } }, 400);
  }
  
  let context = '';
  
  if (incidentId) {
    const [incident] = await db.select().from(incidents).where(eq(incidents.id, incidentId));
    const relatedEvents = await db.select().from(events).where(eq(events.incidentId, incidentId));
    
    if (incident) {
      context = `\n\nContexte incident:\n- Titre: ${incident.title}\n- Résumé: ${incident.summary || 'N/A'}\n- Cause racine: ${incident.rootCause || 'N/A'}\n- Événements: ${relatedEvents.length}`;
    }
  }
  
  const systemPrompt = `Tu es un assistant DevSecOps expert. Tu aides à analyser des incidents et suggérer des actions.${context}`;
  
  const prompt = `${systemPrompt}\n\n${messages.map((m: any) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n')}\n\nAssistant:`;
  
  try {
    const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.OLLAMA_MODEL || 'llama3.2:3b',
        prompt,
        stream: false,
      }),
    });
    
    if (!response.ok) {
      throw new Error('LLM request failed');
    }
    
    const llmResult = await response.json();
    
    return c.json({ 
      data: { 
        message: { role: 'assistant', content: llmResult.response },
        context: { incidentId }
      } 
    });
  } catch (error) {
    return c.json({ error: { code: 'CHAT_ERROR', message: error instanceof Error ? error.message : 'Chat failed' } }, 500);
  }
});

aiRouter.post('/analyze', async (c) => {
  const body = await c.req.json();
  const { eventIds, incidentId } = body;
  
  let targetEvents = [];
  
  if (incidentId) {
    targetEvents = await db.select().from(events).where(eq(events.incidentId, incidentId));
  } else if (eventIds && eventIds.length > 0) {
    for (const id of eventIds) {
      const [event] = await db.select().from(events).where(eq(events.id, id));
      if (event) targetEvents.push(event);
    }
  }
  
  if (targetEvents.length === 0) {
    return c.json({ error: { code: 'NO_EVENTS', message: 'No events to analyze' } }, 400);
  }
  
  const prompt = `Tu es un expert SRE/DevSecOps. Analyse ces ${targetEvents.length} événements et suggère des actions.

${targetEvents.map(e => `- [${e.severity.toUpperCase()}] ${e.source}: ${e.title} (${e.description || ''})`).join('\n')}

Réponds uniquement en JSON:
{
  "rootCause": "cause probable en 1 phrase",
  "suggestedActions": [{"priority": "immediate|short_term|long_term", "action": "...", "reason": "..."}]
}`;
  
  try {
    const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.OLLAMA_MODEL || 'llama3.2:3b',
        prompt,
        format: 'json',
        stream: false,
      }),
    });
    
    if (!response.ok) {
      throw new Error('LLM request failed');
    }
    
    const llmResult = await response.json();
    const parsed = JSON.parse(llmResult.response);
    
    return c.json({ data: { events: targetEvents, analysis: parsed } });
  } catch (error) {
    return c.json({ error: { code: 'ANALYSIS_ERROR', message: error instanceof Error ? error.message : 'Analysis failed' } }, 500);
  }
});

export { aiRouter };