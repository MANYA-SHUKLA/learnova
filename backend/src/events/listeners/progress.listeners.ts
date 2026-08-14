import { EVENTS } from '@learnova/events';
import { progressService } from '../../services/progress/index.js';
import { logger } from '../../utils/logger/index.js';
import { eventBus } from '../event-bus.js';

export function registerProgressListeners(): void {
  eventBus.on(EVENTS.PROBLEM_SOLVED, async (event) => {
    try {
      const payload = event.payload as {
        institutionId: string;
        studentId: string;
        practiceLabId: string;
        problemId: string;
      };
      await progressService.onLabProblemSolved(payload);
    } catch (err) {
      logger.warn({ err, event: EVENTS.PROBLEM_SOLVED }, 'Lab problem progress sync failed');
    }
  });

  eventBus.on(EVENTS.LAB_COMPLETED, async (event) => {
    try {
      const payload = event.payload as {
        institutionId: string;
        studentId: string;
        labId: string;
      };
      await progressService.onLabCompleted(payload);
    } catch (err) {
      logger.warn({ err, event: EVENTS.LAB_COMPLETED }, 'Lab completion progress sync failed');
    }
  });

  logger.info('Progress event listeners registered');
}
