import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Shield, CreditCard, User, MapPin, ExternalLink, UserCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

const customerSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  address: z.string().min(1, 'Address is required').max(100),
  city: z.string().min(1, 'City is required').max(50),
  state: z.string().min(1, 'State is required').max(20),
  zipCode: z.string().min(1, 'ZIP code is required').max(10),
  country: z.string().default('US'),
  amount: z.number().min(0.01, 'Amount must be at least $0.01').max(99999.99)
});

interface CustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  amount: string;
}

interface AcceptHostedFormProps {
  onBack: () => void;
}

const AcceptHostedForm = ({ onBack }: AcceptHostedFormProps) => {
  const { toast } = useToast();
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '555-123-4567',
    address: '123 Main Street',
    city: 'Bellevue',
    state: 'WA',
    zipCode: '98004',
    country: 'US',
    amount: '29.99'
  });
  const [isReturningCustomer, setIsReturningCustomer] = useState(false);
  const [existingCustomerEmail, setExistingCustomerEmail] = useState('');
  const [createProfile, setCreateProfile] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  const handleCustomerInfoChange = (field: keyof CustomerInfo, value: string) => {
    setCustomerInfo(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    try {
      customerSchema.parse({
        ...customerInfo,
        amount: parseFloat(customerInfo.amount)
      });
      setValidationErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: { [key: string]: string } = {};
        error.issues.forEach(issue => {
          if (issue.path[0]) {
            errors[issue.path[0] as string] = issue.message;
          }
        });
        setValidationErrors(errors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please correct the errors in the form",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setProcessingStep('Validating payment details...');

    try {
      console.log('🔵 Step 1: Submitting hosted payment request...');
      
      const { data, error } = await supabase.functions.invoke('accept-hosted-token', {
        body: {
          customerInfo: {
            firstName: customerInfo.firstName,
            lastName: customerInfo.lastName,
            email: customerInfo.email,
            phone: customerInfo.phone,
            address: customerInfo.address,
            city: customerInfo.city,
            state: customerInfo.state,
            zipCode: customerInfo.zipCode,
            country: customerInfo.country,
            amount: parseFloat(customerInfo.amount)
          },
          existingCustomerEmail: isReturningCustomer ? existingCustomerEmail : undefined,
          createProfile: createProfile,
          returnUrl: 'https://accept-jsui-test-sandbox.lovable.app/',
          cancelUrl: 'https://accept-jsui-test-sandbox.lovable.app/'
        }
      });

      setProcessingStep('Generating secure payment token...');
      console.log('🔵 Step 2: Edge function response:', { data, error });

      if (error) {
        console.error('Supabase function invocation error:', error);
        throw new Error(`API Error: ${error.message}`);
      }

      if (!data) {
        throw new Error('No response data received from payment service');
      }

      if (data.success) {
        setProcessingStep('Token generated successfully!');
        console.log('✅ Step 3: Payment token generated successfully');
        console.log('🎫 Token:', data.token ? `${data.token.substring(0, 30)}...` : 'undefined');
        
        setProcessingStep('Redirecting to secure payment page...');
        toast({
          title: "Redirecting to Payment",
          description: "Opening Authorize.Net hosted payment page...",
        });
        
        console.log('🚀 Step 4: Creating form to POST token to Authorize.Net...');
        
        // Create a form to POST the token (Authorize.Net requires POST, not GET)
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = 'https://test.authorize.net/payment/payment';
        form.style.display = 'none';
        
        const tokenInput = document.createElement('input');
        tokenInput.type = 'hidden';
        tokenInput.name = 'token';
        tokenInput.value = data.token;
        
        form.appendChild(tokenInput);
        document.body.appendChild(form);
        
        console.log('📤 Step 5: Submitting form to Authorize.Net hosted payment page...');
        
        // Submit the form after a small delay to show processing state
        setTimeout(() => {
          form.submit();
        }, 1000);
      } else {
        console.error('Payment token generation failed:', data);
        toast({
          title: "Payment Token Generation Failed",
          description: data.error || "Failed to generate payment token. Please check your information and try again.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Accept Hosted token error:', error);
      
      let errorMessage = "Failed to initialize payment. Please try again.";
      
      // Enhanced error message handling
      if (error.message) {
        if (error.message.includes('Edge Function returned a non-2xx status code')) {
          errorMessage = "Payment service error. Please check the console for details and try again.";
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = "Network error. Please check your connection and try again.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Payment Initialization Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      // Don't reset processing state here - user is being redirected
      // setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/5 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Accept Hosted Payment
            </h1>
            <p className="text-muted-foreground">
              Secure hosted payment page with customer profile support
            </p>
          </div>
          <div className="ml-auto flex gap-2">
            <Badge variant="secondary" className="gap-2">
              <Shield className="h-4 w-4" />
              PCI SAQ A Compliant
            </Badge>
            <Badge variant="outline" className="gap-2">
              <ExternalLink className="h-4 w-4" />
              Hosted Payment
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Customer Information */}
          <Card className="shadow-card bg-gradient-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Customer Information
              </CardTitle>
              <CardDescription>
                Customer details for hosted payment processing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Customer Type Selection */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="returning-customer"
                    checked={isReturningCustomer}
                    onCheckedChange={setIsReturningCustomer}
                  />
                  <Label htmlFor="returning-customer" className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4" />
                    Returning Customer
                  </Label>
                </div>

                {isReturningCustomer && (
                  <div className="space-y-2">
                    <Label htmlFor="existingEmail">Existing Customer Email</Label>
                    <Input
                      id="existingEmail"
                      type="email"
                      placeholder="Enter your email to load saved payment methods"
                      value={existingCustomerEmail}
                      onChange={(e) => setExistingCustomerEmail(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      If you have saved payment methods, they will be available for selection
                    </p>
                  </div>
                )}
              </div>

              <Separator />

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={customerInfo.firstName}
                      onChange={(e) => handleCustomerInfoChange('firstName', e.target.value)}
                      className={validationErrors.firstName ? 'border-destructive' : ''}
                    />
                    {validationErrors.firstName && (
                      <p className="text-xs text-destructive">{validationErrors.firstName}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={customerInfo.lastName}
                      onChange={(e) => handleCustomerInfoChange('lastName', e.target.value)}
                      className={validationErrors.lastName ? 'border-destructive' : ''}
                    />
                    {validationErrors.lastName && (
                      <p className="text-xs text-destructive">{validationErrors.lastName}</p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email" 
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => handleCustomerInfoChange('email', e.target.value)}
                    className={validationErrors.email ? 'border-destructive' : ''}
                  />
                  {validationErrors.email && (
                    <p className="text-xs text-destructive">{validationErrors.email}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={customerInfo.phone}
                      onChange={(e) => handleCustomerInfoChange('phone', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount ($) *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={customerInfo.amount}
                      onChange={(e) => handleCustomerInfoChange('amount', e.target.value)}
                      className={validationErrors.amount ? 'border-destructive' : ''}
                    />
                    {validationErrors.amount && (
                      <p className="text-xs text-destructive">{validationErrors.amount}</p>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <Label className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Billing Address
                  </Label>
                  
                  <div className="space-y-2">
                    <Input
                      placeholder="Street Address *"
                      value={customerInfo.address}
                      onChange={(e) => handleCustomerInfoChange('address', e.target.value)}
                      className={validationErrors.address ? 'border-destructive' : ''}
                    />
                    {validationErrors.address && (
                      <p className="text-xs text-destructive">{validationErrors.address}</p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-2">
                      <Input
                        placeholder="City *"
                        value={customerInfo.city}
                        onChange={(e) => handleCustomerInfoChange('city', e.target.value)}
                        className={validationErrors.city ? 'border-destructive' : ''}
                      />
                      {validationErrors.city && (
                        <p className="text-xs text-destructive">{validationErrors.city}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Input
                        placeholder="State *"
                        value={customerInfo.state}
                        onChange={(e) => handleCustomerInfoChange('state', e.target.value)}
                        className={validationErrors.state ? 'border-destructive' : ''}
                      />
                      {validationErrors.state && (
                        <p className="text-xs text-destructive">{validationErrors.state}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Input
                        placeholder="ZIP *"
                        value={customerInfo.zipCode}
                        onChange={(e) => handleCustomerInfoChange('zipCode', e.target.value)}
                        className={validationErrors.zipCode ? 'border-destructive' : ''}
                      />
                      {validationErrors.zipCode && (
                        <p className="text-xs text-destructive">{validationErrors.zipCode}</p>
                      )}
                    </div>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Payment Settings */}
          <Card className="shadow-card bg-gradient-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Payment Settings
              </CardTitle>
              <CardDescription>
                Configure hosted payment page options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="create-profile"
                    checked={createProfile}
                    onCheckedChange={setCreateProfile}
                  />
                  <Label htmlFor="create-profile">Save payment method for future use</Label>
                </div>
                
                {createProfile && (
                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      Customer can choose to save their payment information securely with Authorize.Net for faster future transactions.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="font-medium">Payment Options Available</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 p-3 border rounded-lg">
                    <CreditCard className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Credit Cards</p>
                      <p className="text-xs text-muted-foreground">Visa, MC, Amex, Discover</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 border rounded-lg">
                    <div className="h-5 w-5 bg-primary rounded flex items-center justify-center">
                      <span className="text-xs text-primary-foreground">eC</span>
                    </div>
                    <div>
                      <p className="font-medium">eCheck</p>
                      <p className="text-xs text-muted-foreground">Bank account payment</p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="font-medium">Security Features</h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span>PCI DSS Level 1 compliant hosting</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span>SSL encrypted payment processing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span>CVV and address verification</span>
                  </div>
                </div>
              </div>

              <Separator />

              <Button 
                type="submit" 
                className="w-full"
                disabled={isProcessing}
                onClick={handleSubmit}
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
                    {processingStep || 'Processing...'}
                  </div>
                ) : (
                  <>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Proceed to Hosted Payment
                  </>
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                You will be redirected to Authorize.Net's secure payment page
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Testing Information */}
        <Card className="shadow-card bg-gradient-card border-primary/20">
          <CardHeader>
            <CardTitle className="text-primary">Testing Information</CardTitle>
            <CardDescription>Use these test credentials for sandbox testing</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Test Credit Cards</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Visa:</span>
                  <code>4111111111111111</code>
                </div>
                <div className="flex justify-between">
                  <span>Mastercard:</span>
                  <code>5424000000000015</code>
                </div>
                <div className="flex justify-between">
                  <span>Amex:</span>
                  <code>370000000000002</code>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Test Details</h4>
              <div className="space-y-1 text-sm">
                <div>Expiry: Any future date</div>
                <div>CVV: Any 3-4 digits</div>
                <div>ZIP: Any 5 digits</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AcceptHostedForm;