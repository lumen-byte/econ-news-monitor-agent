import reportRepository from '../repositories/report.repository.js';

class NewsController {
  async getReports(req, res, next) {
    try {
      const { country, category, sentiment, limit } = req.query;
      let reports = await reportRepository.getReports();

      if (country) {
        reports = reports.filter(r => r.country.toLowerCase() === country.toLowerCase());
      }
      if (category) {
        reports = reports.filter(r => r.impactCategory.toLowerCase() === category.toLowerCase());
      }
      if (sentiment) {
        reports = reports.filter(r => r.sentiment.toLowerCase() === sentiment.toLowerCase());
      }

      reports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      if (limit) {
        const limitNum = parseInt(limit, 10);
        if (!isNaN(limitNum)) {
          reports = reports.slice(0, limitNum);
        }
      }

      res.json({ success: true, count: reports.length, data: reports });
    } catch (error) {
      next(error);
    }
  }
}

export default new NewsController();
