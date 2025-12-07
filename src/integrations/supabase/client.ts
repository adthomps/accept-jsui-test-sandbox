// Supabase client stub — project has migrated backend to Cloudflare Workers.
// Frontend should call Worker endpoints via `src/lib/api.postJSON` or `API_BASE`.
// Keep a minimal object to avoid runtime import errors; any usage will throw with guidance.

type SupabaseStub = {
  from: (...args: any[]) => never;
  functions: {
    invoke: (...args: any[]) => Promise<never>;
  };
};

export const supabase: SupabaseStub = {
  from: () => {
    throw new Error('Supabase client removed. Use Worker API via src/lib/api.postJSON instead.');
  },
  functions: {
    invoke: async () => {
      throw new Error('Supabase Functions removed. Call Cloudflare Worker endpoints via src/lib/api.postJSON');
    },
  },
};