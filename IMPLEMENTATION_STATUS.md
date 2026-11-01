# Implementation status

Updated 2026-10-26. Checklist reflects the pasted full-scope requirements and the current source.

## Existing implementation
- [x] React/Vite frontend and Express API using JavaScript, PostgreSQL, and Drizzle.
- [x] Database schema, migrations, development seed, and environment-based setup documentation.
- [x] Registration/login/logout/current-user, Argon2id passwords, opaque hashed cookie sessions, CSRF request header, and role checks.
- [x] Public catalog with pagination, search, category/language filters, sorting, and book detail metadata.
- [x] PDF contributions with upload size/MIME/extension/signature checks, duplicate detection, pending moderation, and admin review.
- [x] Transactional distinct-book download allowance, credit ledger, repeat-download behavior, download history, and online PDF delivery.
- [x] User profile/preferences, favorites, reading list, contribution/download/reading history, and progress entry.
- [x] Responsive discovery, authentication, book details, profile, personal library, contribution form, and basic moderation dashboard.
- [x] Existing credit-policy unit tests.

## Remaining implementation checklist
- [x] Ratings/reviews endpoints with admin moderation queue.
- [x] Persisted notifications for moderation outcomes and user read/read-all APIs.
- [x] User-facing notifications panel and rating/review submission/display controls.
- [x] Recommendation scoring across shared subjects, category, reader activity, popularity, and recency, with explanations and cold-start results.
- [x] Collaborative recommendation signals from up to 20 readers with overlapping likes/downloads/reading activity.
- [ ] Reader bookmarks and resume/zoom/full-screen are implemented; PDF table of contents and parsing page-count metadata remain.
- [x] Admin book status/metadata updates and category create/update/list tools.
- [x] Admin user list, role/suspension management, and self-lockout protection.
- [x] Admin report status queue, audit log viewer, ratings moderation, and editable download-credit rules.
- [ ] Copyright complaint workflow and subject taxonomy management.
- [x] User-facing dashboard pages for saved lists and liked books.
- [x] Contribution-review notification preference in Profile, enforced when moderation notifications are created.
- [ ] Other account settings.
- [x] Unit coverage for credit-policy boundaries and recommendation ranking/exclusions/cold-start behavior.
- [ ] Integration/concurrency/security tests for auth, permissions, catalog, moderation, uploads, allowance, recommendation, progress, and file access.
- [ ] Production/deployment operations guidance and full UI translation coverage.

## Work completed in this continuation
- [x] Report endpoint verifies a valid published book before insertion.
- [x] Reading progress rejects pages beyond a supplied total page count.
- [x] Added recommendation scoring service and tests; book suggestions now include a displayed reason.
- [x] Added ratings/reviews persistence and APIs, pending-review moderation, and notifications with read state.
- [x] Added admin management APIs and UI for book status, categories, users, reports, ratings, audit events, and credit settings.
- [x] Added reader-facing rating/review and notifications interfaces.
- [x] Added dashboard views for saved books and favorites, plus reader zoom and full-screen controls.
- [x] Added per-user PDF page bookmarks and migration `0005_dazzling_caretaker.sql`.
- [x] Added collaborative recommendation scoring and a unit test for similar-reader behavior.
- [x] Serialized moderation decisions with a contribution-row lock and kept admin book publishing aligned with contribution credits, notifications, and audit events.
- [x] Fixed language switching so the selected Pashto locale updates before rerender; added Pashto strings for home, login, catalog, and dashboard controls.
- [x] Implemented dark-theme CSS and a header toggle that saves the preference for signed-in users.
- [x] Added Google OpenID Connect authorization-code sign-in, state/nonce cookies, JWKS-backed ID-token validation, account linking, and a login/register button. OAuth credentials are documented in `.env.example` and README.
- [x] Added OAuth account relationship table and migration `0006_neat_skin.sql`.
- [x] Added per-user contribution-review notification preference and migration `0007_stormy_magik.sql`.
- [x] Removed profile-photo display and upload controls/routes; existing stored account data was left intact.
- [x] Added Drizzle migrations `0003_loud_wong.sql` and `0004_low_joshua_kane.sql` for notification/rating tables and the pending-rating default.

## Verification and environment
- Last executed during this continuation: `npm test` passed (12/12); `npm run build` passed (Vite 6.4.5; bundle-size advisory); `node --check` passed for updated API/middleware; migration `0007` generated and applied to the temporary development database.
- Development web/API processes are running at `http://localhost:5173/` and port 3000. A temporary PostgreSQL 16 database on port 55432 has the migrations applied and development seed data loaded; the admin login endpoint returned HTTP 200.
- The `.env` and PostgreSQL cluster are development-only and stored in this workspace/`/tmp`; do not use the sample password outside this temporary environment. Google OAuth credentials are not configured yet, so Google sign-in remains inactive until `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set.
- Update this file after each implementation stage with actual test/build results. Do not mark the project complete while checklist items remain.
