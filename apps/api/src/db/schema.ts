import { pgTable, uuid, text, timestamp, jsonb, boolean, integer, index, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const severityEnum = pgEnum('severity', ['critical', 'error', 'warning', 'info']);
export const eventStatusEnum = pgEnum('event_status', ['open', 'resolved', 'ignored']);
export const incidentStatusEnum = pgEnum('incident_status', ['open', 'resolved', 'ignored']);
export const sourceEnum = pgEnum('source', ['github', 'sentry', 'generic', 'cli', 'prometheus']);

export const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRaw('gen_random_uuid()'),
  source: sourceEnum('source').notNull(),
  sourceId: text('source_id'),
  title: text('title').notNull(),
  description: text('description'),
  severity: severityEnum('severity').notNull().default('info'),
  status: eventStatusEnum('status').notNull().default('open'),
  payload: jsonb('payload').notNull().default({}),
  tags: text('tags').array().default([]),
  incidentId: uuid('incident_id').referencesOn(() => incidents.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
}, (table) => [
  index('idx_events_source').on(table.source),
  index('idx_events_severity').on(table.severity),
  index('idx_events_created_at').on(table.createdAt).descending(),
  index('idx_events_status').on(table.status),
]);

export const incidents = pgTable('incidents', {
  id: uuid('id').primaryKey().defaultRaw('gen_random_uuid()'),
  title: text('title').notNull(),
  summary: text('summary'),
  rootCause: text('root_cause'),
  suggestedActions: jsonb('suggested_actions').default([]),
  severity: severityEnum('severity').notNull().default('error'),
  status: incidentStatusEnum('status').notNull().default('open'),
  eventCount: integer('event_count').default(0),
  aiAnalyzed: boolean('ai_analyzed').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
}, (table) => [
  index('idx_incidents_status').on(table.status),
  index('idx_incidents_created_at').on(table.createdAt).descending(),
]);

export const metrics = pgTable('metrics', {
  id: uuid('id').primaryKey().defaultRaw('gen_random_uuid()'),
  name: text('not_null').notNull(),
  value: integer('value').notNull(),
  unit: text('unit'),
  tags: jsonb('tags').default({}),
  source: text('source'),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_metrics_name_time').on(table.name, table.recordedAt).descending(),
]);

export const webhookConfigs = pgTable('webhook_configs', {
  id: uuid('id').primaryKey().defaultRaw('gen_random_uuid()'),
  name: text('name').notNull(),
  provider: sourceEnum('provider').notNull(),
  secret: text('secret'),
  enabled: boolean('enabled').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const eventsRelations = relations(events, ({ one }) => ({
  incident: one(incidents, {
    fields: [events.incidentId],
    references: [incidents.id],
  }),
}));

export const incidentsRelations = relations(incidents, ({ many }) => ({
  events: many(events),
}));

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type Incident = typeof incidents.$inferSelect;
export type NewIncident = typeof incidents.$inferInsert;
export type Metric = typeof metrics.$inferSelect;
export type NewMetric = typeof metrics.$inferInsert;
export type WebhookConfig = typeof webhookConfigs.$inferSelect;
export type NewWebhookConfig = typeof webhookConfigs.$inferInsert;