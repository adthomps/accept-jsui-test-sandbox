import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const clientKey = Deno.env.get('AUTHORIZE_NET_CLIENT_KEY');
    const apiLoginId = Deno.env.get('AUTHORIZE_NET_API_LOGIN_ID');

    if (!clientKey || !apiLoginId) {
      throw new Error('Authorize.Net configuration not found');
    }

    // Determine environment URLs (using test for now, can be configured later)
    const environment = {
      apiUrl: 'https://apitest.authorize.net',
      jsUrl: 'https://jstest.authorize.net',
      gatewayUrl: 'https://test.authorize.net'
    };

    return new Response(JSON.stringify({
      clientKey,
      apiLoginId,
      environment,
      success: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in get-auth-config function:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: (error as Error)?.message || 'Internal server error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});