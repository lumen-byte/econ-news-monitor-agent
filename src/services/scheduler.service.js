import cron from 'node-cron';
import logger from '../utils/logger.js';

class SchedulerService {
  constructor() {
    this.currentJob = null;
    this.currentExpression = null;
  }

  /**
   * Schedules or reschedules pipeline executions.
   */
  scheduleJob(cronExpression, taskCallback) {
    if (this.currentJob) {
      if (this.currentExpression === cronExpression) {
        logger.debug(`Scheduler already running on active pattern: ${cronExpression}`);
        return;
      }
      logger.info(`Rescheduling cron job from ${this.currentExpression} to ${cronExpression}`);
      this.currentJob.stop();
    }

    if (!cron.validate(cronExpression)) {
      logger.error(`Invalid cron pattern provided: "${cronExpression}". Falling back to default hourly.`);
      cronExpression = '0 * * * *';
    }

    this.currentExpression = cronExpression;
    this.currentJob = cron.schedule(cronExpression, async () => {
      logger.info('Scheduler triggered: beginning pipeline task execution.');
      try {
        await taskCallback();
        logger.info('Scheduler triggered task execution completed successfully.');
      } catch (err) {
        logger.error('Scheduler task callback encountered an unhandled exception:', err);
      }
    });

    logger.info(`Scheduler successfully registered cron task with pattern: "${cronExpression}"`);
  }

  stop() {
    if (this.currentJob) {
      this.currentJob.stop();
      logger.info('Cron scheduler stopped.');
      this.currentJob = null;
      this.currentExpression = null;
    }
  }

  getStatus() {
    return {
      scheduled: !!this.currentJob,
      expression: this.currentExpression
    };
  }
}

export default new SchedulerService();
