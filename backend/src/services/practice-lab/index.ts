export { practiceLabService, type ActorContext } from './practice-lab.service.js';
export * from './practice-lab.helpers.js';
/** Prefer `@/services/coding-engine` for new code */
export {
  judge0Client,
  mapJudge0StatusToExecutionStatus,
  judge0IdForLanguage,
} from '../coding-engine/index.js';
