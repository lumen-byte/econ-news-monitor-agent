import express from 'express';
import monitoringController from '../controllers/monitoring.controller.js';

const router = express.Router();

router.get('/status', monitoringController.getStatus);
router.post('/trigger', monitoringController.triggerManualRun);

export default router;
