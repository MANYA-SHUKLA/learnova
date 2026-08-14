import './config/load-env.js';
import { createServer } from 'node:http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { appConfig } from './config/app.js';
import {
  connectMongo,
  connectRedis,
  disconnectMongo,
  disconnectRedis,
} from './database/index.js';
import { registerInfrastructureListeners, registerCertificateListeners, registerNotificationListeners, registerProgressListeners, startDueReminderScheduler } from './events/index.js';
import { closeQueues, initQueues } from './queues/index.js';
import { getStorage } from './storage/index.js';
import { getMailer } from './mail/index.js';
import { createSocketServer } from './socket/index.js';
import { logger } from './utils/logger/index.js';

/**
 * Startup sequence:
 * 1. Validate env (lazy via config)
 * 2. Connect Mongo (retry)
 * 3. Connect Redis (retry)
 * 4. Init BullMQ queues + DLQ + QueueEvents
 * 5. Init storage + mail adapters
 * 6. Register event listeners
 * 7. Create HTTP app + Socket.io
 * 8. Listen
 *
 * Shutdown sequence:
 * 1. Stop accepting connections
 * 2. Close queues
 * 3. Disconnect Mongo + Redis
 * 4. Exit
 */
async function bootstrap(): Promise<void> {
  await connectMongo();
  await connectRedis();
  await initQueues();

  const storage = getStorage();
  const mailer = getMailer();
  registerInfrastructureListeners();
  registerCertificateListeners();
  registerNotificationListeners();
  registerProgressListeners();
  startDueReminderScheduler();

  const storageOk = await storage.isHealthy();
  const mailOk = await mailer.isHealthy();
  logger.info(
    {
      storage: { driver: storage.driver, healthy: storageOk },
      mail: { driver: mailer.driver, healthy: mailOk },
      version: appConfig.version,
      commit: appConfig.commitSha,
    },
    'Infrastructure adapters ready',
  );

  const app = createApp();
  const httpServer = createServer(app);
  createSocketServer(httpServer);

  httpServer.listen(env.PORT, env.HOST, () => {
    logger.info(
      { host: env.HOST, port: env.PORT, env: env.NODE_ENV },
      'Learnova API listening',
    );
  });

  const shutdown = (signal: string): void => {
    logger.info({ signal }, 'Shutting down…');
    httpServer.close(() => {
      void (async () => {
        await closeQueues();
        await disconnectMongo();
        await disconnectRedis();
        process.exit(0);
      })();
    });
  };

  process.on('SIGTERM', () => {
    shutdown('SIGTERM');
  });
  process.on('SIGINT', () => {
    shutdown('SIGINT');
  });
}

bootstrap().catch((err: unknown) => {
  logger.fatal({ err }, 'Failed to start API');
  process.exit(1);
});
