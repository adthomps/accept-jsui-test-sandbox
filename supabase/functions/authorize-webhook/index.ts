import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createHash, createHmac } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-anet-signature',
};

function verifyWebhookSignature(payload: string, signature: string, signatureKey: string): boolean {
  try {
    // Remove the "sha512=" prefix if present
    const cleanSignature = signature.replace(/^sha512=/, '').toUpperCase();
    
    // Create HMAC-SHA512 hash
    const hmac = createHmac("sha512", new TextEncoder().encode(signatureKey));
    hmac.update(new TextEncoder().encode(payload));
    const computedHash = Array.from(hmac.digest())
      .map(b => b.toString(16).padStart(2, '0'))
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

    console.log('Received webhook:', {
      hasSignature: !!signature,
      hasSignatureKey: !!signatureKey,
      payloadLength: payload.length,
    });

    // Verify webhook signature if signature key is configured
    if (signatureKey && signature) {
      if (!verifyWebhookSignature(payload, signature, signatureKey)) {
        console.error('Webhook signature verification failed');
        return new Response(JSON.stringify({ error: 'Invalid signature' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else {
      console.warn('Webhook signature verification skipped - missing signature or key');
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

    console.log('Webhook data:', JSON.stringify(webhookData, null, 2));

    // Process different webhook event types
    const eventType = webhookData.eventType;
    const notificationId = webhookData.notificationId;

    switch (eventType) {
      case 'net.authorize.payment.authcapture.created':
        console.log('Payment captured:', webhookData.payload);
        // Here you would typically:
        // 1. Update your database with the payment status
        // 2. Send confirmation emails
        // 3. Update order status
        // 4. Trigger fulfillment processes
        break;
        
      case 'net.authorize.payment.authorization.created':
        console.log('Payment authorized:', webhookData.payload);
        // Handle authorization-only transactions
        break;
        
      case 'net.authorize.payment.capture.created':
        console.log('Payment capture created:', webhookData.payload);
        // Handle capture of previously authorized payment
        break;
        
      case 'net.authorize.payment.void.created':
        console.log('Payment voided:', webhookData.payload);
        // Handle voided transactions
        break;
        
      case 'net.authorize.payment.refund.created':
        console.log('Refund created:', webhookData.payload);
        // Handle refund transactions
        break;
        
      case 'net.authorize.payment.priorAuthCapture.created':
        console.log('Prior auth capture created:', webhookData.payload);
        // Handle prior authorization captures
        break;
        
      default:
        console.log('Unknown event type:', eventType);
        break;
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
      error: error.message || 'Internal server error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});