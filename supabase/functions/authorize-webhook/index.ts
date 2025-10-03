import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-anet-signature',
};

async function verifyWebhookSignature(payload: string, signature: string, signatureKey: string): Promise<boolean> {
  try {
    // Remove the "sha512=" prefix if present
    const cleanSignature = signature.replace(/^sha512=/, '').toUpperCase();
    
    // Create HMAC-SHA512 hash using Web Crypto API
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(signatureKey),
      { name: 'HMAC', hash: 'SHA-512' },
      false,
      ['sign']
    );
    
    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(payload)
    );
    
    const computedHash = Array.from(new Uint8Array(signatureBuffer))
      .map((b: number) => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
    
    console.log('Webhook signature verification:', {
      received: cleanSignature,
      computed: computedHash,
      match: cleanSignature === computedHash
    });
    
    return cleanSignature === computedHash;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
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
    const payload = await req.text();
    const signature = req.headers.get('X-ANET-Signature');
    const signatureKey = Deno.env.get('AUTHORIZE_NET_SIGNATURE_KEY');

    console.log('🔵 Received webhook:', {
      hasSignature: !!signature,
      hasSignatureKey: !!signatureKey,
      payloadLength: payload.length,
    });

    // Verify webhook signature if signature key is configured
    if (signatureKey && signature) {
      const isValid = await verifyWebhookSignature(payload, signature, signatureKey);
      if (!isValid) {
        console.error('❌ Webhook signature verification failed');
        return new Response(JSON.stringify({ error: 'Invalid signature' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      console.log('✅ Webhook signature verified');
    } else {
      console.warn('⚠️ Webhook signature verification skipped - missing signature or key');
    }

    // Parse webhook payload
    let webhookData;
    try {
      webhookData = JSON.parse(payload);
    } catch (parseError) {
      console.error('Failed to parse webhook JSON:', parseError);
      return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('📦 Webhook data:', JSON.stringify(webhookData, null, 2));

    // Store webhook event in database for audit trail
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (supabaseUrl && supabaseServiceKey) {
      try {
        const webhookEventData = {
          event_id: webhookData.eventId,
          event_type: webhookData.eventType,
          notification_id: webhookData.notificationId,
          payload: webhookData,
          processed: false
        };
        
        const storeResponse = await fetch(`${supabaseUrl}/rest/v1/webhook_events`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify(webhookEventData)
        });
        
        if (storeResponse.ok) {
          console.log('✅ Webhook event stored in database');
        } else {
          console.error('❌ Error storing webhook event:', storeResponse.status, await storeResponse.text());
        }
      } catch (error) {
        console.error('❌ Error storing webhook event:', error);
      }
    }

    // Process different webhook event types
    const eventType = webhookData.eventType;
    const notificationId = webhookData.notificationId;

    switch (eventType) {
      case 'net.authorize.payment.authcapture.created':
        console.log('💳 Payment captured:', webhookData.payload);
        // Transaction details from webhook
        if (webhookData.payload && supabaseUrl && supabaseServiceKey) {
          const payload = webhookData.payload;
          try {
            // Update transaction status in database
            const updateResponse = await fetch(
              `${supabaseUrl}/rest/v1/payment_transactions?transaction_id=eq.${payload.id}`,
              {
                method: 'PATCH',
                headers: {
                  'Authorization': `Bearer ${supabaseServiceKey}`,
                  'apikey': supabaseServiceKey,
                  'Content-Type': 'application/json',
                  'Prefer': 'return=minimal'
                },
                body: JSON.stringify({
                  status: 'approved',
                  raw_response: payload
                })
              }
            );
            
            if (updateResponse.ok) {
              console.log('✅ Transaction updated in database');
            } else {
              console.error('❌ Error updating transaction:', updateResponse.status);
            }
          } catch (error) {
            console.error('❌ Error processing payment captured webhook:', error);
          }
        }
        break;
        
      case 'net.authorize.payment.authorization.created':
        console.log('🔐 Payment authorized:', webhookData.payload);
        // Store authorization for later capture
        break;
        
      case 'net.authorize.payment.void.created':
        console.log('🚫 Payment voided:', webhookData.payload);
        // Update transaction status to voided
        if (webhookData.payload && supabaseUrl && supabaseServiceKey) {
          const payload = webhookData.payload;
          try {
            await fetch(
              `${supabaseUrl}/rest/v1/payment_transactions?transaction_id=eq.${payload.id}`,
              {
                method: 'PATCH',
                headers: {
                  'Authorization': `Bearer ${supabaseServiceKey}`,
                  'apikey': supabaseServiceKey,
                  'Content-Type': 'application/json',
                  'Prefer': 'return=minimal'
                },
                body: JSON.stringify({ status: 'voided', raw_response: payload })
              }
            );
          } catch (error) {
            console.error('❌ Error processing void webhook:', error);
          }
        }
        break;
        
      case 'net.authorize.payment.refund.created':
        console.log('💸 Refund created:', webhookData.payload);
        // Record refund
        if (webhookData.payload && supabaseUrl && supabaseServiceKey) {
          const payload = webhookData.payload;
          try {
            await fetch(
              `${supabaseUrl}/rest/v1/payment_transactions?transaction_id=eq.${payload.id}`,
              {
                method: 'PATCH',
                headers: {
                  'Authorization': `Bearer ${supabaseServiceKey}`,
                  'apikey': supabaseServiceKey,
                  'Content-Type': 'application/json',
                  'Prefer': 'return=minimal'
                },
                body: JSON.stringify({ status: 'refunded', raw_response: payload })
              }
            );
          } catch (error) {
            console.error('❌ Error processing refund webhook:', error);
          }
        }
        break;
        
      case 'net.authorize.customer.created':
        console.log('👤 Customer profile created:', webhookData.payload);
        // Customer profile created in CIM
        break;
        
      case 'net.authorize.customer.paymentProfile.created':
        console.log('💳 Payment profile created:', webhookData.payload);
        // Payment method saved for customer
        break;
        
      default:
        console.log('❓ Unknown event type:', eventType);
        break;
    }
    
    // Mark webhook as processed
    if (supabaseUrl && supabaseServiceKey && webhookData.eventId) {
      try {
        await fetch(
          `${supabaseUrl}/rest/v1/webhook_events?event_id=eq.${webhookData.eventId}`,
          {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'apikey': supabaseServiceKey,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
              processed: true,
              processed_at: new Date().toISOString()
            })
          }
        );
      } catch (error) {
        console.error('❌ Error marking webhook as processed:', error);
      }
    }

    // Acknowledge receipt of webhook
    return new Response(JSON.stringify({
      success: true,
      notificationId: notificationId,
      eventType: eventType,
      processed: true,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: (error as Error)?.message || 'Internal server error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});