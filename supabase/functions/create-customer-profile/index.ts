import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

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
    console.log('🔵 Creating customer profile');
    const { customerInfo, debug } = await req.json() as { customerInfo: CustomerInfo; debug?: boolean };

    const apiLoginId = Deno.env.get('AUTHORIZE_NET_API_LOGIN_ID');
    const transactionKey = Deno.env.get('AUTHORIZE_NET_TRANSACTION_KEY');

    if (!apiLoginId || !transactionKey) {
      throw new Error('Authorize.Net credentials not configured');
    }

    // Create Authorize.Net CIM request
    const cimRequest = {
      createCustomerProfileRequest: {
        merchantAuthentication: {
          name: apiLoginId,
          transactionKey: transactionKey
        },
        profile: {
          merchantCustomerId: `cust_${Date.now()}`,
          description: `${customerInfo.firstName} ${customerInfo.lastName}`,
          email: customerInfo.email,
          paymentProfiles: []
        }
      }
    };

    console.log('📤 Sending request to Authorize.Net CIM API');
    const authNetResponse = await fetch('https://apitest.authorize.net/xml/v1/request.api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cimRequest)
    });

    const responseData = await authNetResponse.json();
    console.log('📥 Authorize.Net response:', JSON.stringify(responseData, null, 2));

    if (responseData.messages?.resultCode !== 'Ok') {
      const errorMessage = responseData.messages?.message?.[0]?.text || 'Unknown error';
      throw new Error(`Authorize.Net error: ${errorMessage}`);
    }

    const customerProfileId = responseData.customerProfileId;
    console.log('✅ Customer profile created:', customerProfileId);

    // Store in Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      const { error: dbError } = await supabase
        .from('customer_profiles')
        .insert({
          email: customerInfo.email,
          first_name: customerInfo.firstName,
          last_name: customerInfo.lastName,
          phone: customerInfo.phone,
          address: customerInfo.address,
          city: customerInfo.city,
          state: customerInfo.state,
          zip_code: customerInfo.zipCode,
          country: customerInfo.country,
          authorize_net_customer_profile_id: customerProfileId,
          last_used_at: new Date().toISOString()
        });

      if (dbError) {
        console.error('❌ Error storing customer profile in DB:', dbError);
        // Continue anyway - the profile exists in Authorize.Net
      } else {
        console.log('✅ Customer profile stored in database');
      }
    }

    return new Response(JSON.stringify({
      success: true,
      customerProfileId,
      debug: debug ? {
        request: cimRequest,
        response: responseData
      } : undefined
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error creating customer profile:', error);
    return new Response(JSON.stringify({
      success: false,
      error: (error as Error).message || 'Failed to create customer profile'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
