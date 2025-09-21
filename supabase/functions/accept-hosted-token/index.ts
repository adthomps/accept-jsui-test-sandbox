import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HostedTokenRequest {
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
  };
  returnUrl?: string;
  cancelUrl?: string;
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
    const { customerInfo, returnUrl, cancelUrl }: HostedTokenRequest = await req.json();

    const apiLoginId = Deno.env.get('AUTHORIZE_NET_API_LOGIN_ID');
    const transactionKey = Deno.env.get('AUTHORIZE_NET_TRANSACTION_KEY');

    if (!apiLoginId || !transactionKey) {
      throw new Error('Authorize.Net credentials not configured');
    }

    // Create hosted payment page token request
    const tokenRequest = {
      getHostedPaymentPageRequest: {
        merchantAuthentication: {
          name: apiLoginId,
          transactionKey: transactionKey,
        },
        refId: `hosted_${Date.now()}`,
        transactionRequest: {
          transactionType: "authCaptureTransaction",
          amount: customerInfo.amount.toString(),
          billTo: {
            firstName: customerInfo.firstName,
            lastName: customerInfo.lastName,
            email: customerInfo.email,
            phoneNumber: customerInfo.phone || '',
            address: customerInfo.address,
            city: customerInfo.city,
            state: customerInfo.state,
            zip: customerInfo.zipCode,
            country: customerInfo.country,
          },
        },
        hostedPaymentSettings: {
          setting: [
            {
              settingName: "hostedPaymentReturnOptions",
              settingValue: JSON.stringify({
                showReceipt: true,
                url: returnUrl || window.location.origin,
                urlText: "Continue",
                cancelUrl: cancelUrl || window.location.origin,
                cancelUrlText: "Cancel"
              })
            },
            {
              settingName: "hostedPaymentButtonOptions",
              settingValue: JSON.stringify({
                text: "Pay"
              })
            },
            {
              settingName: "hostedPaymentStyleOptions",
              settingValue: JSON.stringify({
                bgColor: "blue"
              })
            }
          ]
        }
      },
    };

    // Send request to Authorize.Net
    const response = await fetch('https://apitest.authorize.net/xml/v1/request.api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tokenRequest),
    });

    const result = await response.json();

    console.log('Accept Hosted Token Response:', JSON.stringify(result, null, 2));

    if (result.getHostedPaymentPageResponse?.messages?.resultCode === 'Ok') {
      return new Response(JSON.stringify({
        success: true,
        token: result.getHostedPaymentPageResponse.token,
        // The hosted payment URL would be constructed like:
        // https://test.authorize.net/payment/payment (for sandbox)
        // https://accept.authorize.net/payment/payment (for production)
        hostedPaymentUrl: `https://test.authorize.net/payment/payment?token=${result.getHostedPaymentPageResponse.token}`,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      const errorMessage = result.getHostedPaymentPageResponse?.messages?.message?.[0]?.text ||
                          'Failed to generate hosted payment token';
      
      return new Response(JSON.stringify({
        success: false,
        error: errorMessage,
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Accept Hosted token generation error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});