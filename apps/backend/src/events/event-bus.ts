import { EventEmitter } from 'node:events';
import {
  type DomainEvent,
  type EventName,
  EVENTS,
} from '@learnova/events';
import { createId, toIso } from '@learnova/utils';
import { logger } from '../utils/logger/index.js';

export type EventHandler<T = unknown> = (
  event: DomainEvent<T>,
) => void | Promise<void>;

/**
 * In-process domain event bus.
 * Later: fan-out to Redis Streams / BullMQ without changing emit call sites.
 */
class EventBus {
  private readonly emitter = new EventEmitter();

  constructor() {
    this.emitter.setMaxListeners(50);
  }

  async emit<T>(
    name: EventName,
    payload: T,
    meta?: { correlationId?: string; actorId?: string },
  ): Promise<DomainEvent<T>> {
    const event: DomainEvent<T> = {
      name,
      payload,
      occurredAt: toIso(),
      correlationId: meta?.correlationId ?? createId(),
      actorId: meta?.actorId,
    };

    const handlers = this.emitter.listeners(name) as EventHandler<T>[];
    await Promise.all(
      handlers.map(async (handler) => {
        try {
          await handler(event);
        } catch (err) {
          logger.error({ err, event: name }, 'Event handler failed');
        }
      }),
    );

    // Wildcard observers
    const anyHandlers = this.emitter.listeners('*') as EventHandler[];
    await Promise.all(
      anyHandlers.map(async (handler) => {
        try {
          await handler(event as DomainEvent);
        } catch (err) {
          logger.error({ err, event: name }, 'Wildcard event handler failed');
        }
      }),
    );

    return event;
  }

  on<T = unknown>(name: EventName | '*', handler: EventHandler<T>): () => void {
    this.emitter.on(name, handler as EventHandler);
    return () => {
      this.emitter.off(name, handler as EventHandler);
    };
  }

  once<T = unknown>(name: EventName, handler: EventHandler<T>): void {
    this.emitter.once(name, handler as EventHandler);
  }

  off(name: EventName | '*', handler: EventHandler): void {
    this.emitter.off(name, handler);
  }

  listenerCount(name: EventName | '*'): number {
    return this.emitter.listenerCount(name);
  }
}

export const eventBus = new EventBus();
export { EVENTS };
export type { DomainEvent, EventName };
