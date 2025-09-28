import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    
    // Check if this is a cancellation
    const cancelled = url.searchParams.get('cancelled');
    if (cancelled === 'true') {
      // Redirect to frontend with cancellation status
      return new Response(null, {
        status: 302,
        headers: {
          'Location': `${url.origin}/?payment=cancelled`,
          ...corsHeaders
        }
      });
    }

    // Extract return parameters from Authorize.Net
    const transId = url.searchParams.get('transId');
    const responseCode = url.searchParams.get('responseCode');
    const messageCode = url.searchParams.get('messageCode');
    const description = url.searchParams.get('description');
    const authCode = url.searchParams.get('authCode');
    const avsResponse = url.searchParams.get('avsResponse');
    const cvvResponse = url.searchParams.get('cvvResponse');
    const amount = url.searchParams.get('amount');
    const accountNumber = url.searchParams.get('accountNumber');
    const accountType = url.searchParams.get('accountType');
    const customerProfileId = url.searchParams.get('customerProfileId');
    const customerPaymentProfileId = url.searchParams.get('customerPaymentProfileId');

    console.log('Accept Hosted Return Parameters:', {
      transId,
      responseCode,
      messageCode,
      description,
      authCode,
      avsResponse,
      cvvResponse,
      amount,
      accountNumber,
      accountType,
      customerProfileId,
      customerPaymentProfileId
    });

    // Determine if payment was successful
    const isSuccess = responseCode === '1'; // 1 = Approved
    
    // Store customer profile information if provided
    if (isSuccess && customerProfileId && customerPaymentProfileId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      
      if (supabaseUrl && supabaseServiceKey) {
        try {
          // Update or create customer profile record
          const supabaseResponse = await fetch(`${supabaseUrl}/rest/v1/customer_profiles`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'apikey': supabaseServiceKey,
              'Content-Type': 'application/json',
              'Prefer': 'resolution=merge-duplicates'
            },
            body: JSON.stringify({
              authorize_net_customer_profile_id: customerProfileId,
              last_used_at: new Date().toISOString()
            })
          });
          
          if (supabaseResponse.ok) {
            console.log('Customer profile updated successfully');
          } else {
            console.warn('Failed to update customer profile:', await supabaseResponse.text());
          }
        } catch (error) {
          console.warn('Error updating customer profile:', error);
        }
      }
    }

    // Construct return URL with transaction details
    const returnParams = new URLSearchParams({
      payment: isSuccess ? 'success' : 'failed',
      ...(transId && { transactionId: transId }),
      ...(responseCode && { responseCode }),
      ...(messageCode && { messageCode }),
      ...(description && { description }),
      ...(authCode && { authCode }),
      ...(avsResponse && { avsResponse }),
      ...(cvvResponse && { cvvResponse }),
      ...(amount && { amount }),
      ...(accountNumber && { accountNumber }),
      ...(accountType && { accountType })
    });

    // Redirect back to frontend with results
    return new Response(null, {
      status: 302,
      headers: {
        'Location': `${url.origin}/?${returnParams.toString()}`,
        ...corsHeaders
      }
    });

  } catch (error) {
    console.error('Accept Hosted return handler error:', error);
    
    // Redirect to frontend with error status
    const url = new URL(req.url);
    return new Response(null, {
      status: 302,
      headers: {
        'Location': `${url.origin}/?payment=error`,
        ...corsHeaders
      }
    });
  }
});