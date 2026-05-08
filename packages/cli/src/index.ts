#!/usr/bin/env bun
import { Command } from 'commander';
import { apiPost, apiGet } from './lib/api';

const program = new Command();

program
  .name('nexus')
  .description('NEXUS-SENTRY CLI')
  .version('1.0.0');

program
  .command('send')
  .description('Send an event')
  .requiredOption('-t, --title <title>', 'Event title')
  .option('-d, --description <desc>', 'Event description')
  .option('-s, --severity <severity>', 'Severity', 'info')
  .option('--source <source>', 'Source', 'cli')
  .action(async (opts) => {
    try {
      const result = await apiPost('/api/v1/events', {
        title: opts.title,
        description: opts.description,
        severity: opts.severity,
        source: opts.source,
      });
      console.log('Event sent:', (result as { data: { id: string } }).data.id);
    } catch (e) {
      console.error('Error:', e);
      process.exit(1);
    }
  });

program
  .command('status')
  .description('Check system status')
  .action(async () => {
    try {
      const health = await apiGet('/health') as { status: string };
      console.log('API:', health.status);
      const ai = await apiGet('/api/v1/ai/status') as { data: { available: boolean } };
      console.log('AI:', ai.data.available ? 'Available' : 'Unavailable');
    } catch (e) {
      console.error('Error:', e);
      process.exit(1);
    }
  });

program
  .command('tail')
  .description('Stream live events (not implemented)')
  .action(() => {
    console.log('WebSocket streaming not yet implemented. Use the web UI for live events.');
  });

program.parse();