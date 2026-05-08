// Cloudflare Worker pour l'API Nexus Sentry
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // API Routes
    if (url.pathname.startsWith('/api/')) {
      return new Response(JSON.stringify({ 
        message: "API en cours de déploiement sur Cloudflare",
        endpoints: ["/api/v1/events", "/api/v1/incidents", "/health"]
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Webhook endpoints
    if (url.pathname.startsWith('/webhooks/')) {
      return new Response(JSON.stringify({ 
        message: "Webhook endpoint",
        available: ["generic", "github", "sentry", "prometheus"]
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Default - serve static from Pages
    return fetch(request);
  }
};