import { GoogleGenAI } from '@google/genai';
import env from '../config/env.js';
import logger from '../utils/logger.js';
import * as promptConfig from '../prompts/economic-analysis.prompt.js';

class AIAnalysisService {
  constructor() {
    this.ai = null;
    if (env.GEMINI_API_KEY) {
      this.ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
    }
  }

  /**
   * Analyzes articles and normalizes structured classifications.
   */
  async analyzeArticle(article) {
    if (!this.ai) {
      logger.warn('GEMINI_API_KEY is not defined. Skipping AI analysis.');
      return {
        economicallySignificant: false,
        title: article.title,
        summary: 'Skipped - API key not set.',
        importance: 'Low',
        confidence: 0,
        reasoning: 'API key not configured.',
        category: 'Other',
        impact: '',
        affectedIndustries: [],
        futureOutlook: ''
      };
    }

    try {
      const prompt = promptConfig.getPrompt(article.title, article.description, article.content);
      
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction: promptConfig.SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json'
        }
      });

      const text = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error('Empty response from Gemini API');
      }

      const analysis = JSON.parse(text.trim());
      return {
        economicallySignificant: !!analysis.economicallySignificant,
        title: analysis.title || article.title,
        summary: analysis.summary || '',
        importance: analysis.importance || 'Low',
        confidence: Number(analysis.confidence) || 0,
        reasoning: analysis.reasoning || '',
        category: analysis.category || 'Other',
        impact: analysis.impact || '',
        affectedIndustries: Array.isArray(analysis.affectedIndustries) ? analysis.affectedIndustries : [],
        futureOutlook: analysis.futureOutlook || ''
      };
    } catch (error) {
      logger.error(`Error analyzing article "${article.title}":`, error.message);
      return {
        economicallySignificant: false,
        title: article.title,
        summary: `Failed analysis: ${error.message}`,
        importance: 'Low',
        confidence: 0,
        reasoning: `Analysis failed. Error: ${error.message}`,
        category: 'Other',
        impact: '',
        affectedIndustries: [],
        futureOutlook: ''
      };
    }
  }
}

export default new AIAnalysisService();
