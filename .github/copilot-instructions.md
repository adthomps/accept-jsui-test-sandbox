Project: Accept JSUI Test Sandbox — Copilot Instructions

Purpose
- Short, actionable guidance for AI coding assistants to be productive in this repository.

Big-picture architecture
- Frontend: Vite + React + TypeScript app under `src/`. UI built with shadcn-style components in `src/components/ui/`.
- Payment UI: `src/components/AcceptUIForm.tsx` (AcceptUI v3 lightbox) and `src/components/AcceptHostedForm.tsx` (hosted/iframe/redirect flows).
- Backend/edge: Supabase Edge Functions under `supabase/functions/` (e.g. `get-auth-config`, `accept-hosted-token`, `process-payment`) — these run on Deno and read secrets from env (Deno.env).
- Public assets: `public/iFrameCommunicator.html` used for cross-origin iframe messaging for hosted forms.
- Alias: `@` resolves to `./src` per `vite.config.ts`.

Important workflows & commands
- Setup: `npm i` (already run in workspace).
- Dev: `npm run dev` — Vite serve (host set to `::`, port `8080` in `vite.config.ts`).
- Build: `npm run build` and `npm run preview` to preview production build.
- Lint: `npm run lint` (ESLint).

Project-specific patterns and conventions (do not change without checking context)
- Payment token flow: frontend requests a token via Supabase functions and then posts the token to Authorize.Net using a hidden form targeting `https://test.authorize.net/payment/payment` (see `AcceptHostedForm.tsx` and lightbox/iframe form logic).
- AcceptUI v3 lightbox usage: script is injected dynamically and a global handler `acceptUIResponseHandler` is created on `window` (see `AcceptUIForm.tsx`). Tools must preserve this global handler contract.
- Debug mode: many components expose `debugMode` toggles — when enabled they show sanitized request/response payloads. Preserve debug gates and do not auto-disable them during changes.
- iFrame communication: hosted flows use `postMessage` between the hosted form and `public/iFrameCommunicator.html`. See message handling in `AcceptHostedForm.tsx` (`handleIframeMessage`).
- Edge functions: return JSON shapes `{ success: boolean, token?, error?, debug? }`. UI relies on `data.success` checks. Inspect `supabase/functions/get-auth-config/index.ts` for env usage pattern.
- Secrets: Supabase functions read secrets using `Deno.env.get(...)`. Never hardcode API keys; prefer environment variables.

Where to look for examples
- `src/components/AcceptUIForm.tsx` — dynamic AcceptUI script load, global response handler, hidden inputs `dataValue`/`dataDescriptor`.
- `src/components/AcceptHostedForm.tsx` — token generation flow, display modes (`redirect`, `lightbox`, `iframe`), and debug panels showing `authorizeNetRequest` / `authorizeNetResponse`.
- `supabase/functions/get-auth-config/index.ts` — canonical edge function example (CORS handling + Deno env access).
- `public/iFrameCommunicator.html` — used by iframe flows (open this file to see messaging format if working on iframe integrations).

Integration notes for implementers
- Use the `supabase.functions.invoke(...)` pattern from the frontend to call edge functions — responses may be a `data, error` tuple (check how the code handles `error` and `data`).
- When adding or changing edge functions, match their JSON contract (success/error/debug) so UI components can render appropriate debug information.
- When modifying AcceptUI or Hosted flows, keep the hidden form POST pattern intact (token posted to `https://test.authorize.net/payment/payment`).
- Keep `debugMode` toggles and debug panels intact for easier troubleshooting; they are relied on by maintainers.

Quick editing checklist for PRs
- Run `npm i` then `npm run dev` and verify the relevant page in the browser (localhost:8080).
- If you change Supabase functions, update their CORS headers and ensure they still read secrets from env vars.
- Preserve or update the UI debug panels when changing request/response shapes.
- Add unit or integration tests only when the change adds new business logic — front-end UI tweaks can omit tests but document behavior in the PR.

Privacy & security
- Do not commit API keys, client keys, or any secrets. Edge functions use `Deno.env.get(...)` — set secrets in the deployment environment.

If something is unclear
- Ask which display mode to test (`redirect`, `lightbox`, or `iframe`) — each path has slightly different DOM/form behaviors.
- When in doubt about token lifetimes or Authorize.Net sandbox vs production URLs, inspect `supabase/functions/*` and `get-auth-config` for environment URLs.

Contact for iteration
- After edits, request feedback and point to the changed files: `src/components/AcceptUIForm.tsx`, `src/components/AcceptHostedForm.tsx`, and any `supabase/functions/*` you modified.

End.
