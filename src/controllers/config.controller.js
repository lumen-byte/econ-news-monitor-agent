import configRepository from '../repositories/config.repository.js';
import schedulerService from '../services/scheduler.service.js';
import orchestratorService from '../services/agent-orchestrator.service.js';

class ConfigController {
  async getConfig(req, res, next) {
    try {
      const config = await configRepository.loadConfig();
      res.json({ success: true, data: config });
    } catch (error) {
      next(error);
    }
  }

  async updateConfig(req, res, next) {
    try {
      const updatedConfig = await configRepository.updateConfig(req.body);
      
      // Reschedule scheduler job based on updated refreshInterval
      if (updatedConfig.refreshInterval) {
        schedulerService.scheduleJob(updatedConfig.refreshInterval, () => orchestratorService.runPipeline());
      }
      
      res.json({ success: true, data: updatedConfig });
    } catch (error) {
      next(error);
    }
  }

  async addTopic(req, res, next) {
    try {
      const { topic } = req.body;
      if (!topic) {
        return res.status(400).json({ success: false, error: 'Topic is required.' });
      }
      const data = await configRepository.addTopic(topic);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async removeTopic(req, res, next) {
    try {
      const { topic } = req.body;
      if (!topic) {
        return res.status(400).json({ success: false, error: 'Topic is required.' });
      }
      const data = await configRepository.removeTopic(topic);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async addSource(req, res, next) {
    try {
      const { source } = req.body;
      if (!source) {
        return res.status(400).json({ success: false, error: 'Source is required.' });
      }
      const data = await configRepository.addSource(source);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async removeSource(req, res, next) {
    try {
      const { source } = req.body;
      if (!source) {
        return res.status(400).json({ success: false, error: 'Source is required.' });
      }
      const data = await configRepository.removeSource(source);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async addCompetitor(req, res, next) {
    try {
      const { competitor } = req.body;
      if (!competitor) {
        return res.status(400).json({ success: false, error: 'Competitor is required.' });
      }
      const data = await configRepository.addCompetitor(competitor);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async removeCompetitor(req, res, next) {
    try {
      const { competitor } = req.body;
      if (!competitor) {
        return res.status(400).json({ success: false, error: 'Competitor is required.' });
      }
      const data = await configRepository.removeCompetitor(competitor);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async updateCountry(req, res, next) {
    try {
      const { country } = req.body;
      if (!country) {
        return res.status(400).json({ success: false, error: 'Country is required.' });
      }
      const data = await configRepository.updateCountry(country);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async updateRefreshInterval(req, res, next) {
    try {
      const { refreshInterval } = req.body;
      if (!refreshInterval) {
        return res.status(400).json({ success: false, error: 'refreshInterval is required.' });
      }
      const data = await configRepository.updateRefreshInterval(refreshInterval);
      schedulerService.scheduleJob(refreshInterval, () => orchestratorService.runPipeline());
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}

export default new ConfigController();
