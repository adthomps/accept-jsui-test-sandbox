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

    const requestId = `req_${Date.now()}`;
    const processingStartTime = Date.now();

    console.log(`[${requestId}] Incoming payment`, {
      amount: customerInfo.amount,
      zip: customerInfo.zipCode,
      descriptor: opaqueData.dataDescriptor,
      nonceLen: opaqueData.dataValue?.length || 0
    });

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
    console.log(`[${requestId}] Sending to Authorize.Net`, {
      endpoint,
      amount: customerInfo.amount,
      zip: customerInfo.zipCode,
      descriptor: opaqueData.dataDescriptor
    });

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

    console.log(`[${requestId}] Authorize.Net status ${response.status}`, result);

    const processingEndTime = Date.now();
    const processingDuration = processingEndTime - processingStartTime;

    if (result.messages?.resultCode === 'Ok' && result.transactionResponse) {
      const transaction = result.transactionResponse;
      
      console.log(`[${requestId}] Gateway success`, {
        resultCode: result.messages.resultCode,
        transactionId: transaction.transId,
        responseCode: transaction.responseCode
      });
      
      return new Response(JSON.stringify({
        success: true,
        transactionId: transaction.transId,
        authCode: transaction.authCode,
        responseCode: transaction.responseCode,
        messageCode: transaction.messages?.[0]?.code,
        description: transaction.messages?.[0]?.description,
        avsResultCode: transaction.avsResultCode,
        cvvResultCode: transaction.cvvResultCode,
        accountNumber: transaction.accountNumber,
        accountType: transaction.accountType,
        requestId,
        processing: {
          startTime: processingStartTime,
          endTime: processingEndTime,
          duration: processingDuration,
          timestamp: new Date().toISOString()
        },
        rawResponse: {
          messages: result.messages,
          transactionResponse: {
            ...transaction,
            transHash: '[REDACTED]',
            transHashSha2: '[REDACTED]'
          }
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Request-Id': requestId },
      });
    } else {
      const tx = result.transactionResponse || {};
      const msgs = result.messages?.message || [];
      const pickMsg = (arr: any[]) => (Array.isArray(arr) && arr.length > 0 ? arr[0] : {});
      const txErr = Array.isArray(tx.errors) && tx.errors.length > 0 ? tx.errors[0] : undefined;
      const msg = pickMsg(msgs);

      const errorMessage =
        txErr?.errorText ||
        msg?.text ||
        'Transaction failed';

      const errorCode =
        txErr?.errorCode ||
        msg?.code;

      console.log(`[${requestId}] Gateway failure`, {
        resultCodeTop: result.messages?.resultCode,
        resultCodeCreate: result.messages?.resultCode,
        errorCode,
        errorMessage,
        txResponseCode: tx.responseCode,
        avs: tx.avsResultCode,
        cvv: tx.cvvResultCode,
      });

      return new Response(JSON.stringify({
        success: false,
        error: errorMessage,
        errorCode,
        resultCode: result.messages?.resultCode,
        responseCode: tx.responseCode,
        avsResultCode: tx.avsResultCode,
        cvvResultCode: tx.cvvResultCode,
        gateway: {
          responseCode: tx.responseCode,
          avsResultCode: tx.avsResultCode,
          cvvResultCode: tx.cvvResultCode,
          transId: tx.transId,
          errors: tx.errors || [],
          messages: msgs,
        },
        requestId,
        processing: {
          startTime: processingStartTime,
          endTime: processingEndTime,
          duration: processingDuration,
          timestamp: new Date().toISOString()
        },
        rawResponse: {
          messages: result.messages,
          transactionResponse: result.transactionResponse
        }
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Request-Id': requestId },
      });
    }

  } catch (error) {
    console.error('Payment processing error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: (error as Error)?.message || 'Internal server error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});