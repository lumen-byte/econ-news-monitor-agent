import cacheRepository from '../repositories/cache.repository.js';
import schedulerService from '../services/scheduler.service.js';
import orchestratorService from '../services/agent-orchestrator.service.js';

class MonitoringController {
  async getStatus(req, res, next) {
    try {
      const cache = await cacheRepository.getCache();
      const schedulerStatus = schedulerService.getStatus();

      res.json({
        success: true,
        data: {
          scheduler: schedulerStatus,
          lastExecution: cache.lastExecution,
          cachedArticlesCount: cache.processedArticleHashes.length
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async triggerManualRun(req, res, next) {
    try {
      const result = await orchestratorService.runPipeline();
      res.json({
        success: true,
        message: 'Agent monitoring execution triggered manually.',
        result
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new MonitoringController();
