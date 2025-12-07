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
    console.log('🔵 Charging customer profile');
    const { customerProfileId, customerPaymentProfileId, amount, debug } = await req.json();

    const apiLoginId = Deno.env.get('AUTHORIZE_NET_API_LOGIN_ID');
    const transactionKey = Deno.env.get('AUTHORIZE_NET_TRANSACTION_KEY');

    if (!apiLoginId || !transactionKey) {
      throw new Error('Authorize.Net credentials not configured');
    }

    // Build profile object - include payment profile ID if provided
    const profileData: { customerProfileId: string; paymentProfile?: { paymentProfileId: string } } = {
      customerProfileId: customerProfileId
    };

    if (customerPaymentProfileId) {
      profileData.paymentProfile = {
        paymentProfileId: customerPaymentProfileId
      };
      console.log('📝 Using specific payment profile:', customerPaymentProfileId);
    } else {
      console.log('📝 No payment profile specified, will use default/first payment profile');
    }

    // Create transaction request
    const transactionRequest = {
      createTransactionRequest: {
        merchantAuthentication: {
          name: apiLoginId,
          transactionKey: transactionKey
        },
        refId: `ref_${Date.now()}`,
        transactionRequest: {
          transactionType: "authCaptureTransaction",
          amount: amount.toString(),
          profile: profileData
        }
      }
    };

    console.log('📤 Sending transaction request to Authorize.Net');
    const authNetResponse = await fetch('https://apitest.authorize.net/xml/v1/request.api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transactionRequest)
    });

    const responseData = await authNetResponse.json();
    console.log('📥 Authorize.Net response:', JSON.stringify(responseData, null, 2));

    if (responseData.messages?.resultCode !== 'Ok') {
      const errorMessage = responseData.messages?.message?.[0]?.text || 'Unknown error';
      throw new Error(`Authorize.Net error: ${errorMessage}`);
    }

    const transactionResponse = responseData.transactionResponse;
    
    if (transactionResponse?.responseCode !== '1') {
      const errorMessage = transactionResponse?.errors?.[0]?.errorText || 'Transaction declined';
      throw new Error(errorMessage);
    }

    const transactionId = transactionResponse.transId;
    console.log('✅ Transaction successful:', transactionId);

    return new Response(JSON.stringify({
      success: true,
      transactionId,
      authCode: transactionResponse.authCode,
      accountNumber: transactionResponse.accountNumber,
      accountType: transactionResponse.accountType,
      debug: debug ? {
        request: {
          ...transactionRequest,
          createTransactionRequest: {
            ...transactionRequest.createTransactionRequest,
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
    console.error('❌ Error charging customer profile:', error);
    return new Response(JSON.stringify({
      success: false,
      error: (error as Error).message || 'Failed to charge customer profile'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
