import { useState } from 'react';
import { useEvents } from '../hooks/useEvents';
import { SeverityBadge } from '../components/SeverityBadge';
import { apiPatch } from '../lib/api';
import { format } from 'date-fns';
import { Filter, RefreshCw } from 'lucide-react';

export default function Timeline() {
  const [filters, setFilters] = useState({});
  const { data, isLoading, refetch } = useEvents(filters);
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters };
    if (value) {
      newFilters[key] = value;
    } else {
      delete newFilters[key];
    }
    setFilters(newFilters);
  };

  const handleResolve = async (id: string) => {
    try {
      await apiPatch(`/api/v1/events/${id}/status`, { status: 'resolved' });
      refetch();
    } catch (e) {
      console.error(e);
    }
  };

  const applyFilters = () => {
    const newFilters: Record<string, string> = {};
    if (statusFilter) newFilters.status = statusFilter;
    if (severityFilter) newFilters.severity = severityFilter;
    setFilters(newFilters);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Timeline</h1>
        <button
          onClick={() => refetch()}
          className="rounded p-2 hover:bg-secondary"
          title="Refresh"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      <div className="flex gap-4 items-center">
        <Filter size={18} className="text-muted-foreground" />
        <select
          value={statusFilter}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className="rounded border bg-background px-3 py-1.5 text-sm"
        >
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="resolved">Resolved</option>
          <option value="ignored">Ignored</option>
        </select>
        <select
          value={severityFilter}
          onChange={(e) => handleFilterChange('severity', e.target.value)}
          className="rounded border bg-background px-3 py-1.5 text-sm"
        >
          <option value="">All Severity</option>
          <option value="critical">Critical</option>
          <option value="error">Error</option>
          <option value="warning">Warning</option>
          <option value="info">Info</option>
        </select>
        <button
          onClick={applyFilters}
          className="rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90"
        >
          Apply
        </button>
      </div>

      <div className="space-y-3">
        {isLoading && <div className="animate-pulse">Loading...</div>}
        {data?.data?.map((event: any) => (
          <div
            key={event.id}
            className="rounded-lg border bg-card p-4 flex items-start gap-4"
          >
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <SeverityBadge severity={event.severity} />
                <span className="text-xs text-muted-foreground uppercase">
                  {event.source}
                </span>
              </div>
              <h3 className="font-medium">{event.title}</h3>
              {event.description && (
                <p className="text-sm text-muted-foreground">{event.description}</p>
              )}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>{format(new Date(event.createdAt), 'PPp')}</span>
                {event.tags?.length > 0 && (
                  <span>Tags: {event.tags.join(', ')}</span>
                )}
              </div>
            </div>
            {event.status === 'open' && (
              <button
                onClick={() => handleResolve(event.id)}
                className="rounded bg-secondary px-3 py-1 text-xs hover:bg-secondary/80"
              >
                Resolve
              </button>
            )}
          </div>
        ))}
        {data?.data?.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No events found</p>
        )}
      </div>
    </div>
  );
}