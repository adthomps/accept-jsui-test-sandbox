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

    const requestId = crypto.randomUUID();
    const tokenInfo = {
      descriptor: opaqueData?.dataDescriptor,
      valueLength: opaqueData?.dataValue?.length || 0,
    };
    console.log(`[${requestId}] Incoming payment`, JSON.stringify({
      amount: customerInfo?.amount,
      zip: customerInfo?.zipCode,
      descriptor: tokenInfo.descriptor,
      nonceLen: tokenInfo.valueLength,
    }, null, 2));

    const apiLoginId = Deno.env.get('AUTHORIZE_NET_API_LOGIN_ID');
    const transactionKey = Deno.env.get('AUTHORIZE_NET_TRANSACTION_KEY');

    if (!apiLoginId || !transactionKey) {
      console.error(`[${requestId}] Missing Authorize.Net credentials`);
      throw new Error('Authorize.Net credentials not configured');
    }

    // Create transaction request
    const refId = `ref_${Date.now()}`;
    const transactionRequest = {
      createTransactionRequest: {
        merchantAuthentication: {
          name: apiLoginId,
          transactionKey: transactionKey,
        },
        refId,
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
            email: customerInfo.email,
          },
        },
      },
    };

    // Send request to Authorize.Net (Sandbox)
    const endpoint = 'https://apitest.authorize.net/xml/v1/request.api';
    console.log(`[${requestId}] Sending to Authorize.Net`, JSON.stringify({
      endpoint,
      amount: customerInfo.amount,
      zip: customerInfo.zipCode,
      descriptor: opaqueData.dataDescriptor,
    }, null, 2));

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transactionRequest),
    });

    const text = await response.text();
    let result: any;
    try {
      result = JSON.parse(text);
    } catch (_err) {
      result = { parseError: true, raw: text };
    }

    console.log(`[${requestId}] Authorize.Net status ${response.status}`, JSON.stringify(result, null, 2));

    if (result.createTransactionResponse?.messages?.resultCode === 'Ok') {
      const transaction = result.createTransactionResponse.transactionResponse;
      
      return new Response(JSON.stringify({
        success: true,
        transactionId: transaction.transId,
        authCode: transaction.authCode,
        responseCode: transaction.responseCode,
        messageCode: transaction.messages?.[0]?.code,
        description: transaction.messages?.[0]?.description,
        httpStatus: response.status,
        requestId,
        refId,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Request-Id': requestId },
      });
    } else {
      const tx = result.createTransactionResponse?.transactionResponse || {};
      const createMsgs = result.createTransactionResponse?.messages?.message || [];
      const topMsgs = result.messages?.message || [];
      const pickMsg = (arr: any[]) => (Array.isArray(arr) && arr.length > 0 ? arr[0] : {});
      const txErr = Array.isArray(tx.errors) && tx.errors.length > 0 ? tx.errors[0] : undefined;
      const msgCreate = pickMsg(createMsgs);
      const msgTop = pickMsg(topMsgs);

      const errorMessage =
        txErr?.errorText ||
        msgCreate?.text ||
        msgTop?.text ||
        'Transaction failed';

      const errorCode =
        txErr?.errorCode ||
        msgCreate?.code ||
        msgTop?.code;

      console.log(`[${requestId}] Gateway failure`, JSON.stringify({
        resultCodeTop: result.messages?.resultCode,
        resultCodeCreate: result.createTransactionResponse?.messages?.resultCode,
        errorCode,
        errorMessage,
        txResponseCode: tx.responseCode,
        avs: tx.avsResultCode,
        cvv: tx.cvvResultCode,
      }, null, 2));

      return new Response(JSON.stringify({
        success: false,
        error: errorMessage,
        errorCode,
        resultCode: result.createTransactionResponse?.messages?.resultCode || result.messages?.resultCode,
        gateway: {
          responseCode: tx.responseCode,
          avsResultCode: tx.avsResultCode,
          cvvResultCode: tx.cvvResultCode,
          transId: tx.transId,
          errors: tx.errors,
          messages: createMsgs.length ? createMsgs : topMsgs,
        },
        requestId,
        refId,
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Request-Id': requestId },
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