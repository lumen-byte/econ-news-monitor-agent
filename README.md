# Economic News Monitoring Agent

A production-quality, clean-architecture Node.js AI agent that periodically fetches news, analyzes it using the Google Gemini API for macroeconomic impact, and exposes REST APIs for configuration management and system monitoring.

---

## Folder Structure

```
src/
├── app.js                          # Express app configuration & middleware binding
├── server.js                       # Server entry point, cron initializer, & graceful shutdown
├── config/
│   └── env.js                      # Environment variable schema loader & warning validator
├── routes/
│   └── index.js                    # Base API endpoint registry
├── controllers/
│   ├── config.controller.js        # Controller exposing topic, source, competitor updates
│   ├── news.controller.js          # Controller querying generated reports
│   └── monitoring.controller.js    # Health status and manual trigger handler
├── services/
│   ├── scheduler.service.js        # Dynamic cron scheduler mapping
│   ├── news-fetching.service.js    # Article querying from NewsAPI with retry and timeout logic
│   ├── ai-analysis.service.js      # Structured Gemini classification logic
│   └── agent-orchestrator.service.js # orchestrator executing pipeline runs concurrently
├── repositories/
│   ├── config.repository.js        # Config JSON persist wrapper
│   ├── cache.repository.js         # Cache database and processed article hashes registry
│   └── report.repository.js        # Economic analysis report registry
├── prompts/
│   └── economic-analysis.prompt.js # Macroeconomic few-shot instructions & JSON schema
├── middlewares/
│   ├── error-handler.middleware.js # Express central error handler
│   └── validator.middleware.js     # Config inputs validator
└── utils/
    └── logger.js                   # Winston logger wrapper writing to console & logs/app.log
storage/
├── config.json                     # Persistent monitoring parameters
├── cache.json                      # Persistent execution statuses & cached responses
└── reports.json                    # Persistent macroeconomic analyst evaluations
```

---

## Architecture

This application follows **Clean Architecture** patterns, separating concern layers:
1. **Infrastructure Layer**: Filesystem reads/writes using local JSON persistence and network configurations (Axios, Google GenAI SDK, Winston).
2. **Interface Adapters (Controllers / Routers)**: Translate HTTP requests into system calls and format HTTP responses.
3. **Application Business Rules (Services)**: Contain workflow coordinators like `AgentOrchestratorService` that link repositories and API clients.
4. **Enterprise Business Rules (Prompts / Schemas)**: Prompt definitions instructing models how to evaluate article context.

---

## Installation

1. Clone or navigate to the repository directory.
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and fill in credentials:
   ```bash
   PORT=3000
   NEWS_API_KEY=your_news_api_key
   GEMINI_API_KEY=your_gemini_api_key
   LOG_LEVEL=info
   ```
4. Start the server in production mode:
   ```bash
   npm start
   ```

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | HTTP server binding port | `3000` |
| `NEWS_API_KEY` | API authentication key for NewsAPI.org | *Required* |
| `GEMINI_API_KEY` | API authentication key for Gemini SDK | *Required* |
| `LOG_LEVEL` | Level threshold filtering logger output | `info` |

---

## API Endpoints

All routes are prefixed with `/api`.

### News Monitoring Reports
- **`GET /api/monitor`**: Retrieve generated economic report summaries. Supports optional queries:
  - `country`: Filter reports by country code (e.g. `us`).
  - `category`: Filter reports by impact category (e.g. `Monetary Policy`).
  - `sentiment`: Filter by `Positive`, `Neutral`, or `Negative`.
  - `limit`: Limit results to the N latest records.

### Config Modifiers
- **`GET /api/config`**: Return the current active monitoring configuration.
- **`POST /api/topics`**: Add a monitored keyword topic. Body: `{ "topic": "string" }`
- **`DELETE /api/topics`**: Remove a monitored keyword topic. Body: `{ "topic": "string" }`
- **`POST /api/sources`**: Add a custom source filter. Body: `{ "source": "string" }`
- **`DELETE /api/sources`**: Remove a custom source filter. Body: `{ "source": "string" }`
- **`POST /api/competitors`**: Add a competitor company keyword filter. Body: `{ "competitor": "string" }`
- **`DELETE /api/competitors`**: Remove a competitor company keyword filter. Body: `{ "competitor": "string" }`
- **`PUT /api/country`**: Update monitored country. Body: `{ "country": "string" }`
- **`PUT /api/refresh`**: Update scheduler interval. Body: `{ "refreshInterval": "cron expression" }`

### Monitoring & Status
- **`GET /api/health`**: Simple health status checks.

---

## How the Scheduler Works

1. At bootstrap, the **`SchedulerService`** loads the configuration profile from `storage/config.json` and schedules a task on `node-cron` matching `refreshInterval`.
2. When update calls targeting the refresh interval (`PUT /api/refresh`) are received, the scheduler dynamic re-binder checks if the expression has modified, stops the running job instance, and binds a new scheduler lifecycle.
3. If tasks crash due to transient exceptions, the orchestrator handles them, logs errors to `logs/app.log`, writes metrics to `cache.json`, and allows the daemon scheduler to run continuously.

---

## How the AI Agent Works

- The pipeline fetches articles matching custom parameters.
- Duplicate checks check URLs against `storage/cache.json` entries.
- If a cached response exists and its age is less than the duration represented by `refreshInterval`, the previous Gemini analysis is reused.
- For new articles, details are formatted into a prompt matching instructions and few-shot examples (demonstrating economic evaluations vs movie/celebrity clickbait noise).
- The Gemini model analyzes the article, filters out noise, classifies it into one of the target macroeconomic categories (`GDP`, `Inflation`, `Trade`, `Taxation`, `Markets`, `Employment`, `Banking`, `International Relations`, `Monetary Policy`, or `Other`), and returns structured JSON containing `title`, `summary`, `importance`, `confidence`, `reasoning`, `category`, `impact`, `affectedIndustries`, and `futureOutlook`.
- Significant economic developments are saved inside `reports.json` and cached inside `cache.json`.

---

## Future Improvements

- **Webhooks & Alerting**: Connect outbound notifications (Slack, Discord, Email) to alert administrators when `High` importance economic shifts are registered.
- **Advanced Concurrency Limits**: Add task throttling queues (e.g. `p-limit`) to ensure API rate limit ceilings are never violated when evaluating large batches.
- **Multilingual Support**: Configure Gemini instructions to translate foreign language publications automatically.

---

## Production Improvements

- **Production-grade Database**: Replace JSON flat-file storage with persistent document databases (e.g. MongoDB or PostgreSQL) to resolve locking issues when multiple concurrent processes write data.
- **Advanced Request Throttling**: Configure API rate limiters (e.g. `express-rate-limit`) on configuration PUT/POST endpoints to safeguard administration panels.
- **Authentication**: Bind JWT or OAuth route interceptors to protect sensitive configuration endpoints.

---

## Limitations

- **JSON Concurrency**: Reading/writing entire files on the local disk via `fs-extra` does not support high-concurrency writes, which can lead to write collisions if multiple client requests run concurrently.
- **Context Constraints**: The NewsAPI top-headlines or general search returns truncated preview content unless using premium commercial tiers.
