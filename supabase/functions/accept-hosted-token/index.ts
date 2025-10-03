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
  existingCustomerEmail?: string;
  createProfile?: boolean;
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
    console.log('🔵 Step 1: Received accept-hosted-token request');
    const requestBody: HostedTokenRequest = await req.json();
    console.log('📦 Request payload:', JSON.stringify({
      ...requestBody,
      customerInfo: {
        ...requestBody.customerInfo,
        email: requestBody.customerInfo.email ? '[REDACTED]' : undefined
      }
    }, null, 2));

    const { customerInfo, returnUrl, cancelUrl, existingCustomerEmail, createProfile } = requestBody;

    // Generate unique reference ID for this transaction
    const referenceId = `ref_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    console.log('🎫 Generated reference ID:', referenceId);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    // Store customer data in pending_payments
    if (supabaseUrl && supabaseServiceKey) {
      try {
        console.log('🔵 Step 2: Storing customer data in pending_payments');
        const storeResponse = await fetch(`${supabaseUrl}/rest/v1/pending_payments`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            reference_id: referenceId,
            customer_info: customerInfo,
            amount: customerInfo.amount,
            create_profile: createProfile || false
          })
        });
        
        if (storeResponse.ok) {
          console.log('✅ Customer data stored in pending_payments');
        } else {
          console.warn('⚠️ Error storing pending payment:', storeResponse.status, await storeResponse.text());
          // Continue anyway - not critical for payment flow
        }
      } catch (error) {
        console.warn('⚠️ Error storing pending payment:', error);
        // Continue anyway
      }
    }
    
    let customerProfileId: string | null = null;
    
    // Look up existing customer profile if email provided
    if (existingCustomerEmail && supabaseUrl && supabaseServiceKey) {
      try {
        console.log('🔵 Step 3: Looking up existing customer profile for:', existingCustomerEmail);
        const supabaseResponse = await fetch(`${supabaseUrl}/rest/v1/customer_profiles?email=eq.${encodeURIComponent(existingCustomerEmail)}&select=authorize_net_customer_profile_id`, {
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey,
            'Content-Type': 'application/json'
          }
        });
        
        if (supabaseResponse.ok) {
          const profiles = await supabaseResponse.json();
          if (profiles && profiles.length > 0 && profiles[0].authorize_net_customer_profile_id) {
            customerProfileId = profiles[0].authorize_net_customer_profile_id;
            console.log(`✅ Found existing customer profile: ${customerProfileId}`);
            // TODO: Validate profile exists in Authorize.Net CIM
          } else {
            console.log('⚠️ No existing customer profile found');
          }
        } else {
          console.warn('⚠️ Supabase profile lookup failed:', supabaseResponse.status, await supabaseResponse.text());
        }
      } catch (error) {
        console.warn('⚠️ Error looking up customer profile:', error);
        // Continue without profile ID
      }
    }

    const apiLoginId = Deno.env.get('AUTHORIZE_NET_API_LOGIN_ID');
    const transactionKey = Deno.env.get('AUTHORIZE_NET_TRANSACTION_KEY');

    if (!apiLoginId || !transactionKey) {
      throw new Error('Authorize.Net credentials not configured');
    }

    // Append reference ID to return URLs
    const returnUrlWithRef = `${returnUrl || 'https://accept-jsui-test-sandbox.lovable.app/'}${returnUrl?.includes('?') ? '&' : '?'}refId=${encodeURIComponent(referenceId)}`;
    const cancelUrlWithRef = `${cancelUrl || 'https://accept-jsui-test-sandbox.lovable.app/'}${cancelUrl?.includes('?') ? '&' : '?'}cancelled=true&refId=${encodeURIComponent(referenceId)}`;
    
    // Create hosted payment page token request
    const tokenRequest: any = {
      getHostedPaymentPageRequest: {
        merchantAuthentication: {
          name: apiLoginId,
          transactionKey: transactionKey,
        },
        refId: referenceId,
        transactionRequest: {
          transactionType: "authCaptureTransaction",
          amount: customerInfo.amount.toString(),
          customer: {
            email: customerInfo.email,
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
        },
        hostedPaymentSettings: {
          setting: [
            {
              settingName: "hostedPaymentReturnOptions",
              settingValue: JSON.stringify({
                showReceipt: true,
                url: returnUrlWithRef,
                urlText: "Continue",
                cancelUrl: cancelUrlWithRef,
                cancelUrlText: "Cancel"
              })
            },
            {
              settingName: "hostedPaymentButtonOptions",
              settingValue: JSON.stringify({
                text: "Complete Payment"
              })
            },
            {
              settingName: "hostedPaymentStyleOptions",
              settingValue: JSON.stringify({
                bgColor: "#3b82f6"
              })
            },
            {
              settingName: "hostedPaymentPaymentOptions",
              settingValue: JSON.stringify({
                showCreditCard: true,
                showBankAccount: true
              })
            },
            {
              settingName: "hostedPaymentBillingAddressOptions", 
              settingValue: JSON.stringify({
                show: true,
                required: false
              })
            },
            {
              settingName: "hostedPaymentCustomerOptions",
              settingValue: JSON.stringify({
                showEmail: true,
                requiredEmail: true,
                addPaymentProfile: createProfile || false
              })
            }
          ]
        }
      },
    };

    // Add customer profile ID if found
    if (customerProfileId) {
      tokenRequest.getHostedPaymentPageRequest.customerProfileId = customerProfileId;
    }

    console.log('🔵 Step 4: Sending request to Authorize.Net API');
    console.log('📤 API Request details:', {
      url: 'https://apitest.authorize.net/xml/v1/request.api',
      refId: referenceId,
      transactionType: tokenRequest.getHostedPaymentPageRequest.transactionRequest.transactionType,
      amount: tokenRequest.getHostedPaymentPageRequest.transactionRequest.amount,
      customerProfileId: customerProfileId || 'none',
      createProfile: createProfile || false
    });

    // Send request to Authorize.Net
    const response = await fetch('https://apitest.authorize.net/xml/v1/request.api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tokenRequest),
    });

    console.log('🔵 Step 5: Received response from Authorize.Net');
    const result = await response.json();

    // Normalize Authorize.Net response shape (some SDKs return nested under getHostedPaymentPageResponse, others return the object directly)
    const root = result?.getHostedPaymentPageResponse ?? result;
    console.log('📥 Authorize.Net response (normalized):', JSON.stringify({
      resultCode: root?.messages?.resultCode,
      messageCode: root?.messages?.message?.[0]?.code,
      messageText: root?.messages?.message?.[0]?.text,
      hasToken: !!root?.token,
      tokenLength: root?.token?.length || 0
    }, null, 2));

    const messages = root?.messages;

    // Treat explicit success with token as 200 OK
    if (messages?.resultCode === 'Ok' && typeof root?.token === 'string' && root.token.length > 0) {
      const token = root.token as string;

      console.log('✅ Step 6: Payment token generated successfully');
      console.log('📝 Token length:', token.length, 'characters');
      console.log('🎯 Client should POST this token to: https://test.authorize.net/payment/payment');

      return new Response(JSON.stringify({
        success: true,
        token,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build detailed error from messages, preferring non-informational codes
    let errorCode = 'UNKNOWN';
    let errorText = 'Failed to generate hosted payment token';

    if (messages?.message && Array.isArray(messages.message)) {
      const nonInfo = messages.message.find((m: any) => typeof m?.code === 'string' && !m.code.startsWith('I'));
      const first = nonInfo || messages.message[0];
      if (first) {
        errorCode = first.code ?? errorCode;
        errorText = first.text ?? errorText;
      }
    }

    // If the API reported Ok but no token was returned, surface a specific error
    if (messages?.resultCode === 'Ok' && (!root?.token || String(root.token).length === 0)) {
      errorCode = errorCode === 'UNKNOWN' ? 'NO_TOKEN' : errorCode;
      errorText = 'Authorize.Net returned success but no token was provided';
    }

    console.error('❌ Step 5: Authorize.Net API returned error');
    console.error('🚨 Error details:', {
      resultCode: messages?.resultCode,
      errorCode,
      errorText,
      hasToken: !!root?.token,
      tokenLength: root?.token?.length || 0
    });

    return new Response(JSON.stringify({
      success: false,
      error: `${errorText}${errorCode ? ` (Code: ${errorCode})` : ''}`,
      details: {
        resultCode: messages?.resultCode,
        errorCode,
        errorText,
      },
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Accept Hosted token generation error:', error);
    
    let errorMessage = 'Internal server error';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage,
      details: {
        type: 'server_error',
        timestamp: new Date().toISOString()
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});