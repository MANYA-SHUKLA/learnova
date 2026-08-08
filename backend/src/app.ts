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
import { mountSwagger } from './docs/swagger.js';

export function createApp(): Express {
  const app = express();

  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  // Relax CSP for Swagger UI assets; keep defaults elsewhere
  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'script-src': ["'self'", "'unsafe-inline'"],
          'style-src': ["'self'", "'unsafe-inline'"],
          'img-src': ["'self'", 'data:', 'https:'],
        },
      },
    }),
  );
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

  mountSwagger(app);

  app.use(routes);

  app.use(notFoundMiddleware);
  app.use(errorHandler);

  return app;
}
