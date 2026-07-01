export const validateConfigInput = (req, res, next) => {
  const { country, topics, competitors, sources, refreshInterval, enabled } = req.body;

  if (country !== undefined) {
    if (typeof country !== 'string' || country.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Country must be a valid non-empty string.' });
    }
  }

  if (topics !== undefined) {
    if (!Array.isArray(topics) || !topics.every(t => typeof t === 'string' && t.trim().length > 0)) {
      return res.status(400).json({ success: false, error: 'Topics must be an array of non-empty strings.' });
    }
  }

  if (competitors !== undefined) {
    if (!Array.isArray(competitors) || !competitors.every(c => typeof c === 'string' && c.trim().length > 0)) {
      return res.status(400).json({ success: false, error: 'Competitors must be an array of non-empty strings.' });
    }
  }

  if (sources !== undefined) {
    if (!Array.isArray(sources) || !sources.every(s => typeof s === 'string' && s.trim().length > 0)) {
      return res.status(400).json({ success: false, error: 'Sources must be an array of non-empty strings.' });
    }
  }

  if (refreshInterval !== undefined) {
    if (typeof refreshInterval !== 'string' || refreshInterval.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'refreshInterval must be a valid non-empty cron expression string.' });
    }
  }

  next();
};
