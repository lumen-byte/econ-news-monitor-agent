import express from 'express';
import newsController from '../controllers/news.controller.js';
import configController from '../controllers/config.controller.js';
import monitoringController from '../controllers/monitoring.controller.js';

const router = express.Router();

// Monitor status endpoint
router.get('/monitor/status', monitoringController.getStatus);

// Monitor endpoint (GET latest reports)
router.get('/monitor', newsController.getReports);

// Config endpoints
router.get('/config', configController.getConfig);
router.post('/topics', configController.addTopic);
router.delete('/topics', configController.removeTopic);
router.post('/sources', configController.addSource);
router.delete('/sources', configController.removeSource);
router.post('/competitors', configController.addCompetitor);
router.delete('/competitors', configController.removeCompetitor);
router.put('/country', configController.updateCountry);
router.put('/refresh', configController.updateRefreshInterval);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ success: true, status: 'healthy', timestamp: new Date().toISOString() });
});

// Manual pipeline trigger
router.post('/trigger', monitoringController.triggerManualRun);

export default router;
