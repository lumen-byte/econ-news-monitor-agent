import axios from 'axios';
import crypto from 'crypto';
import env from '../config/env.js';
import logger from '../utils/logger.js';

class NewsFetchingService {
  /**
   * Helper to execute axios calls with retries and a 10s timeout
   */
  async _requestWithRetry(url, config, retries = 2, delayMs = 1000) {
    const configWithTimeout = {
      ...config,
      timeout: 10000 // 10 seconds timeout
    };

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await axios.get(url, configWithTimeout);
      } catch (error) {
        const isTransient = !error.response || (error.response.status >= 500 && error.response.status <= 599) || error.response.status === 429;
        
        if (isTransient && attempt < retries) {
          logger.warn(`API request failed on attempt ${attempt} for ${url}. Retrying in ${delayMs}ms... Error: ${error.message}`);
          await new Promise(res => setTimeout(res, delayMs));
          delayMs *= 2;
        } else {
          throw error;
        }
      }
    }
  }

  /**
   * Primary fetcher: GNews API
   */
  async _fetchGNews(country, query) {
    if (!env.GNEWS_API_KEY) {
      throw new Error('GNEWS_API_KEY is not defined.');
    }

    logger.info(`Attempting primary fetch via GNews API. Query: "${query}", Country: ${country}`);

    const params = {
      apikey: env.GNEWS_API_KEY,
      q: query,
      max: 10,
      lang: 'en'
    };

    if (country) {
      params.country = country.toLowerCase();
    }

    const endpoint = 'https://gnews.io/api/v4/search';
    const response = await this._requestWithRetry(endpoint, { params });
    const articles = [];

    if (response.data && response.data.articles) {
      for (const art of response.data.articles) {
        if (!art.url || !art.title) continue;

        const hash = crypto.createHash('sha256').update(art.url).digest('hex');
        articles.push({
          hash,
          title: art.title,
          description: art.description || '',
          url: art.url,
          content: art.content || art.description || '',
          publishedAt: art.publishedAt || new Date().toISOString(),
          source: art.source ? art.source.name : 'GNews',
          author: 'Unknown',
          language: 'en',
          country: country || 'any'
        });
      }
    }

    return articles;
  }

  /**
   * Secondary fallback fetcher: NewsAPI
   */
  async _fetchNewsAPI(country, query, sources = []) {
    if (!env.NEWS_API_KEY) {
      throw new Error('NEWS_API_KEY/NEWSAPI_KEY is not defined.');
    }

    logger.info(`Attempting fallback fetch via NewsAPI. Query: "${query}"`);

    const params = {
      apiKey: env.NEWS_API_KEY,
      pageSize: 10
    };

    let endpoint = 'https://newsapi.org/v2/everything';

    if (sources.length > 0) {
      params.sources = sources.join(',');
      if (query) params.q = query;
    } else {
      if (country) {
        endpoint = 'https://newsapi.org/v2/top-headlines';
        params.country = country.toLowerCase();
        if (query) params.q = query;
      } else if (query) {
        params.q = query;
      }
    }

    const response = await this._requestWithRetry(endpoint, { params });
    const articles = [];

    if (response.data && response.data.articles) {
      for (const art of response.data.articles) {
        if (!art.url || !art.title) continue;

        const hash = crypto.createHash('sha256').update(art.url).digest('hex');
        articles.push({
          hash,
          title: art.title,
          description: art.description || '',
          url: art.url,
          content: art.content || art.description || '',
          publishedAt: art.publishedAt || new Date().toISOString(),
          source: art.source ? art.source.name : 'NewsAPI',
          author: art.author || 'Unknown',
          language: art.language || 'en',
          country: country || 'any'
        });
      }
    }

    return articles;
  }

  /**
   * Fetches latest economic news articles.
   * Uses GNews as primary API, and falls back to NewsAPI on errors/keys missing.
   */
  async fetchNews(country, topics = [], competitors = [], sources = []) {
    // Build queries
    let queryParts = [];
    if (topics.length > 0) {
      queryParts.push(`(${topics.slice(0, 3).map(t => `"${t}"`).join(' OR ')})`); // Keep query length optimized for GNews limitations
    }
    if (competitors.length > 0) {
      queryParts.push(`(${competitors.map(c => `"${c}"`).join(' OR ')})`);
    }

    const query = queryParts.join(' AND ');
    if (!query && sources.length === 0) {
      return [];
    }

    // Try GNews first
    try {
      if (env.GNEWS_API_KEY) {
        return await this._fetchGNews(country, query);
      } else {
        logger.warn('GNEWS_API_KEY missing. Skipping GNews primary fetch.');
      }
    } catch (gnewsError) {
      logger.error(`Primary GNews fetch failed: ${gnewsError.message}. Switching to NewsAPI fallback...`);
    }

    // Fall back to NewsAPI
    try {
      if (env.NEWS_API_KEY) {
        return await this._fetchNewsAPI(country, query, sources);
      } else {
        logger.warn('NEWS_API_KEY/NEWSAPI_KEY missing. No fallback available.');
      }
    } catch (newsApiError) {
      logger.error(`Fallback NewsAPI fetch failed: ${newsApiError.message}`);
    }

    return [];
  }
}

export default new NewsFetchingService();
