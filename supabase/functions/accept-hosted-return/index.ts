import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

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
          'Location': `/payment-result?status=cancelled`,
          ...corsHeaders
        }
      });
    }

    // Extract return parameters from Authorize.Net
    const transactionId = url.searchParams.get('transId');
    const responseCode = url.searchParams.get('responseCode');
    const responseReasonCode = url.searchParams.get('messageCode');
    const responseReasonText = url.searchParams.get('description');
    const authCode = url.searchParams.get('authCode');
    const amount = url.searchParams.get('amount');
    const accountNumber = url.searchParams.get('accountNumber');
    const accountType = url.searchParams.get('accountType');
    const customerProfileId = url.searchParams.get('customerProfileId');
    const customerPaymentProfileId = url.searchParams.get('customerPaymentProfileId');

    console.log('Accept Hosted Return Parameters:', {
      transactionId,
      responseCode,
      responseReasonCode,
      responseReasonText,
      authCode,
      amount,
      accountNumber,
      accountType,
      customerProfileId,
      customerPaymentProfileId
    });

    // Determine payment status
    let status = 'error';
    if (responseCode === '1') {
      status = 'approved';
    } else if (responseCode === '2') {
      status = 'declined';
    } else if (responseCode === '3') {
      status = 'error';
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = supabaseUrl && supabaseServiceKey
      ? createClient(supabaseUrl, supabaseServiceKey)
      : null;

    // Store transaction in database
    if (supabase && transactionId) {
      try {
        const { error: insertError } = await supabase
          .from('payment_transactions')
          .insert({
            transaction_id: transactionId,
            response_code: responseCode,
            auth_code: authCode,
            amount: amount ? parseFloat(amount) : null,
            payment_method: accountType,
            account_number: accountNumber,
            account_type: accountType,
            customer_profile_id: customerProfileId,
            customer_payment_profile_id: customerPaymentProfileId,
            customer_email: url.searchParams.get('email'),
            status: status,
            raw_response: {
              responseCode,
              responseReasonCode,
              responseReasonText,
              authCode,
              transactionId,
              accountNumber,
              accountType,
              customerProfileId,
              customerPaymentProfileId
            }
          });

        if (insertError) {
          console.error('Error storing transaction:', insertError);
        } else {
          console.log('Transaction stored successfully:', transactionId);
        }
      } catch (error) {
        console.error('Error storing transaction:', error);
      }
    }
    
    // Update customer profile if payment was successful
    if (status === 'approved' && customerProfileId && supabase) {
      try {
        const customerEmail = url.searchParams.get('email');
        
        const updateData: any = {
          authorize_net_customer_profile_id: customerProfileId,
          last_used_at: new Date().toISOString(),
        };

        const { error: updateError } = await supabase
          .from('customer_profiles')
          .update(updateData)
          .eq('email', customerEmail || '');

        if (updateError) {
          console.error('Error updating customer profile:', updateError);
        } else {
          console.log('Updated customer profile successfully');
        }
      } catch (error) {
        console.error('Error updating customer profile:', error);
      }
    }

    // Construct return parameters
    const returnParams = new URLSearchParams({
      status: status,
      transactionId: transactionId || '',
      responseCode: responseCode || '',
      authCode: authCode || '',
      amount: amount || '',
      accountNumber: accountNumber || '',
      accountType: accountType || '',
      customerProfileId: customerProfileId || '',
      customerPaymentProfileId: customerPaymentProfileId || '',
      responseText: responseReasonText || ''
    });

    // Redirect back to frontend payment result page
    return new Response(null, {
      status: 302,
      headers: {
        'Location': `/payment-result?${returnParams.toString()}`,
        ...corsHeaders
      }
    });

  } catch (error) {
    console.error('Accept Hosted return handler error:', error);
    
    // Redirect to frontend with error status
    return new Response(null, {
      status: 302,
      headers: {
        'Location': `/payment-result?status=error`,
        ...corsHeaders
      }
    });
  }
});