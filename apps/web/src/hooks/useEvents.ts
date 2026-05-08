import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../lib/api';

interface Event {
  id: string;
  source: string;
  title: string;
  description?: string;
  severity: string;
  status: string;
  payload: Record<string, unknown>;
  tags: string[];
  incidentId?: string;
  createdAt: string;
  resolvedAt?: string;
}

interface EventsResponse {
  data: Event[];
  meta?: {
    total: number;
    limit: number;
    offset: number;
  };
}

export function useEvents(filters?: {
  source?: string;
  severity?: string;
  status?: string;
  limit?: number;
  offset?: number;
}) {
  return useQuery<EventsResponse>({
    queryKey: ['events', filters],
    queryFn: () => apiGet<EventsResponse>('/api/v1/events', filters),
  });
}