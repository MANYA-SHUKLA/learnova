import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { corsConfig } from './config/slices.js';
import {
  createRateLimiter,
  errorHandler,
  httpLogger,
  metricsMiddleware,
  notFoundMiddleware,
  requestIdMiddleware,
  securityHeadersMiddleware,
  timeoutMiddleware,
} from './middlewares/index.js';
import routes from './routes/index.js';

export function createApp(): Express {
  const app = express();

  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(helmet());
  app.use(securityHeadersMiddleware);
  app.use(
    cors({
      origin: corsConfig.origins,
      credentials: corsConfig.credentials,
      methods: corsConfig.methods,
      allowedHeaders: corsConfig.allowedHeaders,
    }),
  );
  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser());
  app.use(requestIdMiddleware);
  app.use(timeoutMiddleware());
  app.use(metricsMiddleware);
  app.use(httpLogger);
  app.use(createRateLimiter());

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.use(routes);

  app.use(notFoundMiddleware);
  app.use(errorHandler);

  return app;
}
