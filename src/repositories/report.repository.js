import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPORTS_PATH = path.join(__dirname, '../../storage/reports.json');

class ReportRepository {
  async getReports() {
    try {
      if (await fs.pathExists(REPORTS_PATH)) {
        const data = await fs.readJson(REPORTS_PATH);
        return Array.isArray(data) ? data : [];
      }
      return [];
    } catch (error) {
      logger.error('Error reading reports JSON repository', error);
      return [];
    }
  }

  async saveReport(report) {
    try {
      const reports = await this.getReports();
      reports.push({
        id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
        createdAt: new Date().toISOString(),
        ...report
      });
      await fs.ensureDir(path.dirname(REPORTS_PATH));
      await fs.writeJson(REPORTS_PATH, reports, { spaces: 2 });
      logger.info(`Saved new economic report with title: "${report.title}"`);
    } catch (error) {
      logger.error('Error saving economic analysis report', error);
      throw error;
    }
  }
}

export default new ReportRepository();
