import { createServer } from 'node:http';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import type { Worker } from 'bullmq';
import { getWorkerMetrics } from '../processors/index.js';

/**
 * Lightweight worker health HTTP server (optional port).
 */
export function startWorkerHealthServer(workers: Worker[]): ReturnType<typeof createServer> {
  const server = createServer((req, res) => {
    if (req.url === '/health' || req.url === '/live') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(
        JSON.stringify({
          status: 'ok',
          alive: true,
          ...getWorkerMetrics(workers),
          uptime: process.uptime(),
        }),
      );
      return;
    }
    res.writeHead(404).end();
  });

  const port = env.WORKER_HEALTH_PORT ?? 4100;
  server.listen(port, () => {
    logger.info({ port }, 'Worker health server listening');
  });

  return server;
}
