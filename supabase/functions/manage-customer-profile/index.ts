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
    console.log('🔵 Generating token to manage customer profile');
    const { customerProfileId, returnUrl, debug } = await req.json();

    const apiLoginId = Deno.env.get('AUTHORIZE_NET_API_LOGIN_ID');
    const transactionKey = Deno.env.get('AUTHORIZE_NET_TRANSACTION_KEY');

    if (!apiLoginId || !transactionKey) {
      throw new Error('Authorize.Net credentials not configured');
    }

    // Generate reference ID
    const referenceId = `${Date.now().toString().slice(-10)}${Math.random().toString(36).substring(2, 8)}`;
    console.log('🎫 Generated reference ID:', referenceId);

    // Build returnUrl with refId
    const returnUrlWithRef = `${returnUrl}?refId=${referenceId}`;

    // Create hosted profile page request for MANAGING profile
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
              settingName: "hostedProfileReturnUrl",
              settingValue: returnUrlWithRef
            },
            {
              settingName: "hostedProfileReturnUrlText",
              settingValue: "Continue"
            },
            {
              settingName: "hostedProfilePageBorderVisible",
              settingValue: "false"
            },
            {
              settingName: "hostedProfileValidationMode",
              settingValue: "testMode"
            },
            {
              settingName: "hostedProfileManageOptions",
              settingValue: "showPayment"
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
      gatewayUrl: 'https://test.authorize.net/customer/manage',
      referenceId,
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
