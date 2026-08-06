import { z } from 'zod';

export const socketConfigSchema = z.object({
  SOCKET_PATH: z.string().default('/socket.io'),
  SOCKET_CORS_ORIGINS: z.string().optional(),
  SOCKET_PING_INTERVAL: z.coerce.number().int().positive().default(25_000),
  SOCKET_PING_TIMEOUT: z.coerce.number().int().positive().default(20_000),
});

export type SocketConfig = z.infer<typeof socketConfigSchema>;
