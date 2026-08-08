import os from 'node:os';
import { getMongoMetrics } from '../database/mongo/connection.js';
import { getRedisMetrics } from '../database/redis/connection.js';

export interface SystemMetrics {
  collectedAt: string;
  uptimeSeconds: number;
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
    arrayBuffers: number;
    systemFree: number;
    systemTotal: number;
  };
  cpu: {
    loadAverage: number[];
    cores: number;
    usagePercentEstimate: number | null;
  };
  process: {
    pid: number;
    node: string;
  };
  mongo: ReturnType<typeof getMongoMetrics>;
  redis: ReturnType<typeof getRedisMetrics>;
}

const responseTimes: number[] = [];
const MAX_SAMPLES = 200;

export function recordResponseTime(ms: number): void {
  responseTimes.push(ms);
  if (responseTimes.length > MAX_SAMPLES) responseTimes.shift();
}

export function getAverageResponseTime(): number | null {
  if (responseTimes.length === 0) return null;
  return responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
}

export function collectMetrics(): SystemMetrics {
  const mem = process.memoryUsage();
  const load = os.loadavg();
  const cores = os.cpus().length;

  return {
    collectedAt: new Date().toISOString(),
    uptimeSeconds: process.uptime(),
    memory: {
      rss: mem.rss,
      heapTotal: mem.heapTotal,
      heapUsed: mem.heapUsed,
      external: mem.external,
      arrayBuffers: mem.arrayBuffers,
      systemFree: os.freemem(),
      systemTotal: os.totalmem(),
    },
    cpu: {
      loadAverage: load,
      cores,
      usagePercentEstimate: cores > 0 ? Math.min(100, ((load[0] ?? 0) / cores) * 100) : null,
    },
    process: {
      pid: process.pid,
      node: process.version,
    },
    mongo: getMongoMetrics(),
    redis: getRedisMetrics(),
  };
}

export function getMonitoringSnapshot() {
  return {
    ...collectMetrics(),
    avgResponseTimeMs: getAverageResponseTime(),
  };
}
