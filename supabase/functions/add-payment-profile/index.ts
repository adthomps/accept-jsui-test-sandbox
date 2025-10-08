import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
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
    console.log('🔵 Generating token to add payment profile');
    const { customerProfileId, returnUrl, cancelUrl, debug } = await req.json();

    const apiLoginId = Deno.env.get('AUTHORIZE_NET_API_LOGIN_ID');
    const transactionKey = Deno.env.get('AUTHORIZE_NET_TRANSACTION_KEY');

    if (!apiLoginId || !transactionKey) {
      throw new Error('Authorize.Net credentials not configured');
    }

    // Generate reference ID
    const referenceId = `${Date.now().toString().slice(-10)}${Math.random().toString(36).substring(2, 8)}`;
    console.log('🎫 Generated reference ID:', referenceId);

    // Build returnUrl with refId, but keep cancelUrl clean (lesson from Accept Hosted)
    const returnUrlWithRef = `${returnUrl || window.location.href}?refId=${referenceId}`;
    const cancelUrlClean = cancelUrl || window.location.href;

    // Create hosted profile page request
    const tokenRequest = {
      getHostedProfilePageRequest: {
        merchantAuthentication: {
          name: apiLoginId,
          transactionKey: transactionKey
        },
        customerProfileId: customerProfileId,
        hostedProfileSettings: {
          setting: [
            {
              settingName: "hostedProfileReturnOptions",
              settingValue: JSON.stringify({
                showReceipt: false,
                url: returnUrlWithRef,
                urlText: "Continue",
                cancelUrl: cancelUrlClean,
                cancelUrlText: "Cancel"
              })
            },
            {
              settingName: "hostedProfilePageBorderVisible",
              settingValue: "true"
            },
            {
              settingName: "hostedProfileManageOptions",
              settingValue: JSON.stringify({
                showPayment: true,
                showShipping: false
              })
            }
          ]
        }
      }
    };

    console.log('📤 Sending request to Authorize.Net');
    if (debug) {
      console.log('📤 Request:', JSON.stringify({
        ...tokenRequest,
        getHostedProfilePageRequest: {
          ...tokenRequest.getHostedProfilePageRequest,
          merchantAuthentication: {
            name: '[REDACTED]',
            transactionKey: '[REDACTED]'
          }
        }
      }, null, 2));
    }

    const authNetResponse = await fetch('https://apitest.authorize.net/xml/v1/request.api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tokenRequest)
    });

    const responseData = await authNetResponse.json();
    console.log('📥 Authorize.Net response:', JSON.stringify(responseData, null, 2));

    if (responseData.messages?.resultCode !== 'Ok') {
      const errorMessage = responseData.messages?.message?.[0]?.text || 'Unknown error';
      throw new Error(`Authorize.Net error: ${errorMessage}`);
    }

    const token = responseData.token;
    console.log('✅ Token generated successfully');

    return new Response(JSON.stringify({
      success: true,
      token,
      gatewayUrl: 'https://test.authorize.net/payment/payment',
      debug: debug ? {
        request: {
          ...tokenRequest,
          getHostedProfilePageRequest: {
            ...tokenRequest.getHostedProfilePageRequest,
            merchantAuthentication: {
              name: '[REDACTED]',
              transactionKey: '[REDACTED]'
            }
          }
        },
        response: responseData
      } : undefined
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error generating token:', error);
    return new Response(JSON.stringify({
      success: false,
      error: (error as Error).message || 'Failed to generate token'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
