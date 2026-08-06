import type { DomainEvent } from '@learnova/events';
import { logger } from '../../utils/logger/index.js';
import { eventBus } from '../event-bus.js';

/**
 * Infrastructure listeners — no domain CRUD.
 * Wires domain events → audit queue + structured logs.
 */
export function registerInfrastructureListeners(): void {
  eventBus.on('*', async (event: DomainEvent) => {
    logger.debug(
      {
        event: event.name,
        correlationId: event.correlationId,
        actorId: event.actorId,
      },
      'Domain event emitted',
    );

    // Lazy import avoids circular init with queues
    const { enqueueAudit } = await import('../../queues/producer.js');
    await enqueueAudit({
      actorId: event.actorId,
      action: event.name,
      resource: event.name.split('.')[0] ?? 'domain',
      metadata: { payload: event.payload },
      correlationId: event.correlationId,
      occurredAt: event.occurredAt,
    });
  });

  logger.info('Infrastructure event listeners registered');
}
