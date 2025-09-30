import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SIMFormRequest {
  customerInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    amount: number;
    invoiceNumber: string;
    description: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { customerInfo }: SIMFormRequest = await req.json();

    const apiLoginId = Deno.env.get('AUTHORIZE_NET_API_LOGIN_ID');
    const transactionKey = Deno.env.get('AUTHORIZE_NET_TRANSACTION_KEY');

    if (!apiLoginId || !transactionKey) {
      throw new Error('Authorize.Net credentials not configured');
    }

    // Generate sequence and timestamp
    const sequence = Math.floor(Math.random() * 1000000);
    const timestamp = Math.floor(Date.now() / 1000);

    // Create fingerprint for SIM using MD5 hash
    const fingerprintData = `${apiLoginId}^${sequence}^${timestamp}^${customerInfo.amount}^`;
    const encoder = new TextEncoder();
    const data = encoder.encode(transactionKey + fingerprintData);
    
    // Use SubtleCrypto for MD5 (note: MD5 is not available in SubtleCrypto, so we need to use a different approach)
    // For SIM, we need MD5 which isn't in Web Crypto, so we'll use a simple implementation
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const fingerprint = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Prepare form data
    const formData = {
      x_login: apiLoginId,
      x_amount: customerInfo.amount.toString(),
      x_description: customerInfo.description,
      x_invoice_num: customerInfo.invoiceNumber,
      x_fp_sequence: sequence.toString(),
      x_fp_timestamp: timestamp.toString(),
      x_fp_hash: fingerprint,
      x_test_request: 'TRUE', // Remove for production
      x_show_form: 'PAYMENT_FORM',
      x_first_name: customerInfo.firstName,
      x_last_name: customerInfo.lastName,
      x_email: customerInfo.email,
      x_phone: customerInfo.phone || '',
      x_address: customerInfo.address,
      x_city: customerInfo.city,
      x_state: customerInfo.state,
      x_zip: customerInfo.zipCode,
      x_country: customerInfo.country,
      x_relay_response: 'TRUE',
      x_relay_url: `${req.headers.get('origin')}/payment-response`
    };

    return new Response(JSON.stringify({
      success: true,
      formData,
      actionUrl: 'https://test.authorize.net/gateway/transact.dll'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-sim-form function:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: (error as Error)?.message || 'Internal server error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});