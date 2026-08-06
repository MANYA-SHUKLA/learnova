import { EventEmitter } from 'node:events';
import {
  type DomainEvent,
  type EventName,
  type EventPayloadMap,
  type TypedEventName,
  EVENTS,
  EVENT_REGISTRY,
  isRegisteredEvent,
  getEventDefinition,
} from '@learnova/events';
import { createId, toIso } from '@learnova/utils';
import { logger } from '../utils/logger/index.js';

export type EventHandler<T = unknown> = (
  event: DomainEvent<T>,
) => void | Promise<void>;

/**
 * In-process domain event bus with typed publish/subscribe.
 */
class EventBus {
  private readonly emitter = new EventEmitter();
  private readonly handlers = new Map<string, Set<EventHandler>>();

  constructor() {
    this.emitter.setMaxListeners(100);
  }

  async publish<K extends TypedEventName>(
    name: K,
    payload: EventPayloadMap[K],
    meta?: { correlationId?: string; actorId?: string },
  ): Promise<DomainEvent<EventPayloadMap[K]>> {
    return this.emit(name, payload, meta);
  }

  async emit<T>(
    name: EventName,
    payload: T,
    meta?: { correlationId?: string; actorId?: string },
  ): Promise<DomainEvent<T>> {
    if (!isRegisteredEvent(name)) {
      logger.warn({ event: name }, 'Emitting unregistered event name');
    }

    const event: DomainEvent<T> = {
      name,
      payload,
      occurredAt: toIso(),
      correlationId: meta?.correlationId ?? createId(),
      actorId: meta?.actorId,
    };

    const run = async (handler: EventHandler<T>) => {
      try {
        await handler(event);
      } catch (err) {
        logger.error({ err, event: name }, 'Event handler failed');
      }
    };

    const named = [...(this.handlers.get(name) ?? [])] as EventHandler<T>[];
    const wildcards = [...(this.handlers.get('*') ?? [])] as EventHandler<T>[];

    await Promise.all([...named, ...wildcards].map((handler) => run(handler)));

    this.emitter.emit(name, event);
    this.emitter.emit('*', event);

    return event;
  }

  subscribe<T = unknown>(name: EventName | '*', handler: EventHandler<T>): () => void {
    return this.on(name, handler);
  }

  on<T = unknown>(name: EventName | '*', handler: EventHandler<T>): () => void {
    const key = name;
    let set = this.handlers.get(key);
    if (!set) {
      set = new Set();
      this.handlers.set(key, set);
    }
    set.add(handler as EventHandler);
    return () => {
      set.delete(handler as EventHandler);
    };
  }

  once<T = unknown>(name: EventName, handler: EventHandler<T>): void {
    const wrap: EventHandler<T> = async (event) => {
      this.off(name, wrap as EventHandler);
      await handler(event);
    };
    this.on(name, wrap);
  }

  off(name: EventName | '*', handler: EventHandler): void {
    this.handlers.get(name)?.delete(handler);
  }

  listenerCount(name: EventName | '*'): number {
    return this.handlers.get(name)?.size ?? 0;
  }

  listRegistry() {
    return EVENT_REGISTRY;
  }
}

export const eventBus = new EventBus();
export { EVENTS, EVENT_REGISTRY, isRegisteredEvent, getEventDefinition };
export type { DomainEvent, EventName, EventPayloadMap, TypedEventName };
