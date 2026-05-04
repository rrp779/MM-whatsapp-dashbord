# Database Migrations

This folder contains SQL migration files for your **Supabase** project. Each file defines schema changes (tables, policies, functions, etc.). Run them **in order** so your database matches what this app expects.

---

## When to run migrations

- **First setup**: Run migrations when you first connect this app to your Supabase project.
- **After an update**: When you get a new release, run `npm run migrate` again. Only migrations that have not been run yet will be applied.

---

## Method 1: `npm run migrate` (recommended)

You can run all pending migrations from your machine with a single command. No Supabase login and no manual SQL copy-paste.

### 1. Add your database URL to `.env`

In the project root, create or edit `.env` and set:

```env
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@[host]:[port]/postgres
```

**Where to get this:**

1. Open your [Supabase Dashboard](https://supabase.com/dashboard) and select your project.
2. Go to **Project Settings** → **Database**.
3. Under **Connection string**, choose **URI** and copy the connection string.
4. Replace the placeholder `[YOUR-PASSWORD]` with your database password (or use the **Transaction** or **Session** pooler URL if you use one).

**Important:** Use the **database connection string**, not the Supabase project URL or API keys. The service role key cannot run schema migrations; the app needs a direct Postgres connection to execute the migration SQL.

**Security:** Do not commit `.env` or share your `DATABASE_URL`. It is already listed in `.gitignore`.

### 2. Install dependencies and run migrations

From the project root:

```bash
npm install
npm run migrate
```

The script connects to your database, creates a `schema_migrations` table if needed, and runs each new migration file from `supabase/migrations/` in filename order. Migrations that have already been applied are skipped.

---

## Method 2: Supabase Dashboard (manual)

If you prefer not to use `DATABASE_URL` or the migration script:

1. Open your [Supabase Dashboard](https://supabase.com/dashboard) and select your project.
2. Go to **SQL Editor**.
3. For each migration file in this folder, **in order** (e.g. `001_initial_schema.sql`, then `002_…`, then `003_…`):
   - Open the `.sql` file.
   - Copy its full contents.
   - Paste into the SQL Editor and run it.
4. Repeat for every migration you have not run yet.

**Important:** Run migrations in numeric order. Do not skip or re-run a migration unless you know it is safe (e.g. it uses `IF NOT EXISTS` or similar).

---

## Method 3: Supabase CLI (optional)

If you use the Supabase CLI and want to apply migrations via the CLI:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

`supabase db push` applies migrations from `supabase/migrations/`. The CLI uses its own naming (e.g. timestamps). This repo uses numbered names (`001_…`, `002_…`) for the `npm run migrate` and manual flows. If you rely only on the CLI, you may need to align filenames with the CLI’s expected format.

---

## File naming and order

- Files are named like: `001_initial_schema.sql`, `002_add_feature_x.sql`, etc.
- The number is the order: the script and manual flow run `001` first, then `002`, and so on.
- Each migration should be written so it is safe to run once (e.g. `CREATE TABLE IF NOT EXISTS`, idempotent policies, or one-time changes documented in the file).

---

## Contents of migrations

These migrations only define **schema** and **policies** (tables, RLS, functions, etc.). They do **not** seed data. Any default or seed data is provided separately (e.g. JSON templates or other instructions).

---

## Troubleshooting

| Issue | What to do |
|-------|------------|
| “Missing DATABASE_URL” | Add `DATABASE_URL` to `.env` with your Supabase database connection string (Project Settings → Database → Connection string). |
| “Could not connect to the database” | Check that `DATABASE_URL` is correct, that the password is not placeholder, and that your IP or network is allowed if you use Supabase’s pooler/restrictions. |
| “Relation already exists” | That migration was probably run before. The script skips applied migrations; if you ran SQL manually, you can add the migration name to `schema_migrations` or re-run only missing migrations. |
| “Permission denied” | Ensure the user in the connection string has permission to create tables and run DDL (e.g. the `postgres` role or your project’s database user). |
| “Syntax error” | Check that the migration file is valid SQL and matches your Postgres/Supabase version. |

If something still fails, compare the error with the migration file and your current schema, or check Supabase’s [database docs](https://supabase.com/docs/guides/database).
