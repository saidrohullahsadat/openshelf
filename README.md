# OpenShelf – Digital Library Management System

<p align="center">

**Discover. Read. Learn. Grow.**

A modern, full-stack digital library platform designed to make discovering, reading, and managing books easier.

</p>

---

## Overview

**OpenShelf** is a full-stack digital library management platform built with React, Vite, Node.js, Express, PostgreSQL, and Drizzle ORM.

It provides readers with a complete digital reading experience, including book discovery, online PDF reading, downloads, bookmarks, favorites, reviews, and personalized recommendations.

Administrators have access to a dedicated dashboard for managing books, categories, users, contributions, reviews, reports, download policies, and library activity.

OpenShelf is designed to provide an organized, accessible, and reader-focused experience across desktop and mobile devices.

## Features

### 📚 Book Discovery & Catalog

- Browse a searchable and paginated book catalog.
- Filter books by category and language.
- Sort books using different criteria.
- View detailed book information, subjects, reading levels, and source attribution.
- Discover popular and recently added books.

### 📖 Reading Experience

- Read PDF books directly inside the application.
- Download books with a credit-based allowance.
- Save reading progress.
- Bookmark individual PDF pages.
- Use reader zoom and full-screen controls.
- Access reading history and previously opened books.

### 👤 User Accounts

- Secure registration, login, and logout.
- Google OpenID Connect authentication.
- Argon2id password hashing.
- Secure, HTTP-only session cookies.
- Personal profile and preferences.
- Favorite books and reading lists.
- Contribution and download history.
- Reading activity and notifications.

### ⭐ Ratings & Recommendations

- Submit book ratings and reviews.
- Admin moderation before reviews become public.
- Personalized book recommendations.
- Recommendations based on subjects, categories, reading activity, popularity, and recency.
- Collaborative recommendations based on similar readers.
- Explanations showing why a book is recommended.

### ⬆️ Book Contributions

- Allow users to contribute PDF books.
- Validate PDF uploads and file signatures.
- Detect potential duplicate books.
- Submit contributions for administrator review.
- Notify contributors when submissions are reviewed.
- Maintain an auditable contribution-credit ledger.

### 🎁 Download Credit System

OpenShelf uses a distinct-book download allowance:

| Rule                             | Allowance |
| -------------------------------- | --------: |
| Initial free downloads           |   3 books |
| Published contributions required |         3 |
| Additional download credits      |        10 |
| Daily download limit             | 10 events |

- Downloading a new book consumes one distinct-book credit.
- Downloading the same book again does not consume another distinct-book credit.
- Repeat downloads are recorded in download history.
- Online reading does not consume download credits.
- Credit transactions are protected against concurrent requests.

### 🛡️ Administration Dashboard

- Manage books and publication status.
- Create and update categories.
- Manage users, roles, and account suspensions.
- Review and moderate book contributions.
- Moderate ratings and reviews.
- Manage user reports.
- View audit logs.
- Configure download-credit policies.
- Monitor library activity and dashboard statistics.

### 🌐 Interface & Accessibility

- Responsive desktop and mobile layouts.
- Modern editorial-style interface.
- Dark theme.
- English and partial Pashto translations.
- Right-to-left support for Pashto and Dari/Persian book details.
- Progressive Web App (PWA) support.
- Offline-cached application shell.

---

## Technology Stack

| Technology            | Purpose                           |
| --------------------- | --------------------------------- |
| React                 | Frontend interface                |
| Vite                  | Development server and build tool |
| JavaScript            | Application programming           |
| Tailwind CSS / CSS    | Styling                           |
| Node.js               | Backend runtime                   |
| Express.js            | REST API                          |
| PostgreSQL            | Relational database               |
| Drizzle ORM           | Database queries and schema       |
| Neon serverless       | Hosted PostgreSQL connection pool |
| Vercel Blob           | Private original PDF storage      |
| Google Gen AI         | Gemini File Search and AI answers |
| Argon2id              | Password hashing                  |
| Google OpenID Connect | Authentication                    |
| PDF                   | Digital book format               |

## Project Structure

```text
OpenShelf/
├── src/                    # React frontend application
├── server/                 # Express API and backend
│   └── db/                 # Database schema and migrations
├── public/                 # Public assets and PWA files
├── api/index.js            # Vercel serverless Express entry point
├── server/services/        # Private Blob storage and Gemini File Search
├── scripts/                # Database and storage maintenance tools
├── dist/                   # Production build output
├── app.js                  # Application entry
├── auth.js                 # Authentication
├── index.html              # HTML entry point
├── drizzle.config.js       # Drizzle configuration
├── vite.config.js          # Vite configuration
├── package.json
├── .env.example
└── README.md
```

## Getting Started

### Requirements

Make sure you have installed:

- Node.js 20 or newer
- npm
- PostgreSQL 15 or newer
- Git

### 1. Clone the repository

```bash
git clone https://github.com/saidrohullahsadat/openshelf.git

cd openshelf
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create your environment file:

```bash
cp .env.example .env
```

Configure the local PostgreSQL URL and administrator credentials in `.env`. For Neon, use the pooled connection string from the Neon dashboard.

Example:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/library

ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your-secure-password

MAX_UPLOAD_MB=50

FREE_DOWNLOADS=3
CONTRIBUTIONS_PER_UNLOCK=3
DOWNLOADS_PER_UNLOCK=10
```

Use your own secure credentials. Never commit `.env` to GitHub.

### 4. Create the database

```bash
createdb library
```

### 5. Run database migrations

```bash
npm run db:generate
npm run db:migrate
```

### 6. Seed development data

```bash
npm run db:seed
```

The development seed provides sample books and starter categories. It is not intended for production.

### 7. Start the application

```bash
npm run dev
```

The development services use:

| Service     | URL                          |
| ----------- | ---------------------------- |
| Frontend    | http://localhost:5173        |
| Backend API | http://localhost:3000        |
| API base    | http://localhost:3000/api/v1 |

The Vite development server proxies `/api` requests to the Express backend.

## Google Authentication

OpenShelf supports Google OpenID Connect authentication.

To enable it:

1. Create an OAuth 2.0 Web application in Google Cloud Console.
2. Configure the authorized redirect URI:

```text
http://localhost:3000/api/v1/auth/google/callback
```

3. Add your credentials to `.env`:

```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

GOOGLE_REDIRECT_URI=http://localhost:3000/api/v1/auth/google/callback

APP_URL=http://localhost:5173
```

Google authentication requires valid OAuth credentials. Native Android and iOS Google sign-in require additional redirect and deep-link configuration.

## API Overview

All backend endpoints use:

```text
/api/v1
```

| Module           | Main endpoints                                              |
| ---------------- | ----------------------------------------------------------- |
| Authentication   | `/auth/register`, `/auth/login`, `/auth/logout`, `/auth/me` |
| Books            | `/books`, `/books/:id`, `/contributions`                    |
| AI search        | `/ai/ask`, `/ai/indexing-status/:bookId`                    |
| Categories       | `/categories`                                               |
| Contributions    | `/contributions`                                            |
| Personal library | `/me/books`, `/me/list`, `/me/likes`                        |
| Downloads        | `/me/downloads`, `/me/credits`                              |
| Reading          | `/me/reading`, `/books/:id/read`, `/books/:id/progress`     |
| Recommendations  | `/books/:id/recommendations`                                |
| Ratings          | `/books/:id/ratings`                                        |
| Notifications    | `/me/notifications`                                         |
| Administration   | `/admin/overview`, `/admin/contributions`                   |
| Audit logs       | `/admin/audit-logs`                                         |

Additional endpoints support bookmarks, favorites, reports, moderation, user management, and credit-policy administration.

## Database & File Storage

OpenShelf uses PostgreSQL for relational data and Drizzle ORM for database operations.

- Database schema: `server/db/schema.js`
- Migration generation: `npm run db:generate`
- Migration execution: `npm run db:migrate`
- Development seed: `npm run db:seed`

New production PDFs are stored in a private Vercel Blob store. PostgreSQL stores the private Blob pathname and file metadata. Authenticated API routes stream PDFs for reading and downloading; the Blob pathname and access token are not sent to the frontend. Local development uses the ignored `STORAGE_DIR` only when Blob credentials are absent. Existing Drive and local file references remain readable while migrating old data.

### Neon, Blob, and Gemini setup

1. Create a Neon PostgreSQL project and copy its pooled connection string to `DATABASE_URL`. Production detects Neon URLs and uses `@neondatabase/serverless` with Drizzle's Neon serverless pool driver; local PostgreSQL URLs use the existing `pg` driver. Keep the connection pool small for serverless instances.
2. Create a **private** Vercel Blob store attached to the Vercel project. Vercel supplies `BLOB_READ_WRITE_TOKEN`; keep it as a server environment variable. Set `MAX_UPLOAD_MB` to the desired limit (default 50).
3. In the Vercel project build environment, set `VITE_BLOB_CLIENT_UPLOADS=true`. Production browser uploads then use short-lived, restricted upload tokens and send large PDF bytes directly to Blob instead of through the 4.5 MB serverless request body limit. The private store token is never sent to the browser. Local upload uses the Express multipart endpoint.
4. Create a Gemini API key in Google AI Studio and set `GEMINI_API_KEY`. If `GEMINI_FILE_SEARCH_STORE_NAME` is empty, the server reuses an OpenShelf store or creates one and persists its resource name in `system_settings`. You can provide an existing resource name with that environment variable instead. `GEMINI_MODEL` defaults to `gemini-2.5-flash`.
5. Set `CRON_SECRET` to a long random secret. The Vercel cron route polls asynchronous Gemini indexing operations once daily, which is compatible with Hobby. On Pro or Enterprise, change the schedule in `vercel.json` to `*/5 * * * *` for more frequent polling. A signed-in user can also check their own book's status; admins can retry failed indexing from Administration → Books.

Migration `0009_neon_blob_gemini_indexing.sql` adds nullable Blob and Gemini references and indexing status without replacing existing tables or files. Migration `0010_gemini_indexing_errors.sql` adds a bounded error message field. Run committed migrations with `npm run db:migrate`; production deployment must not run `drizzle-kit push` or generate migrations against production. A book record remains saved when Gemini indexing fails, and its original Blob PDF is retained for retry.

Before deploying data that still points to local disk or Google Drive, configure a working Blob store and run `npm run storage:migrate:blob` from an environment that can still read those original files. The script copies PDFs to private Blob, retains the old file references for rollback, and attempts indexing for approved books. Review its per-book output and failed count before removing or retiring the old storage.

### Vercel deployment

This repository is configured as one Vercel project: the root builds the Vite app to `dist`, while `api/index.js` exports the existing Express app as a Node serverless function. `vercel.json` rewrites `/api/v1/*` and `/health` to that handler and provides the SPA fallback. Keep the Vercel project root at the repository root and use the committed build/output settings. Configure `DATABASE_URL`, `BLOB_READ_WRITE_TOKEN`, `GEMINI_API_KEY`, `GEMINI_FILE_SEARCH_STORE_NAME` (optional), `GEMINI_MODEL`, `CLIENT_URL`, `APP_URL`, `CORS_ORIGINS` (optional comma-separated extra origins), `CRON_SECRET`, `SESSION_DAYS`, and `SESSION_COOKIE_SAMESITE` in Vercel for Production and Preview as appropriate. Set `NODE_ENV=production` and the build variable `VITE_BLOB_CLIENT_UPLOADS=true`. Configure Google OAuth redirect URI to `https://YOUR_DOMAIN/api/v1/auth/google/callback`, and set matching `GOOGLE_REDIRECT_URI` and `APP_URL`. Use the same Vercel origin for frontend and API so the existing HTTP-only session cookie remains same-site. Run the database migrations once before serving production traffic.

AI endpoint example (requires an authenticated session cookie and the existing `X-Requested-With: library` CSRF header):

```http
POST /api/v1/ai/ask
Content-Type: application/json
X-Requested-With: library

{"question":"What do the indexed books say about photosynthesis?"}
```

AI search is rate limited to 12 requests per minute per runtime instance. Gemini and Blob operations require real configured credentials; local build/unit tests do not verify external account connectivity.

## Testing & Build

Run the available tests:

```bash
npm test
```

Create a production build:

```bash
npm run build
```

The latest recorded verification reported:

- Unit tests: 12/12 passed.
- Production frontend build: passed.
- Updated API and middleware syntax checks: passed.
- Development database migrations: applied successfully.

These are recorded development results, not a guarantee of production readiness.

## Security

OpenShelf includes several security measures:

- Argon2id password hashing.
- Hashed opaque session tokens.
- HTTP-only session cookies.
- CSRF request-header protection.
- Authentication and role-based authorization.
- Rate limiting for authentication endpoints.
- PDF upload validation.
- Private file storage.
- Parameterized database queries.
- Transactional download-credit management.
- Audit logging for administrative actions.

For production deployment, configure HTTPS, secure environment variables, persistent storage, database backups, and appropriate reverse-proxy limits.

Some additional production safeguards, including malware scanning, a formal copyright takedown workflow, and broader security integration tests, remain to be implemented.

## Current Development Status

OpenShelf is an actively developed project.

**Implemented:** Core authentication, book catalog, PDF contributions, download credits, online reading, bookmarks, recommendations, ratings, notifications, administration, dark theme, and partial Pashto localization.

**Still in development:**

- PDF table of contents and automatic page-count metadata.
- Copyright complaint workflow.
- Expanded subject taxonomy management.
- Additional account settings.
- Comprehensive integration, concurrency, and security testing.
- Production deployment and operations documentation.
- Complete multilingual translation coverage.

See [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) for the detailed implementation checklist.

## Contributing

Contributions, suggestions, bug reports, and improvements are welcome.

If you want to contribute:

1. Fork the repository.
2. Create a feature branch.
3. Implement your changes.
4. Test your changes.
5. Submit a pull request.

## License

A license has not yet been specified. Check the repository for licensing information before redistributing or reusing the project.

---

## Author

**Said Rohullah Sadat**

Full-Stack Developer | Computer Science Student

- GitHub: [@saidrohullahsadat](https://github.com/saidrohullahsadat)
- Project: [OpenShelf](https://github.com/saidrohullahsadat/openshelf)

---

<p align="center">

**OpenShelf – Your Digital Library, Your Knowledge.**

</p>
