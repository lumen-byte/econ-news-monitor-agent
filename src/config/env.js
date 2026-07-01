import dotenv from 'dotenv';
dotenv.config();

const env = {
  PORT: parseInt(process.env.PORT || '3000', 10),
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GNEWS_API_KEY: process.env.GNEWS_API_KEY,
  NEWS_API_KEY: process.env.NEWS_API_KEY || process.env.NEWSAPI_KEY,
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
};

if (!env.GEMINI_API_KEY) {
  console.warn('[WARNING] GEMINI_API_KEY is not defined in the environment variables.');
}
if (!env.GNEWS_API_KEY) {
  console.warn('[WARNING] GNEWS_API_KEY is not defined. GNews will not be available.');
}
if (!env.NEWS_API_KEY) {
  console.warn('[WARNING] NEWS_API_KEY/NEWSAPI_KEY is not defined. NewsAPI fallback will not be available.');
}

export default env;
