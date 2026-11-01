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

### 📱 Mobile Application Support

- Capacitor 7 integration.
- Android project support.
- iOS project support.
- Shared frontend and backend architecture.

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
| Argon2id              | Password hashing                  |
| Google OpenID Connect | Authentication                    |
| PDF                   | Digital book format               |
| Capacitor 7           | Native mobile support             |

## Project Structure

```text
OpenShelf/
├── client/                 # Frontend application
├── server/                 # Express API and backend
│   └── db/                 # Database schema and migrations
├── public/                 # Public assets and PWA files
├── scripts/                # Project scripts
├── android/                # Android application
├── ios/                    # iOS application
├── storage/                # Private uploaded PDF files
├── dist/                   # Production build output
├── app.js                  # Application entry
├── auth.js                 # Authentication
├── index.html              # HTML entry point
├── drizzle.config.js       # Drizzle configuration
├── vite.config.js          # Vite configuration
├── capacitor.config.json   # Capacitor configuration
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

Configure your database connection and administrator credentials in `.env`.

Example:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/library

ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your-secure-password

STORAGE_DIR=./storage
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
| Books            | `/books`, `/books/:id`                                      |
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

Uploaded PDF files are stored in a private storage directory configured through `STORAGE_DIR`.

**Important:** Keep uploaded files outside publicly accessible directories. Back up the PostgreSQL database and file storage together.

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

## Mobile Development

OpenShelf includes Capacitor support for Android and iOS.

Configure the mobile API URL using `.env.mobile` based on `.env.mobile.example`.

Synchronize the native projects:

```bash
npm run mobile:sync
```

Open the Android project:

```bash
npm run mobile:android
```

Open the iOS project:

```bash
npm run mobile:ios
```

Android builds require Android Studio and the Android SDK. iOS builds require macOS and Xcode.

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

**Implemented:** Core authentication, book catalog, PDF contributions, download credits, online reading, bookmarks, recommendations, ratings, notifications, administration, dark theme, partial Pashto localization, and mobile project support.

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
