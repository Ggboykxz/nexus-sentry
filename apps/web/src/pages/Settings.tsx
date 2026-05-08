import { useState, useEffect } from 'react';
import { apiGet } from '../lib/api';

export default function Settings() {
  const [aiStatus, setAiStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet('/api/v1/ai/status')
      .then(setAiStatus)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <div className="rounded-lg border bg-card p-6 space-y-4">
        <h2 className="font-semibold">AI Configuration</h2>

        {loading ? (
          <div className="animate-pulse">Loading...</div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm">
              <span className="text-muted-foreground">Status: </span>
              <span className={aiStatus?.data?.available ? 'text-green-600' : 'text-red-600'}>
                {aiStatus?.data?.available ? 'Connected' : 'Disconnected'}
              </span>
            </p>
            {aiStatus?.data?.model && (
              <p className="text-sm">
                <span className="text-muted-foreground">Model: </span>
                {aiStatus.data.model}
              </p>
            )}
            {aiStatus?.data?.error && (
              <p className="text-sm text-red-600">{aiStatus.data.error}</p>
            )}
          </div>
        )}
      </div>

      <div className="rounded-lg border bg-card p-6 space-y-4">
        <h2 className="font-semibold">Environment Variables</h2>
        <div className="space-y-2 text-sm font-mono">
          <p><span className="text-muted-foreground">DATABASE_URL</span>=postgresql://nexus:nexus@localhost:5432/nexus_sentry</p>
          <p><span className="text-muted-foreground">REDIS_URL</span>=redis://localhost:6379</p>
          <p><span className="text-muted-foreground">OLLAMA_URL</span>=http://localhost:11434</p>
          <p><span className="text-muted-foreground">OLLAMA_MODEL</span>=llama3.2:3b</p>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-6 space-y-4">
        <h2 className="font-semibold">Webhook Endpoints</h2>
        <div className="space-y-2 text-sm font-mono">
          <p><span className="text-muted-foreground">POST</span> /webhooks/generic</p>
          <p><span className="text-muted-foreground">POST</span> /webhooks/github</p>
          <p><span className="text-muted-foreground">POST</span> /webhooks/sentry</p>
          <p><span className="text-muted-foreground">POST</span> /webhooks/prometheus</p>
        </div>
      </div>
    </div>
  );
}