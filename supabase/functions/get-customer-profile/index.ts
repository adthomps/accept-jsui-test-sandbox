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
    const { customerProfileId, debug = false } = await req.json();

    if (!customerProfileId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Customer Profile ID is required',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching customer profile:', customerProfileId);

    // Get Authorize.Net credentials from environment
    const apiLoginId = Deno.env.get('AUTHORIZE_NET_API_LOGIN_ID');
    const transactionKey = Deno.env.get('AUTHORIZE_NET_TRANSACTION_KEY');

    if (!apiLoginId || !transactionKey) {
      throw new Error('Authorize.Net credentials not configured');
    }

    // Build the API request
    const apiRequest = {
      getCustomerProfileRequest: {
        merchantAuthentication: {
          name: apiLoginId,
          transactionKey: transactionKey,
        },
        customerProfileId: customerProfileId,
        unmaskExpirationDate: false,
        includeIssuerInfo: true,
      },
    };

    console.log('Sending request to Authorize.Net API');

    // Call Authorize.Net API
    const apiUrl = 'https://apitest.authorize.net/xml/v1/request.api';
    const apiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apiRequest),
    });

    const responseData = await apiResponse.json();
    console.log('Authorize.Net API response received');

    // Check if the request was successful
    if (responseData.messages?.resultCode === 'Ok' && responseData.profile) {
      const profile = responseData.profile;

      // Extract payment profiles
      const paymentProfiles = (profile.paymentProfiles || []).map((pp: any) => ({
        customerPaymentProfileId: pp.customerPaymentProfileId,
        cardNumber: pp.payment?.creditCard?.cardNumber || 'N/A',
        cardType: pp.payment?.creditCard?.cardType || 'Unknown',
        expirationDate: pp.payment?.creditCard?.expirationDate || 'XXXX',
        billTo: pp.billTo || null,
      }));

      // Extract shipping addresses
      const shippingAddresses = (profile.shipToList || []).map((address: any) => ({
        customerAddressId: address.customerAddressId,
        firstName: address.firstName,
        lastName: address.lastName,
        address: address.address,
        city: address.city,
        state: address.state,
        zip: address.zip,
        country: address.country,
        phoneNumber: address.phoneNumber,
      }));

      console.log('Profile fetched successfully:', {
        profileId: profile.customerProfileId,
        paymentProfilesCount: paymentProfiles.length,
        shippingAddressesCount: shippingAddresses.length,
      });

      return new Response(
        JSON.stringify({
          success: true,
          profile: {
            customerProfileId: profile.customerProfileId,
            merchantCustomerId: profile.merchantCustomerId,
            description: profile.description,
            email: profile.email,
            paymentProfiles: paymentProfiles,
            shippingAddresses: shippingAddresses,
          },
          debug: debug ? { request: apiRequest, response: responseData } : undefined,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      const errorMessage =
        responseData.messages?.message?.[0]?.text || 'Failed to fetch customer profile';
      console.error('API Error:', errorMessage);

      return new Response(
        JSON.stringify({
          success: false,
          error: errorMessage,
          debug: debug ? { request: apiRequest, response: responseData } : undefined,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error: any) {
    console.error('Error fetching customer profile:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to fetch customer profile',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
