import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CACHE_PATH = path.join(__dirname, '../../storage/cache.json');

class CacheRepository {
  constructor() {
    this.defaultCache = {
      // Map of articleHash -> { timestamp: string, analysis: object }
      cachedAnalysis: {},
      processedArticleHashes: [],
      lastExecution: {
        timestamp: null,
        success: false,
        processedCount: 0,
        error: null
      }
    };
  }

  async getCache() {
    try {
      if (await fs.pathExists(CACHE_PATH)) {
        const cache = await fs.readJson(CACHE_PATH);
        if (!cache.cachedAnalysis) {
          cache.cachedAnalysis = {};
        }
        if (!cache.processedArticleHashes) {
          cache.processedArticleHashes = [];
        }
        if (!cache.lastExecution) {
          cache.lastExecution = this.defaultCache.lastExecution;
        }
        return cache;
      }
      await fs.ensureDir(path.dirname(CACHE_PATH));
      await fs.writeJson(CACHE_PATH, this.defaultCache, { spaces: 2 });
      return this.defaultCache;
    } catch (error) {
      logger.error('Error reading cache database', error);
      return this.defaultCache;
    }
  }

  async saveCache(cacheData) {
    try {
      await fs.ensureDir(path.dirname(CACHE_PATH));
      await fs.writeJson(CACHE_PATH, cacheData, { spaces: 2 });
    } catch (error) {
      logger.error('Error saving cache database', error);
      throw error;
    }
  }

  /**
   * Helper to parse a cron expression or default to 60 minutes in milliseconds
   */
  _getIntervalMs(cronExpression) {
    // Basic parser for default "0 * * * *" or "*/5 * * * *" format intervals.
    if (cronExpression && cronExpression.startsWith('*/')) {
      const minutes = parseInt(cronExpression.split(' ')[0].replace('*/', ''), 10);
      if (!isNaN(minutes)) return minutes * 60 * 1000;
    }
    return 60 * 60 * 1000; // Default: 60 minutes
  }

  async getCachedResponse(articleHash, cronExpression) {
    const cache = await this.getCache();
    const entry = cache.cachedAnalysis[articleHash];
    if (!entry) return null;

    const ageMs = Date.now() - new Date(entry.timestamp).getTime();
    const intervalMs = this._getIntervalMs(cronExpression);

    if (ageMs > intervalMs) {
      // Evict expired cache
      delete cache.cachedAnalysis[articleHash];
      await this.saveCache(cache);
      return null;
    }

    return entry.analysis;
  }

  async isProcessed(articleHash) {
    const cache = await this.getCache();
    return cache.processedArticleHashes.includes(articleHash);
  }

  async markAsProcessed(articleHash) {
    const cache = await this.getCache();
    if (!cache.processedArticleHashes.includes(articleHash)) {
      cache.processedArticleHashes.push(articleHash);
      if (cache.processedArticleHashes.length > 2000) {
        cache.processedArticleHashes.shift();
      }
      await this.saveCache(cache);
    }
  }

  async setCachedResponse(articleHash, analysis) {
    const cache = await this.getCache();
    cache.cachedAnalysis[articleHash] = {
      timestamp: new Date().toISOString(),
      analysis
    };
    await this.saveCache(cache);
  }

  async updateLastExecution(success, processedCount, error = null) {
    const cache = await this.getCache();
    cache.lastExecution = {
      timestamp: new Date().toISOString(),
      success,
      processedCount,
      error: error ? error.message || String(error) : null
    };
    await this.saveCache(cache);
  }
}

export default new CacheRepository();
