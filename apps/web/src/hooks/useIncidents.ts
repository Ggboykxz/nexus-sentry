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

export function useIncidents(filters?: {
  status?: string;
  limit?: number;
  offset?: number;
}) {
  return useQuery<IncidentsResponse>({
    queryKey: ['incidents', filters],
    queryFn: () => apiGet<IncidentsResponse>('/api/v1/incidents', filters),
  });
}