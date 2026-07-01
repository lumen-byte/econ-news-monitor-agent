import app from './app.js';
import env from './config/env.js';
import logger from './utils/logger.js';
import schedulerService from './services/scheduler.service.js';
import orchestratorService from './services/agent-orchestrator.service.js';
import configRepository from './repositories/config.repository.js';

async function startServer() {
  try {
    const config = await configRepository.getConfig();

    schedulerService.scheduleJob(config.cronInterval, () => orchestratorService.runPipeline());

    const server = app.listen(env.PORT, () => {
      logger.info(`Economic News Monitoring Agent HTTP server started successfully on port ${env.PORT} (ES Modules Mode)`);
    });

    const gracefulShutdown = () => {
      logger.info('Shutting down HTTP server and stopping schedulers...');
      schedulerService.stop();
      server.close(() => {
        logger.info('HTTP server closed. Exiting process.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

  } catch (error) {
    logger.error('Failed to start server bootstrap:', error);
    process.exit(1);
  }
}

startServer();
