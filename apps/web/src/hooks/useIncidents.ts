import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../lib/api';

interface Incident {
  id: string;
  title: string;
  summary?: string;
  rootCause?: string;
  severity: string;
  status: string;
  eventCount: number;
  suggestedActions?: Array<{ priority: string; action: string; reason: string }>;
  aiAnalyzed: boolean;
  createdAt: string;
  updatedAt: string;
}

interface IncidentsResponse {
  data: Incident[];
  meta?: {
    total: number;
    limit: number;
    offset: number;
  };
}

const DEMO_INCIDENTS: IncidentsResponse = {
  data: [
    { id: '1', title: 'Payment service outage', summary: 'Payment gateway timeout', severity: 'critical', status: 'open', eventCount: 15, aiAnalyzed: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '2', title: 'Database connection leak', summary: 'Connection pool exhausted', severity: 'error', status: 'open', eventCount: 8, aiAnalyzed: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '3', title: 'SSL certificate expiring', summary: 'Certificate renewal needed', severity: 'warning', status: 'resolved', eventCount: 2, aiAnalyzed: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ],
  meta: { total: 3, limit: 5, offset: 0 }
};

export function useIncidents(filters?: {
  status?: string;
  limit?: number;
  offset?: number;
}) {
  return useQuery<IncidentsResponse>({
    queryKey: ['incidents', filters],
    queryFn: async () => {
      try {
        return await apiGet<IncidentsResponse>('/api/v1/incidents', filters);
      } catch {
        return DEMO_INCIDENTS;
      }
    },
    staleTime: 30000,
  });
}