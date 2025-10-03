-- Create pending_payments table to store transaction context
CREATE TABLE IF NOT EXISTS public.pending_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_id text UNIQUE NOT NULL,
  customer_info jsonb NOT NULL,
  amount numeric NOT NULL,
  create_profile boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT now() + interval '30 minutes',
  used boolean DEFAULT false
);

-- Add indexes for quick lookups
CREATE INDEX IF NOT EXISTS idx_pending_payments_reference ON public.pending_payments(reference_id);
CREATE INDEX IF NOT EXISTS idx_pending_payments_expires ON public.pending_payments(expires_at) WHERE NOT used;

-- Enable RLS on pending_payments
ALTER TABLE public.pending_payments ENABLE ROW LEVEL SECURITY;

-- Deny all client access to pending_payments (backend only)
CREATE POLICY "Deny all client access to pending payments"
ON public.pending_payments
FOR ALL
TO public
USING (false)
WITH CHECK (false);

-- Create webhook_events table for audit trail
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text UNIQUE,
  event_type text NOT NULL,
  notification_id text,
  payload jsonb NOT NULL,
  processed boolean DEFAULT false,
  processed_at timestamptz,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Add indexes for webhook_events
CREATE INDEX IF NOT EXISTS idx_webhook_events_type ON public.webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON public.webhook_events(processed);

-- Enable RLS on webhook_events
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- Deny all client access to webhook_events (backend only)
CREATE POLICY "Deny all client access to webhook events"
ON public.webhook_events
FOR ALL
TO public
USING (false)
WITH CHECK (false);

-- Add unique constraint on customer_profiles email for upsert
CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_profiles_email ON public.customer_profiles(email);

-- Auto-cleanup function for expired pending payments
CREATE OR REPLACE FUNCTION public.cleanup_expired_pending_payments()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.pending_payments 
  WHERE expires_at < now() OR (used = true AND created_at < now() - interval '24 hours');
$$;