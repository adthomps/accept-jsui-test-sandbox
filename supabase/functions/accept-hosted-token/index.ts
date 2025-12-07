import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Display mode for Accept Hosted
type DisplayMode = 'redirect' | 'lightbox' | 'iframe';

// Full request with customer info (new customers)
interface NewCustomerRequest {
  customerInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    company?: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    amount: number;
  };
  returnUrl?: string;
  cancelUrl?: string;
  createProfile?: boolean;
  debug?: boolean;
  displayMode?: DisplayMode;
  iframeCommunicatorUrl?: string;
}

// Simplified request for returning customers (profile lookup)
interface ReturningCustomerRequest {
  existingCustomerEmail: string;
  amount: number;
  returnUrl?: string;
  cancelUrl?: string;
  addPaymentToProfile?: boolean; // Add new payment method to existing profile
  debug?: boolean;
  displayMode?: DisplayMode;
  iframeCommunicatorUrl?: string;
}

type HostedTokenRequest = NewCustomerRequest | ReturningCustomerRequest;

function isReturningCustomerRequest(req: HostedTokenRequest): req is ReturningCustomerRequest {
  return 'existingCustomerEmail' in req && !('customerInfo' in req);
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
    const isReturning = isReturningCustomerRequest(requestBody);
    const debug = Boolean(requestBody.debug);
    const displayMode: DisplayMode = requestBody.displayMode || 'redirect';
    const iframeCommunicatorUrl = requestBody.iframeCommunicatorUrl;
    
    console.log('🖥️ Display mode:', displayMode);
    
    console.log('📦 Request type:', isReturning ? 'RETURNING CUSTOMER' : 'NEW CUSTOMER');
    console.log('📦 Request payload:', JSON.stringify({
      ...requestBody,
      ...(isReturning ? { existingCustomerEmail: '[REDACTED]' } : {
        customerInfo: {
          ...(requestBody as NewCustomerRequest).customerInfo,
          email: '[REDACTED]'
        }
      })
    }, null, 2));

    const { returnUrl, cancelUrl } = requestBody;
    // For new customers: createProfile controls whether to save their info
    // For returning customers: addPaymentToProfile controls whether to add new payment methods
    const createProfile = isReturning 
      ? false  // Returning customers already have a profile
      : (requestBody as NewCustomerRequest).createProfile;
    const addPaymentToProfile = isReturning 
      ? (requestBody as ReturningCustomerRequest).addPaymentToProfile 
      : false;  // For new customers, we handle profile creation differently
    
    // Extract amount based on request type
    const amount = isReturning 
      ? (requestBody as ReturningCustomerRequest).amount 
      : (requestBody as NewCustomerRequest).customerInfo.amount;
    
    const apiLoginId = Deno.env.get('AUTHORIZE_NET_API_LOGIN_ID');
    const transactionKey = Deno.env.get('AUTHORIZE_NET_TRANSACTION_KEY');
    
    // Generate unique reference ID for this transaction (max 20 chars for Authorize.Net)
    const referenceId = `${Date.now().toString().slice(-10)}${Math.random().toString(36).substring(2, 8)}`;
    console.log('🎫 Generated reference ID:', referenceId);

    // Build URLs: Add refId to success URL but keep cancel URL clean (prevents Authorize.Net validation issues)
    const returnUrlWithRef = `${returnUrl || 'https://accept-jsui-test-sandbox.lovable.app/'}?refId=${referenceId}`;
    const cancelUrlClean = cancelUrl || 'https://accept-jsui-test-sandbox.lovable.app/';

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    let customerProfileId: string | null = null;
    let customerProfileData: any = null;
    
    // For returning customers, look up the profile first to get customer info
    if (isReturning) {
      const existingCustomerEmail = (requestBody as ReturningCustomerRequest).existingCustomerEmail;
      
      if (supabaseUrl && supabaseServiceKey) {
        try {
          console.log('🔵 Step 2: Looking up existing customer profile for:', existingCustomerEmail);
          const supabaseResponse = await fetch(`${supabaseUrl}/rest/v1/customer_profiles?email=eq.${encodeURIComponent(existingCustomerEmail)}&select=*`, {
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
              customerProfileData = profiles[0];
              console.log(`✅ Found existing customer profile: ${customerProfileId}`);
            } else {
              console.log('⚠️ No existing customer profile found');
              return new Response(JSON.stringify({
                success: false,
                error: 'No customer profile found for this email. Please register as a new customer.',
                details: { email: existingCustomerEmail }
              }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              });
            }
          }
        } catch (error) {
          console.warn('⚠️ Error looking up customer profile:', error);
          return new Response(JSON.stringify({
            success: false,
            error: 'Failed to look up customer profile',
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
      
      // Store pending payment for returning customer
      if (supabaseUrl && supabaseServiceKey && customerProfileData) {
        try {
          console.log('🔵 Step 3: Storing pending payment for returning customer');
          await fetch(`${supabaseUrl}/rest/v1/pending_payments`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'apikey': supabaseServiceKey,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
              reference_id: referenceId,
              customer_info: {
                email: customerProfileData.email,
                firstName: customerProfileData.first_name,
                lastName: customerProfileData.last_name,
                existingCustomerProfileId: customerProfileId
              },
              amount: amount,
              create_profile: true // Always add new payment methods for returning customers
            })
          });
          console.log('✅ Pending payment stored');
        } catch (error) {
          console.warn('⚠️ Error storing pending payment:', error);
        }
      }
    } else {
      // New customer flow
      const customerInfo = (requestBody as NewCustomerRequest).customerInfo;
      
      // If user wants to save their payment method, create a customer profile first
      // This is required because addPaymentProfile only works with existing customerProfileId
      if (createProfile && apiLoginId && transactionKey) {
        console.log('🔵 Step 2a: Creating customer profile for new customer (save payment method requested)');
        
        const createProfileRequest = {
          createCustomerProfileRequest: {
            merchantAuthentication: {
              name: apiLoginId,
              transactionKey: transactionKey
            },
            profile: {
              merchantCustomerId: `MC_${Date.now()}`,
              email: customerInfo.email,
              description: `${customerInfo.firstName} ${customerInfo.lastName}`
            },
            validationMode: 'none'
          }
        };
        
        try {
          const profileResponse = await fetch('https://apitest.authorize.net/xml/v1/request.api', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(createProfileRequest)
          });
          
          const profileResult = await profileResponse.json();
          console.log('📥 Create profile response:', JSON.stringify(profileResult, null, 2));
          
          // Handle the response - check both possible response structures
          const profileRoot = profileResult?.createCustomerProfileResponse ?? profileResult;
          
          if (profileRoot?.messages?.resultCode === 'Ok' && profileRoot?.customerProfileId) {
            customerProfileId = profileRoot.customerProfileId;
            console.log(`✅ Created new customer profile: ${customerProfileId}`);
            
            // Store the profile in our database
            if (supabaseUrl && supabaseServiceKey) {
              try {
                await fetch(`${supabaseUrl}/rest/v1/customer_profiles`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${supabaseServiceKey}`,
                    'apikey': supabaseServiceKey,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                  },
                  body: JSON.stringify({
                    email: customerInfo.email,
                    authorize_net_customer_profile_id: customerProfileId,
                    first_name: customerInfo.firstName,
                    last_name: customerInfo.lastName,
                    phone: customerInfo.phone,
                    address: customerInfo.address,
                    city: customerInfo.city,
                    state: customerInfo.state,
                    zip_code: customerInfo.zipCode,
                    country: customerInfo.country || 'US'
                  })
                });
                console.log('✅ Customer profile stored in database');
              } catch (dbError) {
                console.warn('⚠️ Error storing customer profile in database:', dbError);
              }
            }
          } else if (profileRoot?.messages?.message?.[0]?.code === 'E00039') {
            // Duplicate profile error - try to get the existing profile
            console.log('⚠️ Customer profile already exists, looking up existing profile...');
            
            // Extract the existing profile ID from the error message if available
            const existingProfileId = profileRoot?.customerProfileId;
            if (existingProfileId) {
              customerProfileId = existingProfileId;
              console.log(`✅ Using existing customer profile: ${customerProfileId}`);
            } else {
              // Try to get profile by email from our database
              if (supabaseUrl && supabaseServiceKey) {
                const lookupResponse = await fetch(
                  `${supabaseUrl}/rest/v1/customer_profiles?email=eq.${encodeURIComponent(customerInfo.email)}&select=authorize_net_customer_profile_id`,
                  {
                    headers: {
                      'Authorization': `Bearer ${supabaseServiceKey}`,
                      'apikey': supabaseServiceKey,
                      'Content-Type': 'application/json'
                    }
                  }
                );
                
                if (lookupResponse.ok) {
                  const profiles = await lookupResponse.json();
                  if (profiles && profiles.length > 0 && profiles[0].authorize_net_customer_profile_id) {
                    customerProfileId = profiles[0].authorize_net_customer_profile_id;
                    console.log(`✅ Found existing customer profile in database: ${customerProfileId}`);
                  }
                }
              }
            }
          } else {
            console.warn('⚠️ Failed to create customer profile:', profileRoot?.messages);
            // Continue without profile - payment will still work, just won't save card
          }
        } catch (profileError) {
          console.error('❌ Error creating customer profile:', profileError);
          // Continue without profile - payment will still work, just won't save card
        }
      }
      
      // Store customer data in pending_payments
      if (supabaseUrl && supabaseServiceKey) {
        try {
          console.log('🔵 Step 2b: Storing customer data in pending_payments');
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
              customer_info: {
                ...customerInfo,
                ...(customerProfileId ? { existingCustomerProfileId: customerProfileId } : {})
              },
              amount: customerInfo.amount,
              create_profile: createProfile || false
            })
          });
          
          if (storeResponse.ok) {
            console.log('✅ Customer data stored in pending_payments');
          } else {
            console.warn('⚠️ Error storing pending payment:', storeResponse.status, await storeResponse.text());
          }
        } catch (error) {
          console.warn('⚠️ Error storing pending payment:', error);
        }
      }
    }

    if (!apiLoginId || !transactionKey) {
      throw new Error('Authorize.Net credentials not configured');
    }

    // Build transactionRequest with correct element ordering per Authorize.Net XML schema:
    // transactionType, amount, profile (if exists), customer, billTo
    // The profile element MUST come before customer and billTo!
    const transactionRequest: any = {
      transactionType: "authCaptureTransaction",
      amount: amount.toString(),
    };
    
    // Add profile BEFORE customer/billTo if we have an existing customerProfileId
    // This displays the customer's saved payment methods on the hosted form
    if (customerProfileId) {
      transactionRequest.profile = {
        customerProfileId: customerProfileId
      };
      console.log('✅ Adding existing customer profile to transactionRequest:', customerProfileId);
      // For returning customers with a profile, we DON'T need customer/billTo
      // The hosted form will pull info from the profile
    } else {
      // For new customers, add customer and billTo info
      const customerInfo = (requestBody as NewCustomerRequest).customerInfo;
      transactionRequest.customer = {
        email: customerInfo.email,
      };
      transactionRequest.billTo = {
        firstName: customerInfo.firstName,
        lastName: customerInfo.lastName,
        company: customerInfo.company || '',
        address: customerInfo.address,
        city: customerInfo.city,
        state: customerInfo.state,
        zip: customerInfo.zipCode,
        country: customerInfo.country === 'US' ? 'USA' : customerInfo.country,
      };
    }
    
    // Create hosted payment page token request
    const tokenRequest: any = {
      getHostedPaymentPageRequest: {
        merchantAuthentication: {
          name: apiLoginId,
          transactionKey: transactionKey,
        },
        refId: referenceId,
        transactionRequest,
        hostedPaymentSettings: {
          setting: [
            {
              settingName: "hostedPaymentReturnOptions",
              settingValue: JSON.stringify({
                // For lightbox/iframe modes, we don't show the receipt since we handle it via postMessage
                showReceipt: displayMode === 'redirect',
                url: returnUrlWithRef,
                urlText: "Continue",
                cancelUrl: cancelUrlClean,
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
                cardCodeRequired: false,
                showCreditCard: true,
                showBankAccount: true
              })
            },
            {
              settingName: "hostedPaymentSecurityOptions",
              settingValue: JSON.stringify({
                captcha: false
              })
            },
            {
              settingName: "hostedPaymentShippingAddressOptions",
              settingValue: JSON.stringify({
                show: false,
                required: false
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
                showEmail: false,
                requiredEmail: false,
                // addPaymentProfile enables saving payment methods to the profile
                // This only works when customerProfileId is included in transactionRequest
                // For returning customers: adds new card to their existing profile
                // For new customers with createProfile=true: we created profile above, so add to it
                addPaymentProfile: !!customerProfileId
              })
            },
            {
              settingName: "hostedPaymentOrderOptions",
              settingValue: JSON.stringify({
                show: true,
                merchantName: "Demo Store, Inc."
              })
            },
            // Add iFrameCommunicator URL for lightbox and iframe modes
            // This enables cross-origin communication between your page and the hosted form
            ...(displayMode !== 'redirect' && iframeCommunicatorUrl ? [{
              settingName: "hostedPaymentIFrameCommunicatorUrl",
              settingValue: JSON.stringify({
                url: iframeCommunicatorUrl
              })
            }] : [])
          ]
        }
      },
    };

    // Note: For returning customers, the customerProfileId is already stored in pending_payments
    // during the profile lookup phase above. No need to update it again here.

    console.log('🔵 Step 4: Sending request to Authorize.Net API');
    
    // Log the full sanitized request for debugging
    const sanitizedRequest = {
      ...tokenRequest,
      getHostedPaymentPageRequest: {
        ...tokenRequest.getHostedPaymentPageRequest,
        merchantAuthentication: {
          name: '[REDACTED]',
          transactionKey: '[REDACTED]'
        }
      }
    };
    console.log('📤 Full Authorize.Net API Request (sanitized):', JSON.stringify(sanitizedRequest, null, 2));

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

    // Log the full response for debugging
    console.log('📥 Full Authorize.Net API Response:', JSON.stringify(result, null, 2));

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
        displayMode,
        // Return the appropriate gateway URL based on display mode
        gatewayUrl: displayMode === 'redirect' 
          ? 'https://test.authorize.net/payment/payment'
          : 'https://test.authorize.net/payment/payment',
        ...(debug ? { debug: { request: sanitizedRequest, response: root } } : {})
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
      ...(debug ? { debug: { request: sanitizedRequest, response: root } } : {})
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
      },
      ...(debug ? { debug: { request: 'unavailable', response: 'unavailable' } } : {})
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});