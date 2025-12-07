# Naming conventions for apt-acceptsuite-toolbox

This file documents recommended names and key conventions to make Cloudflare
resources (Pages, Workers, D1, KV, secrets) easy to identify and connect.

Project prefix
- `apt_acceptsuite` — canonical project prefix used across resources.

Recommended resource names
- Pages project: `apt_acceptsuite_pages`
- Worker project (wrangler name): `apt_acceptsuite_worker` (wrangler.toml `name`)
- Worker entry file: `workers/src/index.js`

Bindings (wrangler)
- KV namespace (display name): `apt_acceptsuite_kv`
  - binding: `PENDING_KV`
  - id: fill with the Cloudflare KV id (paste into `workers/wrangler.toml`)
- D1 database (display name): `apt_acceptsuite_d1`
  - binding: `DB`
  - database_id: fill with Cloudflare D1 id (paste into `workers/wrangler.toml`)

Secrets / env vars (Workers)
- Prefix with `APT_ACCEPTSUITE_` for clarity, e.g.:
  - `APT_ACCEPTSUITE_AUTHORIZE_NET_API_LOGIN_ID`
  - `APT_ACCEPTSUITE_AUTHORIZE_NET_TRANSACTION_KEY`
  - `APT_ACCEPTSUITE_AUTHORIZE_NET_CLIENT_KEY`

KV key naming
- Use a project-scoped prefix to avoid collisions:
  - `apt_acceptsuite:pending:{referenceId}` — pending payment records
  - `apt_acceptsuite:nonce:{opaqueDataHash}` — one-time nonces

D1 tables (already used)
- `customer_profiles`
- `pending_payments`

Frontend / Pages env
- Use `VITE_API_BASE` to point Pages -> Worker API in preview/deploy.
  - Example: `VITE_API_BASE=https://apt-acceptsuite-toolbox-worker.pages.dev`

Commands (examples)
- Create KV namespace:
  ```bash
  wrangler kv:namespace create "apt-acceptsuite-toolbox_pending_kv"
  ```
- Create D1 database:
  ```bash
  wrangler d1 create apt_acceptsuite_d1
  ```

Deployment notes
- After creating KV/D1, copy the returned `id`/`database_id` into
  `workers/wrangler.toml` under the appropriate bindings.
- Use prefixed secret names when creating worker secrets:
  ```bash
  wrangler secret put APT_ACCEPTSUITE_AUTHORIZE_NET_API_LOGIN_ID
  ```

Reasoning
- Using a consistent `apt-acceptsuite` prefix makes it easy to find and
  group resources in Cloudflare dashboard and avoids collisions with other
  projects or environments.
