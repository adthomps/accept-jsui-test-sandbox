# Migration Plan: Cloudflare Pages (frontend) + Workers (backend)

This document is a working plan to migrate the project from Supabase Edge Functions + Supabase DB to Cloudflare Pages + Workers using Hono, Cloudflare D1 and KV where appropriate. It includes step-by-step tasks, config snippets, example handlers, DB schema, frontend changes, local dev and deploy commands.

Summary / Goal
- Host the Vite + React frontend on Cloudflare Pages.
- Port Supabase Edge Functions (Deno) to Cloudflare Workers using Hono.
- Replace Supabase REST usage with D1 (relational) or external Postgres; use KV for short-lived tokens/locks.
- Preserve API contracts used by the UI: responses remain { success:boolean, token?, error?, debug? }.

Decision rationale
- Pages for frontend: built-in static site CI/CD, previews, and edge caching.
- Workers for backend: low-latency edge APIs, direct D1/KV bindings, secrets via Wrangler.

High-level task list (work through these sequentially)
1. Choose data store and provision resources
   - Create a Cloudflare D1 database (or choose an external Postgres).
   - Create a KV namespace for short-lived items (optional): `PENDING_KV`.
2. Scaffold Workers project
   - Create `workers/` directory with a Hono app.
   - Add `wrangler.toml` with D1 and KV bindings.
3. Port minimal functions first
   - Port `get-auth-config` and `process-payment` to Hono. Keep the same JSON responses.
   - Add CORS headers matching original functions.
4. Migrate DB schema
   - Add migrations SQL to `workers/migrations/` and run them with Wrangler or through the dashboard.
5. Update frontend API layer
   - Add `src/lib/api.ts` helper and replace `supabase.functions.invoke(...)` calls.
   - Optionally remove `src/integrations/supabase/client.ts` if not needed.
6. Local dev setup
   - Run `npm run dev` (frontend) and `wrangler dev` (workers) concurrently.
7. Test payment flows locally (debug mode set to true)
8. Deploy
   - Deploy Workers (`wrangler publish`) and Pages (Cloudflare Pages via GitHub integration or `wrangler pages publish`).
9. Add CI (optional)
   - Pages: native GitHub integration.
   - Workers: GitHub Action to run `wrangler publish` on main.

Files to create/edit
- `workers/wrangler.toml` (project root `workers/`)
- `workers/src/index.ts` (Hono app)
- `workers/migrations/001_init.sql` (D1 schema)
- `src/lib/api.ts` (frontend API helper)
- Edits in `src/components/*` to replace `supabase.functions.invoke` calls.

Example `wrangler.toml` (minimal)
```toml
name = "apt-acceptsuite-toolbox"
main = "./dist/index.js"
compatibility_date = "2025-12-07"
type = "javascript"

account_id = "<YOUR_ACCOUNT_ID>"
workers_dev = true

[[kv_namespaces]]
binding = "PENDING_KV"
id = "<KV_NAMESPACE_ID>"

[[d1_databases]]
binding = "DB"
database_name = "ACCEPT_D1"
```

Hono worker skeleton (port of `get-auth-config` and `process-payment`)
```ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

app.use('*', cors({ origin: '*' }));

app.get('/get-auth-config', async (c) => {
  const clientKey = c.env.AUTHORIZE_NET_CLIENT_KEY;
  const apiLoginId = c.env.AUTHORIZE_NET_API_LOGIN_ID;
  if (!clientKey || !apiLoginId) {
    return c.json({ success: false, error: 'Auth config missing' }, 500);
  }
  return c.json({ success: true, clientKey, apiLoginId, environment: { apiUrl: 'https://apitest.authorize.net', jsUrl: 'https://jstest.authorize.net', gatewayUrl: 'https://test.authorize.net' } });
});

app.post('/process-payment', async (c) => {
  const body = await c.req.json();
  // Validate body. Build Authorize.Net transaction payload like existing function.
  // Use c.env.AUTHORIZE_NET_API_LOGIN_ID and c.env.AUTHORIZE_NET_TRANSACTION_KEY
  // Optionally write/read pending payments using c.env.DB (D1) or PENDING_KV.
  return c.json({ success: false, error: 'Not implemented' }, 500);
});

export default app;
```

Porting notes
- Use `c.env.DB.prepare(query).bind(...).all()` to run D1 queries (see Wrangler docs).
- Keep CORS headers identical to current functions while testing; tighten to production origin later.
- Maintain `debug` flag behavior: include sanitized `debug` object in responses when requested.

D1 schema (place in `workers/migrations/001_init.sql`)
```sql
CREATE TABLE customer_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  authorize_net_customer_profile_id TEXT,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  country TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pending_payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference_id TEXT UNIQUE NOT NULL,
  customer_info JSON,
  amount REAL NOT NULL,
  create_profile BOOLEAN DEFAULT 0,
  status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

KV recommendations
- Use the KV namespace `PENDING_KV` for short-lived tokens/locks. Example keys:
  - `pending:${referenceId}` -> JSON (expires in 5 minutes)
  - `nonce:${opaqueDataHash}` -> small flags

Frontend changes (concrete)
1. Add `src/lib/api.ts`
```ts
const API_BASE = import.meta.env.VITE_API_BASE || '';
export async function postJSON(path: string, body: any) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    credentials: 'include'
  });
  return res.json();
}
```
2. Replace calls like:
```ts
// old
await supabase.functions.invoke('accept-hosted-token', { body: payload });

// new
await postJSON('/api/accept-hosted-token', payload);
```
3. Update `src/integrations/supabase/client.ts`
   - If the app uses no Supabase DB or auth client-side, remove this file and imports. If you keep Supabase DB, retain as-is.

Environment variables
- Worker secrets (use `wrangler secret put`):
  - `AUTHORIZE_NET_API_LOGIN_ID`
  - `AUTHORIZE_NET_TRANSACTION_KEY`
  - `AUTHORIZE_NET_CLIENT_KEY`
  - `DATABASE_URL` (if using external DB)
- Pages build env (if necessary):
  - `VITE_API_BASE` -> set to deployed API base URL (e.g., `https://api.example.com`)

Local development
- Install wrangler and login:
```bash
npm install -g wrangler
wrangler login
```
- Run frontend dev:
```bash
npm run dev
```
- Run worker locally (in `workers/`):
```bash
# inside workers
wrangler dev --local
```
- During dev set `VITE_API_BASE` to the worker dev URL (e.g. `http://127.0.0.1:8787`).

Deploy commands
- Publish worker:
```bash
# from workers/
wrangler publish --env production
```
- Publish Pages (recommended via GitHub integration). Or manually:
```bash
npm run build
npx wrangler pages publish dist --project-name apt-acceptsuite-toolbox
```

CI / GitHub Actions (brief)
- Pages: connect via Cloudflare Pages UI for automatic deployments on push.
- Workers: add a workflow step to call `wrangler publish` (use Cloudflare API token stored in GitHub secrets).

Testing & verification
- Use `debug` toggles in the UI to generate tokens without redirecting and inspect returned debug objects.
- Confirm tokens are POSTed to `https://test.authorize.net/payment/payment` in redirect/lightbox/iframe flows.

Security notes
- Do not commit secrets. Use `wrangler secret put` and Pages environment variables.
- Narrow CORS in production to the Pages domain.
- Strip or redact sensitive fields from debug logs in production.

Next actionable steps (pick one to start)
A. I can scaffold the `workers/` Hono project, add `wrangler.toml`, `package.json`, `workers/src/index.ts` with `get-auth-config` and a stub `process-payment`, plus `workers/migrations/001_init.sql`.
B. I can create `src/lib/api.ts` and update `AcceptHostedForm.tsx` and `AcceptUIForm.tsx` to use it (example replacements), and remove Supabase client usage.

Choose A or B and I will implement the files and push patches.

---
Generated on 2025-12-07 — iterate as you test and we can refine migration tasks.
