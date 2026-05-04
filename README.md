# n8n WhatsApp (Vite + React)

Frontend UI for an n8n-powered WhatsApp workflow, with optional Supabase integration (realtime + database schema/migrations).

## Prerequisites (install these first)

- **Node.js (LTS)**: Download and install from `https://nodejs.org/en/download`
  - After installing, verify:

    ```bash
    node -v
    npm -v
    ```

- **Git (recommended)**: Install from `https://git-scm.com/downloads`

## Download the project

### Option A: Clone with Git

```bash
git clone <YOUR_REPO_URL>
cd n8n_whatsapp
```

### Option B: Download ZIP

- Download the project as a ZIP
- Extract it
- Open a terminal in the extracted folder (the folder that contains `package.json`)

## Install dependencies

From the project root:

```bash
npm install
```

## Configure the app (required)

This project uses a **single source of truth** for runtime config: `config.ts`.

Update these values in `config.ts` to match your environment:

- **API**
  - `CURRENT_ENVIRONMENT`: `'production' | 'uat'`
  - `API_BASE_URLS`: your n8n webhook base URLs (must end with `/api/v1/`)
  - `WEBHOOK_ID`: used in some endpoints (inserted into the path)
  - `USE_MOCK_DATA`:
    - Set to `true` to run the UI without a working backend API (uses mock responses).
    - Set to `false` to call your real backend API.

- **Supabase (optional but recommended)**
  - `SUPABASE_URL`: your Supabase project URL (e.g. `https://xxxx.supabase.co`)
  - `SUPABASE_PUBLISHABLE_KEY`: your Supabase **publishable/anon** key (safe to use in frontend; enforce access via RLS)

## (Optional) Set up Supabase database schema (migrations)

If you want your Supabase database schema to match what the app expects, run the migrations in `supabase/migrations/`.

### 1) Create `.env` with `DATABASE_URL`

Copy the example file and edit it:

```bash
cp .env.example .env
```

Then set `DATABASE_URL` in `.env`.

- Get it from **Supabase Dashboard → Project Settings → Database → Connection string (URI)**
- Do **not** commit `.env` (it is already in `.gitignore`)

### 2) Run migrations

```bash
npm run migrate
```

More details are in `scripts/MIGRATIONS_README.md`.

## Run locally (development)

Start the dev server:

```bash
npm run dev
```

Then open the URL Vite prints (typically `http://localhost:5173`).

## Production build / preview

Build:

```bash
npm run build
```

Preview the built app locally:

```bash
npm run preview
```

## Troubleshooting

- **Port already in use**: Vite will usually pick the next available port; check the terminal output for the actual URL.
- **Blank UI / API errors**:
  - Set `USE_MOCK_DATA = true` in `config.ts` to verify the UI works without the backend.
  - If using real APIs, confirm `API_BASE_URLS` and `WEBHOOK_ID` are correct.
- **Supabase not configured warning**: set `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` in `config.ts`.
- **Migrations failing**:
  - Confirm `.env` exists and contains `DATABASE_URL`
  - Ensure the connection string is a **Postgres URI** (not the Supabase project URL, and not an API key)
  - Re-check `scripts/MIGRATIONS_README.md` for the recommended workflow

## Scripts

- `npm run dev`: start Vite dev server
- `npm run build`: build for production
- `npm run preview`: preview the production build
- `npm run migrate`: apply Supabase migrations using `DATABASE_URL` from `.env`

# MM-whatsapp-dashbord
