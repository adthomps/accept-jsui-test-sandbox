import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
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
    const {
      customerProfileId,
      pageType = 'manage',
      paymentProfileId,
      shippingAddressId,
      returnUrl,
      cancelUrl,
      debug = false,
    } = await req.json();

    if (!customerProfileId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Customer Profile ID is required',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate required fields based on page type
    if (pageType === 'editPayment' && !paymentProfileId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Payment Profile ID is required for editPayment page type',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (pageType === 'editShipping' && !shippingAddressId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Shipping Address ID is required for editShipping page type',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Getting hosted profile token for:', {
      customerProfileId,
      pageType,
      paymentProfileId,
      shippingAddressId,
    });

    // Get Authorize.Net credentials from environment
    const apiLoginId = Deno.env.get('AUTHORIZE_NET_API_LOGIN_ID');
    const transactionKey = Deno.env.get('AUTHORIZE_NET_TRANSACTION_KEY');

    if (!apiLoginId || !transactionKey) {
      throw new Error('Authorize.Net credentials not configured');
    }

    // Generate a unique reference ID
    const referenceId = `ref_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Build return URL with reference ID
    const finalReturnUrl = returnUrl
      ? `${returnUrl}${returnUrl.includes('?') ? '&' : '?'}referenceId=${referenceId}`
      : undefined;

    const finalCancelUrl = cancelUrl
      ? `${cancelUrl}${cancelUrl.includes('?') ? '&' : '?'}cancelled=true&referenceId=${referenceId}`
      : undefined;

    // Build the hosted profile settings
    const hostedProfileSettings: any[] = [];

    if (finalReturnUrl) {
      hostedProfileSettings.push({
        setting: {
          settingName: 'hostedProfileReturnUrl',
          settingValue: finalReturnUrl,
        },
      });
    }

    if (finalCancelUrl) {
      hostedProfileSettings.push({
        setting: {
          settingName: 'hostedProfileReturnUrlText',
          settingValue: 'Continue',
        },
      });
      hostedProfileSettings.push({
        setting: {
          settingName: 'hostedProfilePageBorderVisible',
          settingValue: 'true',
        },
      });
    }

    // Add validation mode
    hostedProfileSettings.push({
      setting: {
        settingName: 'hostedProfileValidationMode',
        settingValue: 'testMode',
      },
    });

    // Build the base token request
    const tokenRequest: any = {
      getHostedProfilePageRequest: {
        merchantAuthentication: {
          name: apiLoginId,
          transactionKey: transactionKey,
        },
        customerProfileId: customerProfileId,
        hostedProfileSettings: hostedProfileSettings,
      },
    };

    // Add payment profile ID for editPayment
    if (pageType === 'editPayment' && paymentProfileId) {
      tokenRequest.getHostedProfilePageRequest.customerPaymentProfileId = paymentProfileId;
    }

    // Add shipping address ID for editShipping
    if (pageType === 'editShipping' && shippingAddressId) {
      tokenRequest.getHostedProfilePageRequest.customerShippingAddressId = shippingAddressId;
    }

    console.log('Sending token request to Authorize.Net API');

    // Call Authorize.Net API
    const apiUrl = 'https://apitest.authorize.net/xml/v1/request.api';
    const apiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tokenRequest),
    });

    const responseData = await apiResponse.json();
    console.log('Authorize.Net API response received');

    // Check if the request was successful
    if (responseData.messages?.resultCode === 'Ok' && responseData.token) {
      // Map page types to gateway URLs
      const gatewayUrlMap: Record<string, string> = {
        manage: 'https://test.authorize.net/customer/manage',
        addPayment: 'https://test.authorize.net/customer/addPayment',
        editPayment: 'https://test.authorize.net/customer/editPayment',
        addShipping: 'https://test.authorize.net/customer/addShipping',
        editShipping: 'https://test.authorize.net/customer/editShipping',
      };

      const gatewayUrl = gatewayUrlMap[pageType] || gatewayUrlMap.manage;

      console.log('Token generated successfully:', {
        pageType,
        gatewayUrl,
        referenceId,
      });

      return new Response(
        JSON.stringify({
          success: true,
          token: responseData.token,
          gatewayUrl: gatewayUrl,
          referenceId: referenceId,
          pageType: pageType,
          debug: debug ? { request: tokenRequest, response: responseData } : undefined,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      const errorMessage =
        responseData.messages?.message?.[0]?.text || 'Failed to generate token';
      console.error('API Error:', errorMessage);

      return new Response(
        JSON.stringify({
          success: false,
          error: errorMessage,
          debug: debug ? { request: tokenRequest, response: responseData } : undefined,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error: any) {
    console.error('Error generating hosted profile token:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to generate token',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
