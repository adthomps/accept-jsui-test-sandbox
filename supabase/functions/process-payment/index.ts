import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentData {
  opaqueData: {
    dataDescriptor: string;
    dataValue: string;
  };
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
    const { opaqueData, customerInfo }: PaymentData = await req.json();

    const apiLoginId = Deno.env.get('AUTHORIZE_NET_API_LOGIN_ID');
    const transactionKey = Deno.env.get('AUTHORIZE_NET_TRANSACTION_KEY');

    if (!apiLoginId || !transactionKey) {
      throw new Error('Authorize.Net credentials not configured');
    }

    // Create transaction request
    const transactionRequest = {
      createTransactionRequest: {
        merchantAuthentication: {
          name: apiLoginId,
          transactionKey: transactionKey,
        },
        refId: `ref_${Date.now()}`,
        transactionRequest: {
          transactionType: "authCaptureTransaction",
          amount: customerInfo.amount.toString(),
          payment: {
            opaqueData: {
              dataDescriptor: opaqueData.dataDescriptor,
              dataValue: opaqueData.dataValue,
            },
          },
          billTo: {
            firstName: customerInfo.firstName,
            lastName: customerInfo.lastName,
            address: customerInfo.address,
            city: customerInfo.city,
            state: customerInfo.state,
            zip: customerInfo.zipCode,
            country: customerInfo.country,
          },
          customer: {
            email: customerInfo.email,
          },
        },
      },
    };

    // Send request to Authorize.Net
    const response = await fetch('https://apitest.authorize.net/xml/v1/request.api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transactionRequest),
    });

    const result = await response.json();

    console.log('Authorize.Net Response:', JSON.stringify(result, null, 2));

    if (result.createTransactionResponse?.messages?.resultCode === 'Ok') {
      const transaction = result.createTransactionResponse.transactionResponse;
      
      return new Response(JSON.stringify({
        success: true,
        transactionId: transaction.transId,
        authCode: transaction.authCode,
        responseCode: transaction.responseCode,
        messageCode: transaction.messages?.[0]?.code,
        description: transaction.messages?.[0]?.description,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      const errorMessage = result.createTransactionResponse?.transactionResponse?.errors?.[0]?.errorText || 
                          result.createTransactionResponse?.messages?.message?.[0]?.text ||
                          'Transaction failed';
      
      return new Response(JSON.stringify({
        success: false,
        error: errorMessage,
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Payment processing error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});