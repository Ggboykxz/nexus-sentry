import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../lib/api';

export function useIncidents(filters?: {
  status?: string;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: ['incidents', filters],
    queryFn: () => apiGet('/api/v1/incidents', filters),
  });
}