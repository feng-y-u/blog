# AGENTS.md — 个人博客系统 (Personal Blog)

Lightweight blog: React 19 + Vite + TailwindCSS + Mantine/BlockNote (client), Express (CommonJS) + Prisma + SQLite (server). No TypeScript, no tests, no lint. Follow `coding.md`; do not add what it forbids.

## Warning: docs are stale
`CLAUDE.md`, `Project.md`, `Task.md` describe the original plan and claim "not started" — **all Phase 1–3 are implemented**. Trust code over docs. Current design specs live in `Docs/superpowers/specs/`, plans in `Docs/superpowers/plans/`. `Docs/前端设计/` contains only HTML prototypes (ignore the mojibake'd folder name).

## Setup (fresh clone)
There is no committed `.env` (gitignored) and no `.env.example`. Prisma requires `DATABASE_URL`; `JWT_SECRET` falls back to `dev-secret` in `server/src/config/index.js`. Create `server/.env` first:
```
DATABASE_URL="file:./dev.db"
JWT_SECRET=change-me
```
Then:
- `cd server && npm install && npx prisma migrate dev && npm run seed` — seed creates `admin`/`admin123`, 3 categories, 5 tags, site settings. `*.db` is gitignored, migrations are committed.
- `cd client && npm install && npm run dev` — Vite proxies `/api` and `/uploads` → `http://localhost:3001` (`client/vite.config.js`).
- Ports: server 3001 (`nodemon src/app.js`), client 5173. In production Express serves `client/dist`; CORS allowlist is `flowyu.xyz` domains.

## Server architecture
`Route → Controller → Service → Prisma` (services layer added in a later refactor; `coding.md` §3 omits it).
- `src/services/*-service.js` = all DB access + business logic (e.g. `uniqueSlug`, `reshapeTags`, comment HTML escaping).
- `src/controllers/*-controller.js` = thin HTTP adapters: parse `req`, call service, shape `res.json({ data, pagination })`; use `try/catch + next(err)`.
- `src/routes/*.js` = thin mounters only.
- Dual-router pattern where a resource needs public + admin views (follow existing code):
  - Notes: public `GET /api/notes/public`, admin `/api/notes` (auth).
  - Comments: public `/api/posts/:postId/comments`, admin `/api/comments`.
- `GET /api/posts` uses `optional-auth`: drafts visible only when a valid token is present; pass `user` from `req.user` into the service.
- **RSS `/api/feed` was deleted** — do not re-add. `settings`, `sitemap`, `robots.txt`, and `POST /api/upload` (auth, multipart field `image`) exist.

## Client notes
- Post editor is **BlockNote** (Mantine-styled), converting markdown ⇄ blocks (`PostEditor.jsx`) — not a textarea as docs describe.
- Styling is mostly **custom CSS**, not Tailwind classes: `main.jsx` imports `index.css` (Tailwind directives) plus `theme.css` (CSS vars `--bg`/`--fg`), `common.css`, `article.css`, `sidebar.css`, `search.css`, `admin.css`, `admin-new.css`. Admin pages deliberately use custom CSS, not Tailwind.
- Dark mode: `data-theme` attr on `<html>`, persisted as `blog-theme` in localStorage (`main.jsx`).
- Auth: JWT in localStorage key `token`; `api/client.js` interceptor attaches `Authorization: Bearer`, and 401 on `/admin` routes redirects to `/login`.
- All pages are lazy-loaded via `React.lazy` in `App.jsx`.

## Conventions
- Commit: `<type>(<scope>): 中文描述` — e.g. `feat(post): 添加文章 CRUD API`. Types `feat|fix|refactor|chore|docs|style`. Verified in git log. Single `main` branch.
- UI text in Chinese, code comments in English, commit messages in Chinese.
- Naming: server files kebab-case (`post-controller.js`); client components PascalCase, hooks `use*.js`, API helpers camelCase.
- File size caps (`coding.md` §1.3): server ≤200 lines, components ≤250, route files ≤50.
