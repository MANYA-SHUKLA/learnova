import { z } from 'zod';

export const dockerConfigSchema = z.object({
  DOCKER_NETWORK: z.string().default('learnova'),
  COMPOSE_PROJECT_NAME: z.string().default('learnova'),
  MONGO_CONTAINER: z.string().default('learnova-mongo'),
  REDIS_CONTAINER: z.string().default('learnova-redis'),
});

export type DockerConfig = z.infer<typeof dockerConfigSchema>;
