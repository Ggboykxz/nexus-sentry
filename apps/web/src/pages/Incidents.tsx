import { useState } from 'react';
import { useIncidents } from '../hooks/useIncidents';
import { SeverityBadge } from '../components/SeverityBadge';
import { apiPost } from '../lib/api';

export default function Incidents() {
  const { data, isLoading, refetch } = useIncidents({ limit: 20 });
  const [analyzing, setAnalyzing] = useState<string | null>(null);

  const handleAnalyze = async (id: string) => {
    setAnalyzing(id);
    try {
      await apiPost(`/api/v1/incidents/${id}/analyze`);
      refetch();
    } catch (e) {
      console.error(e);
    } finally {
      setAnalyzing(null);
    }
  };

  if (isLoading) {
    return <div className="animate-pulse">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Incidents</h1>

      <div className="rounded-lg border bg-card">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-3 text-left text-sm font-medium">Title</th>
              <th className="p-3 text-left text-sm font-medium">Severity</th>
              <th className="p-3 text-left text-sm font-medium">Status</th>
              <th className="p-3 text-left text-sm font-medium">Events</th>
              <th className="p-3 text-left text-sm font-medium">AI</th>
              <th className="p-3 text-left text-sm font-medium">Created</th>
              <th className="p-3 text-left text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.data?.map((incident: any) => (
              <tr key={incident.id} className="border-b last:border-0">
                <td className="p-3 text-sm">{incident.title}</td>
                <td className="p-3">
                  <SeverityBadge severity={incident.severity} />
                </td>
                <td className="p-3 text-sm">{incident.status}</td>
                <td className="p-3 text-sm">{incident.eventCount}</td>
                <td className="p-3 text-sm">{incident.aiAnalyzed ? 'Yes' : 'No'}</td>
                <td className="p-3 text-sm">
                  {new Date(incident.createdAt).toLocaleDateString()}
                </td>
                <td className="p-3">
                  <button
                    onClick={() => handleAnalyze(incident.id)}
                    disabled={analyzing === incident.id}
                    className="rounded bg-primary px-3 py-1 text-xs text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    {analyzing === incident.id ? 'Analyzing...' : 'Analyze'}
                  </button>
                </td>
              </tr>
            ))}
            {data?.data?.length === 0 && (
              <tr>
                <td colSpan={7} className="p-4 text-center text-sm text-muted-foreground">
                  No incidents yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}