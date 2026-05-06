import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../lib/api';

export function useEvents(filters?: {
  source?: string;
  severity?: string;
  status?: string;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: ['events', filters],
    queryFn: () => apiGet('/api/v1/events', filters),
  });
}