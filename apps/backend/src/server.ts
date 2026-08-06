import { createServer } from 'node:http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import {
  connectMongo,
  connectRedis,
  disconnectMongo,
  disconnectRedis,
} from './database/index.js';
import { createSocketServer } from './socket/index.js';
import { logger } from './utils/logger/index.js';

async function bootstrap(): Promise<void> {
  await connectMongo();
  await connectRedis();

  const app = createApp();
  const httpServer = createServer(app);
  createSocketServer(httpServer);

  httpServer.listen(env.PORT, env.HOST, () => {
    logger.info(
      { host: env.HOST, port: env.PORT, env: env.NODE_ENV },
      'Learnova API listening',
    );
  });

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutting down…');
    httpServer.close(async () => {
      await disconnectMongo();
      await disconnectRedis();
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

bootstrap().catch((err: unknown) => {
  logger.fatal({ err }, 'Failed to start API');
  process.exit(1);
});
