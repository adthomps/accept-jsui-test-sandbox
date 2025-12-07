# Workers: apt-acceptsuite-toolbox

This folder contains the Cloudflare Workers (Hono) project intended to replace Supabase Edge Functions.

Quick start

1. Install dependencies (from repo root or inside this folder):

```bash
cd workers
npm install
```

2. Login to Cloudflare and configure wrangler:

```bash
wrangler login
```

3. Run dev server:

```bash
npm run dev
```

4. Add secrets:

```bash
wrangler secret put AUTHORIZE_NET_API_LOGIN_ID
wrangler secret put AUTHORIZE_NET_TRANSACTION_KEY
wrangler secret put AUTHORIZE_NET_CLIENT_KEY
```

Notes
- Edit `wrangler.toml` and replace placeholder IDs.
- The `process-payment` handler is a scaffold; port the full logic from `supabase/functions/process-payment/index.ts`.
