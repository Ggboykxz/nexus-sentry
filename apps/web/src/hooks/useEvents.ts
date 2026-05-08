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

const DEMO_EVENTS: EventsResponse = {
  data: [
    { id: '1', source: 'github', title: 'Security vulnerability detected', description: 'Critical CVE in dependencies', severity: 'critical', status: 'open', payload: {}, tags: ['security'], createdAt: new Date().toISOString() },
    { id: '2', source: 'sentry', title: 'Error in production', description: 'NullPointerException in checkout', severity: 'error', status: 'open', payload: {}, tags: ['backend'], createdAt: new Date().toISOString() },
    { id: '3', source: 'prometheus', title: 'High CPU usage', description: 'Server usage above 90%', severity: 'warning', status: 'open', payload: {}, tags: ['infra'], createdAt: new Date().toISOString() },
    { id: '4', source: 'generic', title: 'Deployment completed', description: 'v2.1.0 deployed successfully', severity: 'info', status: 'resolved', payload: {}, tags: ['deploy'], createdAt: new Date().toISOString() },
  ],
  meta: { total: 4, limit: 10, offset: 0 }
};

export function useEvents(filters?: {
  source?: string;
  severity?: string;
  status?: string;
  limit?: number;
  offset?: number;
}) {
  return useQuery<EventsResponse>({
    queryKey: ['events', filters],
    queryFn: async () => {
      const url = import.meta.env.VITE_API_URL || '';
      if (!url) {
        return DEMO_EVENTS;
      }
      try {
        const response = await fetch(`${url}/api/v1/events`);
        if (!response.ok) {
          return DEMO_EVENTS;
        }
        return await response.json();
      } catch {
        return DEMO_EVENTS;
      }
    },
    staleTime: Infinity,
    gcTime: 0,
  });
}