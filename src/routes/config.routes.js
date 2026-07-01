import express from 'express';
import configController from '../controllers/config.controller.js';
import * as validator from '../middlewares/validator.middleware.js';

const router = express.Router();

router.get('/', configController.getConfig);
router.put('/', validator.validateConfigInput, configController.updateConfig);

router.post('/topic', configController.addTopic);
router.delete('/topic', configController.removeTopic);

router.post('/source', configController.addSource);
router.delete('/source', configController.removeSource);

router.post('/competitor', configController.addCompetitor);
router.delete('/competitor', configController.removeCompetitor);

router.put('/country', configController.updateCountry);
router.put('/refresh-interval', configController.updateRefreshInterval);

export default router;
