/**
 * Swagger UI + OpenAPI JSON mounts for the Learnova API.
 * UI:  /docs  (alias /api/docs)
 * Spec: /openapi.json  (alias /api/openapi.json)
 */

import type { Express, Request, Response, NextFunction } from 'express';
import swaggerUi from 'swagger-ui-express';
import { openApiDocument } from './openapi.js';

const swaggerCsp = (
  _req: Request,
  res: Response,
  next: NextFunction,
): void => {
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self'",
    ].join('; '),
  );
  next();
};

const swaggerOptions: swaggerUi.SwaggerUiOptions = {
  explorer: true,
  customSiteTitle: 'Learnova API Docs',
  customCss: '.swagger-ui .topbar { display: none }',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'list',
    filter: true,
    tryItOutEnabled: true,
  },
};

export function mountSwagger(app: Express): void {
  const serve = swaggerUi.serve;
  const setup = swaggerUi.setup(openApiDocument, swaggerOptions);

  app.get('/openapi.json', (_req, res) => {
    res.status(200).json(openApiDocument);
  });
  app.get('/api/openapi.json', (_req, res) => {
    res.status(200).json(openApiDocument);
  });

  app.use('/docs', swaggerCsp, ...serve, setup);
  app.use('/api/docs', swaggerCsp, ...serve, setup);
}
