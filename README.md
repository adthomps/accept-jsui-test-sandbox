# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/7a50c4c4-c33a-4265-a391-f5034b56cc58

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/7a50c4c4-c33a-4265-a391-f5034b56cc58) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/7a50c4c4-c33a-4265-a391-f5034b56cc58) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## Local development notes

- Authorize.Net hosted pages require `hostedPaymentReturnOptions.url` (and related URL settings) to be absolute `http://` or `https://` URLs. Local `http://localhost` URLs can be rejected by the gateway and may produce errors like `E00013 Invalid Setting Value`.
- For local testing this project rewrites `localhost` return/cancel origins to `https://www.authorize.net` when generating hosted tokens. This is a development convenience only — production integrations must use your real, secure callback URLs.
- Alternative for full end-to-end testing: expose your local frontend via an HTTPS tunnel (for example `ngrok`) and use that public HTTPS URL as your `returnUrl`/`cancelUrl`.
- To run the Workers locally you can provide Authorize.Net keys in `workers/.dev.vars` (copy `workers/.dev.vars.example`), then run `cd workers && npm run dev`.
