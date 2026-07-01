import newsFetchingService from './news-fetching.service.js';
import aiAnalysisService from './ai-analysis.service.js';
import configRepository from '../repositories/config.repository.js';
import cacheRepository from '../repositories/cache.repository.js';
import reportRepository from '../repositories/report.repository.js';
import logger from '../utils/logger.js';

class AgentOrchestratorService {
  constructor() {
    this.isRunning = false;
  }

  /**
   * Runs the economic news monitoring pipeline.
   * Leverages concurrency to analyze articles in parallel.
   */
  async runPipeline() {
    if (this.isRunning) {
      logger.warn('Agent pipeline execution is already in progress. Skipping duplicate run.');
      return { success: false, reason: 'Already running' };
    }

    this.isRunning = true;
    logger.info('Executing scheduled agent pipeline pass...');
    let processedCount = 0;

    try {
      // 1. Fetch current active configuration profile details
      const config = await configRepository.loadConfig();

      // 2. Query NewsAPI for candidate articles
      const articles = await newsFetchingService.fetchNews(config.country, config.topics, config.sources);
      
      // 3. Process candidate articles concurrently using Promise.all to optimize performance
      const analysisPromises = articles.map(async (article) => {
        try {
          // Check cache database first to avoid calling Gemini for recently evaluated articles
          let analysis = await cacheRepository.getCachedResponse(article.hash, config.refreshInterval);
          
          if (analysis) {
            logger.info(`Reusing cached AI analysis response for URL: ${article.url}`);
          } else {
            logger.info(`Requesting Gemini analysis for: "${article.title}"`);
            analysis = await aiAnalysisService.analyzeArticle(article);
            // Cache the analysis payload
            await cacheRepository.setCachedResponse(article.hash, analysis);
          }

          // Mark article as processed
          await cacheRepository.markAsProcessed(article.hash);
          processedCount++;

          if (analysis.economicallySignificant) {
            const report = {
              title: analysis.title,
              description: article.description,
              url: article.url,
              source: article.source,
              publishedAt: article.publishedAt,
              country: article.country,
              sentiment: analysis.sentiment || 'Neutral',
              relevanceScore: analysis.confidence,
              importance: analysis.importance,
              reasoning: analysis.reasoning,
              impactCategory: analysis.category,
              impact: analysis.impact,
              affectedIndustries: analysis.affectedIndustries,
              futureOutlook: analysis.futureOutlook,
              summary: analysis.summary
            };
            await reportRepository.saveReport(report);
          }
        } catch (itemError) {
          // Log item-level processing error but allow the rest of the batch to complete
          logger.error(`Error processing article "${article.title}":`, itemError);
        }
      });

      await Promise.all(analysisPromises);

      logger.info(`Agent pipeline run completed. Analyzed ${processedCount} candidate articles.`);
      await cacheRepository.updateLastExecution(true, processedCount);
      this.isRunning = false;
      return { success: true, evaluated: processedCount };
    } catch (error) {
      logger.error('Critical orchestrator exception occurred:', error);
      await cacheRepository.updateLastExecution(false, processedCount, error);
      this.isRunning = false;
      throw error;
    }
  }
}

export default new AgentOrchestratorService();
