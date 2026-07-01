import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG_PATH = path.join(__dirname, '../../storage/config.json');

class ConfigRepository {
  constructor() {
    this.defaultConfig = {
      country: "us",
      topics: ["inflation", "gdp", "interest rate", "monetary policy", "unemployment", "recession"],
      competitors: [],
      sources: [],
      refreshInterval: "0 * * * *"
    };
  }

  async loadConfig() {
    try {
      if (await fs.pathExists(CONFIG_PATH)) {
        const config = await fs.readJson(CONFIG_PATH);
        // Map legacy keys to new properties if present
        if (config.countries && !config.country) {
          config.country = config.countries[0] || 'us';
        }
        if (config.keywords && !config.topics) {
          config.topics = config.keywords;
        }
        if (config.cronInterval && !config.refreshInterval) {
          config.refreshInterval = config.cronInterval;
        }
        
        // Ensure new array elements exist
        if (!config.topics) config.topics = this.defaultConfig.topics;
        if (!config.competitors) config.competitors = this.defaultConfig.competitors;
        if (!config.sources) config.sources = this.defaultConfig.sources;
        if (!config.country) config.country = this.defaultConfig.country;
        if (!config.refreshInterval) config.refreshInterval = this.defaultConfig.refreshInterval;

        return config;
      }
      await fs.ensureDir(path.dirname(CONFIG_PATH));
      await fs.writeJson(CONFIG_PATH, this.defaultConfig, { spaces: 2 });
      return this.defaultConfig;
    } catch (error) {
      logger.error('Error loading config file repository', error);
      return this.defaultConfig;
    }
  }

  // Alias to support legacy getConfig calls
  async getConfig() {
    return this.loadConfig();
  }

  async saveConfig(newConfig) {
    try {
      await fs.ensureDir(path.dirname(CONFIG_PATH));
      await fs.writeJson(CONFIG_PATH, newConfig, { spaces: 2 });
      logger.info('Config saved successfully');
      return newConfig;
    } catch (error) {
      logger.error('Error saving configuration', error);
      throw error;
    }
  }

  // Alias to support legacy updateConfig calls
  async updateConfig(newConfig) {
    const current = await this.loadConfig();
    const updated = {
      country: newConfig.country !== undefined ? newConfig.country : current.country,
      topics: newConfig.topics !== undefined ? newConfig.topics : current.topics,
      competitors: newConfig.competitors !== undefined ? newConfig.competitors : current.competitors,
      sources: newConfig.sources !== undefined ? newConfig.sources : current.sources,
      refreshInterval: newConfig.refreshInterval !== undefined ? newConfig.refreshInterval : current.refreshInterval
    };
    return this.saveConfig(updated);
  }

  async addTopic(topic) {
    const config = await this.loadConfig();
    if (!config.topics.includes(topic)) {
      config.topics.push(topic);
      await this.saveConfig(config);
    }
    return config;
  }

  async removeTopic(topic) {
    const config = await this.loadConfig();
    config.topics = config.topics.filter(t => t !== topic);
    await this.saveConfig(config);
    return config;
  }

  async addSource(source) {
    const config = await this.loadConfig();
    if (!config.sources.includes(source)) {
      config.sources.push(source);
      await this.saveConfig(config);
    }
    return config;
  }

  async removeSource(source) {
    const config = await this.loadConfig();
    config.sources = config.sources.filter(s => s !== source);
    await this.saveConfig(config);
    return config;
  }

  async addCompetitor(competitor) {
    const config = await this.loadConfig();
    if (!config.competitors.includes(competitor)) {
      config.competitors.push(competitor);
      await this.saveConfig(config);
    }
    return config;
  }

  async removeCompetitor(competitor) {
    const config = await this.loadConfig();
    config.competitors = config.competitors.filter(c => c !== competitor);
    await this.saveConfig(config);
    return config;
  }

  async updateCountry(country) {
    const config = await this.loadConfig();
    config.country = country;
    await this.saveConfig(config);
    return config;
  }

  async updateRefreshInterval(refreshInterval) {
    const config = await this.loadConfig();
    config.refreshInterval = refreshInterval;
    await this.saveConfig(config);
    return config;
  }
}

export default new ConfigRepository();
