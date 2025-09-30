-- Create payment_transactions table to store all payment results
CREATE TABLE public.payment_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Transaction identifiers
  transaction_id TEXT NOT NULL,
  response_code TEXT,
  auth_code TEXT,
  
  -- Payment details
  amount DECIMAL(10,2),
  payment_method TEXT,
  account_number TEXT,
  account_type TEXT,
  
  -- Customer info
  customer_profile_id TEXT,
  customer_payment_profile_id TEXT,
  customer_email TEXT,
  
  -- Status and metadata
  status TEXT NOT NULL CHECK (status IN ('approved', 'declined', 'error', 'cancelled')),
  raw_response JSONB,
  
  -- Indexes for common queries
  UNIQUE(transaction_id)
);

-- Enable RLS
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view their own transactions
CREATE POLICY "Users can view their own transactions"
ON public.payment_transactions
FOR SELECT
TO authenticated
USING (customer_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Allow service role to manage all transactions (for edge functions)
CREATE POLICY "Service role can manage all transactions"
ON public.payment_transactions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Deny direct client access for insert/update/delete
CREATE POLICY "Deny client mutations on transactions"
ON public.payment_transactions
FOR INSERT
TO authenticated, anon
WITH CHECK (false);

CREATE POLICY "Deny client updates on transactions"
ON public.payment_transactions
FOR UPDATE
TO authenticated, anon
USING (false);

CREATE POLICY "Deny client deletes on transactions"
ON public.payment_transactions
FOR DELETE
TO authenticated, anon
USING (false);

-- Create trigger for updated_at
CREATE TRIGGER update_payment_transactions_updated_at
BEFORE UPDATE ON public.payment_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_payment_transactions_customer_email ON public.payment_transactions(customer_email);
CREATE INDEX idx_payment_transactions_status ON public.payment_transactions(status);
CREATE INDEX idx_payment_transactions_created_at ON public.payment_transactions(created_at DESC);