import express from 'express';
import routes from './routes/index.js';
import errorHandler from './middlewares/error-handler.middleware.js';
import logger from './utils/logger.js';

const app = express();

app.use(express.json());

// Serve static frontend dashboard
app.use(express.static('public'));

// Incoming API Request Logger Middleware
app.use((req, res, next) => {
  logger.info(`API Request: ${req.method} ${req.originalUrl}`, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip
  });
  next();
});

app.use('/api', routes);

app.use((req, res, next) => {
  res.status(404).json({ success: false, error: 'Endpoint Not Found' });
});

app.use(errorHandler);

export default app;
