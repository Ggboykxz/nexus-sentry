import { useEvents } from '../hooks/useEvents';
import { useIncidents } from '../hooks/useIncidents';
import { SeverityBadge } from '../components/SeverityBadge';
import { MetricCard } from '../components/MetricCard';
import { AlertCircle, CheckCircle, Clock, Activity } from 'lucide-react';

export default function Dashboard() {
  const { data: eventsData, isLoading: eventsLoading } = useEvents({ limit: 10 });
  const { data: incidentsData, isLoading: incidentsLoading } = useIncidents({ limit: 5 });

  const events = eventsData?.data || [];
  const incidents = incidentsData?.data || [];

  const openIncidents = incidents.filter(i => i.status === 'open');
  const criticalEvents = events.filter(e => e.severity === 'critical' || e.severity === 'error');

  if (eventsLoading || incidentsLoading) {
    return <div className="animate-pulse">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Open Incidents"
          value={openIncidents.length}
          icon={AlertCircle}
          variant="destructive"
        />
        <MetricCard
          title="Resolved"
          value={incidents.filter(i => i.status === 'resolved').length}
          icon={CheckCircle}
          variant="success"
        />
        <MetricCard
          title="Critical Events"
          value={criticalEvents.length}
          icon={Activity}
          variant="warning"
        />
        <MetricCard
          title="Total Events"
          value={events.length}
          icon={Clock}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-4">
          <h2 className="font-semibold mb-4">Recent Events</h2>
          <div className="space-y-2">
            {events.slice(0, 5).map((event) => (
              <div key={event.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="space-y-1">
                  <p className="text-sm font-medium">{event.title}</p>
                  <p className="text-xs text-muted-foreground">{event.source}</p>
                </div>
                <SeverityBadge severity={event.severity} />
              </div>
            ))}
            {events.length === 0 && (
              <p className="text-sm text-muted-foreground">No events yet</p>
            )}
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <h2 className="font-semibold mb-4">Active Incidents</h2>
          <div className="space-y-2">
            {openIncidents.slice(0, 5).map((incident) => (
              <div key={incident.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="space-y-1">
                  <p className="text-sm font-medium">{incident.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {incident.eventCount} event(s)
                  </p>
                </div>
                <SeverityBadge severity={incident.severity} />
              </div>
            ))}
            {openIncidents.length === 0 && (
              <p className="text-sm text-muted-foreground">No active incidents</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}