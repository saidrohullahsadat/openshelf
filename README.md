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

OpenShelf is designed to provide an organized, accessible, and reader-focused experience across desktop and mobile browsers.

## Features

### 📚 Book Discovery & Catalog

- Browse a searchable and paginated book catalog.
- Filter books by category and language.
- Sort books using different criteria.
- View detailed book information, subjects, reading levels, and source attribution.
- Discover popular and recently added books.

### 📖 Reading Experience

- Read PDF books directly inside the web application.
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

| Rule | Allowance |
|---|---:|
| Initial free downloads | 3 books |
| Published contributions required | 3 |
| Additional download credits | 10 |
| Daily download limit | 10 events |

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

- Responsive desktop and mobile-browser layouts.
- Modern editorial-style interface.
- Dark theme.
- English and partial Pashto translations.
- Right-to-left support for Pashto and Dari/Persian book details.
- Progressive Web App (PWA) support.
- Offline-cached application shell.

---

## Technology Stack

| Technology | Purpose |
|---|---|
| React | Frontend interface |
| Vite | Development server and build tool |
| JavaScript | Application programming |
| CSS | Styling |
| Node.js | Backend runtime |
| Express.js | REST API |
| PostgreSQL | Relational database |
| Drizzle ORM | Database queries and schema |
| Neon serverless | Hosted PostgreSQL connection pool |
| Vercel Blob | Private original PDF storage |
| Google Gen AI | Gemini File Search and AI answers |
| Argon2id | Password hashing |
| Google OpenID Connect | Authentication |
| PDF | Digital book format |

