# Events

Package catalog: `@learnova/events`  
Runtime bus: `apps/backend/src/events`

## Capabilities

- `eventBus.publish` / `emit` / `subscribe` / `on`
- Typed `EventPayloadMap`
- `EVENT_REGISTRY` + `isRegisteredEvent`
- Infrastructure listener → audit queue

## Example names

`course.created`, `user.created`, `exam.completed`, `certificate.generated`, `project.submitted`

## Rule

Infrastructure only — no domain business handlers.
