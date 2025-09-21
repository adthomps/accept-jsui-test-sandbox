import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, CreditCard, User, MapPin, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import PaymentResponseDisplay from './PaymentResponseDisplay';

interface CustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  amount: string;
}

interface PaymentToken {
  opaqueData: {
    dataDescriptor: string;
    dataValue: string;
  };
  messages?: {
    resultCode: string;
    message: { code: string; text: string }[];
  };
}

interface PaymentFormProps {
  onBack: () => void;
}

const PaymentForm = ({ onBack }: PaymentFormProps) => {
  const { toast } = useToast();
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    amount: ''
  });
  
  const [paymentToken, setPaymentToken] = useState<PaymentToken | null>(null);
  const [showTokenDetails, setShowTokenDetails] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAcceptJSLoaded, setIsAcceptJSLoaded] = useState(false);
  const [acceptJSError, setAcceptJSError] = useState<string | null>(null);
  const [authConfig, setAuthConfig] = useState<any>(null);
  
  // Enhanced response handling
  const [paymentResponse, setPaymentResponse] = useState<any>(null);
  const [showResponseDetails, setShowResponseDetails] = useState(true);
  const [responseType, setResponseType] = useState<'success' | 'failure' | null>(null);

  // Load auth config and AcceptJS library
  useEffect(() => {
    const loadAuthConfigAndAcceptJS = async () => {
      try {
        // First, get the auth configuration
        const configResponse = await fetch('https://pzzzcxspasbswpxzdqku.supabase.co/functions/v1/get-auth-config');
        const config = await configResponse.json();
        
        if (!config.success) {
          throw new Error(config.error || 'Failed to load authentication configuration');
        }
        
        setAuthConfig(config);

        // Remove any existing AcceptJS script
        const existingScript = document.querySelector('script[src*="Accept.js"]');
        if (existingScript) {
          existingScript.remove();
        }

        // Load AcceptJS
        const script = document.createElement('script');
        script.src = `${config.environment.jsUrl}/v1/Accept.js`;
        script.charset = 'utf-8';
        
        script.onload = () => {
          console.log('AcceptJS loaded successfully');
          setIsAcceptJSLoaded(true);
          setAcceptJSError(null);
        };
        
        script.onerror = (error) => {
          console.error('Failed to load AcceptJS:', error);
          setAcceptJSError('Failed to load payment library');
          setIsAcceptJSLoaded(false);
        };

        document.head.appendChild(script);
      } catch (error) {
        console.error('Error loading auth config and AcceptJS:', error);
        setAcceptJSError('Failed to initialize payment system');
      }
    };

    loadAuthConfigAndAcceptJS();

    // Cleanup function
    return () => {
      const script = document.querySelector('script[src*="Accept.js"]');
      if (script) {
        script.remove();
      }
      setIsAcceptJSLoaded(false);
      setAcceptJSError(null);
    };
  }, []);

  const handleCustomerInfoChange = (field: keyof CustomerInfo, value: string) => {
    setCustomerInfo(prev => ({ ...prev, [field]: value }));
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAcceptJSLoaded || !window.Accept) {
      toast({
        title: "Error",
        description: "Payment system not loaded. Please try again.",
        variant: "destructive"
      });
      return;
    }

    if (!authConfig) {
      toast({
        title: "Error",
        description: "Payment system not properly configured.",
        variant: "destructive"
      });
      return;
    }

    // Get payment form data
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const authData = {
      clientKey: authConfig.clientKey,
      apiLoginID: authConfig.apiLoginId
    };

    const cardData = {
      cardNumber: formData.get('cardNumber') as string,
      month: formData.get('expMonth') as string,
      year: formData.get('expYear') as string,
      cardCode: formData.get('cvv') as string
    };

    console.log('Calling Accept.dispatchData with:', { authData, cardData });

    // Use AcceptJS to create payment token
    try {
      const secureData = {
        authData,
        cardData: {
          ...cardData,
          cardNumber: (cardData.cardNumber || '').replace(/\s+/g, ''),
        },
      };

      (window as any).Accept.dispatchData(secureData, (response: any) => {
        console.log('Accept.js response:', response);
        if (response.messages.resultCode === "Error") {
          let errorMsg = '';
          for (let i = 0; i < response.messages.message.length; i++) {
            errorMsg += response.messages.message[i].code + ": " + response.messages.message[i].text;
          }
          toast({
            title: "Payment Error",
            description: errorMsg,
            variant: "destructive"
          });
        } else {
          // Successfully received payment token
          setPaymentToken({ opaqueData: response.opaqueData, messages: response.messages });
          toast({
            title: "Payment Token Generated",
            description: "Payment token created successfully. Review before processing.",
            variant: "default"
          });
        }
      });
    } catch (error) {
      console.error('Accept.dispatchData error:', error);
      toast({
        title: "Payment Error",
        description: "Failed to process payment information",
        variant: "destructive"
      });
    }
  };

  const processPayment = async () => {
    if (!paymentToken) {
      toast({
        title: "Error",
        description: "No payment token available. Please submit payment information first.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      console.log('Invoking process-payment with:', {
        descriptor: paymentToken.opaqueData.dataDescriptor,
        nonceLength: paymentToken.opaqueData.dataValue?.length || 0,
        amount: customerInfo.amount,
        zip: customerInfo.zip,
      });

      const { data, error } = await supabase.functions.invoke('process-payment', {
        body: {
          opaqueData: paymentToken.opaqueData,
          customerInfo: {
            firstName: customerInfo.firstName,
            lastName: customerInfo.lastName,
            email: customerInfo.email,
            phone: customerInfo.phone,
            address: customerInfo.address,
            city: customerInfo.city,
            state: customerInfo.state,
            zipCode: customerInfo.zip,
            country: 'US', // Default to US, could be made configurable
            amount: parseFloat(customerInfo.amount)
          }
        }
      });

      if (error) {
        console.error('Edge Function error:', error, (error as any)?.context);
        throw new Error(error.message);
      }

      if (data.success) {
        // Store detailed success response
        setPaymentResponse(data);
        setResponseType('success');
        setShowResponseDetails(true);
        
        toast({
          title: "Payment Processed Successfully",
          description: `Transaction ID: ${data.transactionId}`,
          variant: "default"
        });
        
        // Reset form after successful payment
        setPaymentToken(null);
        setCustomerInfo({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          address: '',
          city: '',
          state: '',
          zip: '',
          amount: ''
        });
      } else {
        // Store detailed failure response
        console.error('Gateway returned failure:', data);
        setPaymentResponse(data);
        setResponseType('failure');
        setShowResponseDetails(true);
        
        toast({
          title: "Payment Failed",
          description: data.error || "Payment could not be processed",
          variant: "destructive"
        });
        return;
      }
      
    } catch (error: any) {
      console.error('Payment processing error (caught):', error);
      
      // Store error response
      const errorResponse = {
        success: false,
        error: error.message || "There was an error processing your payment. Please try again.",
        requestId: `error_${Date.now()}`,
        processing: {
          startTime: Date.now(),
          endTime: Date.now(),
          duration: 0,
          timestamp: new Date().toISOString()
        }
      };
      
      setPaymentResponse(errorResponse);
      setResponseType('failure');
      setShowResponseDetails(true);
      
      toast({
        title: "Payment Processing Error",
        description: error.message || "There was an error processing your payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <Button
            variant="outline"
            onClick={onBack}
            className="absolute top-6 left-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center justify-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Secure Payment Collection
            </h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Collect customer information and process payments securely using Authorize.Net AcceptJS
          </p>
          <Badge variant="secondary" className="gap-2">
            <Shield className="h-4 w-4" />
            Test Environment
          </Badge>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Customer Information */}
          <Card className="shadow-card bg-gradient-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Customer Information
              </CardTitle>
              <CardDescription>
                Enter customer details for the payment transaction
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    value={customerInfo.firstName}
                    onChange={(e) => handleCustomerInfoChange('firstName', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    value={customerInfo.lastName}
                    onChange={(e) => handleCustomerInfoChange('lastName', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john.doe@example.com"
                  value={customerInfo.email}
                  onChange={(e) => handleCustomerInfoChange('email', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  placeholder="(555) 123-4567"
                  value={customerInfo.phone}
                  onChange={(e) => handleCustomerInfoChange('phone', e.target.value)}
                />
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Billing Address
                </Label>
                
                <div className="space-y-2">
                  <Input
                    placeholder="123 Main Street"
                    value={customerInfo.address}
                    onChange={(e) => handleCustomerInfoChange('address', e.target.value)}
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    placeholder="City"
                    value={customerInfo.city}
                    onChange={(e) => handleCustomerInfoChange('city', e.target.value)}
                  />
                  <Input
                    placeholder="State"
                    value={customerInfo.state}
                    onChange={(e) => handleCustomerInfoChange('state', e.target.value)}
                  />
                  <Input
                    placeholder="ZIP"
                    value={customerInfo.zip}
                    onChange={(e) => handleCustomerInfoChange('zip', e.target.value)}
                  />
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label htmlFor="amount">Payment Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="99.99"
                  value={customerInfo.amount}
                  onChange={(e) => handleCustomerInfoChange('amount', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card className="shadow-card bg-gradient-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Payment Information
              </CardTitle>
              <CardDescription>
                Secure payment processing via Authorize.Net AcceptJS
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePaymentSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input
                    id="cardNumber"
                    name="cardNumber"
                    placeholder="4111 1111 1111 1111"
                    maxLength={19}
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expMonth">Month</Label>
                    <Input
                      id="expMonth"
                      name="expMonth"
                      placeholder="12"
                      maxLength={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expYear">Year</Label>
                    <Input
                      id="expYear"
                      name="expYear"
                      placeholder="2025"
                      maxLength={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvv">CVV</Label>
                    <Input
                      id="cvv"
                      name="cvv"
                      placeholder="123"
                      maxLength={4}
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full shadow-button"
                  disabled={!isAcceptJSLoaded}
                >
                  Generate Payment Token
                </Button>
                
                {!isAcceptJSLoaded && (
                  <Alert>
                    <AlertDescription>
                      {acceptJSError || 'Loading Authorize.Net AcceptJS library...'}
                    </AlertDescription>
                  </Alert>
                )}
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Token Display & Processing */}
        {paymentToken && (
          <Card className="shadow-card bg-gradient-card">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-accent" />
                  Payment Token (Testing View)
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTokenDetails(!showTokenDetails)}
                >
                  {showTokenDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {showTokenDetails ? 'Hide' : 'Show'} Details
                </Button>
              </CardTitle>
              <CardDescription>
                Review the payment token before processing the transaction
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {showTokenDetails && (
                <div className="space-y-4">
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <Label>Result Code</Label>
                      <Input
                        value={paymentToken.messages?.resultCode || ''}
                        readOnly
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Message Code</Label>
                      <Input
                        value={(paymentToken.messages?.message?.map((m: any) => m.code).join(', ')) || ''}
                        readOnly
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Message</Label>
                      <Input
                        value={(paymentToken.messages?.message?.map((m: any) => m.text).join(' | ')) || ''}
                        readOnly
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Data Type (Data Descriptor)</Label>
                    <Textarea
                      value={paymentToken.opaqueData.dataDescriptor}
                      readOnly
                      className="font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Nonce (Data Value)</Label>
                    <Textarea
                      value={paymentToken.opaqueData.dataValue}
                      readOnly
                      className="font-mono text-sm"
                      rows={4}
                    />
                  </div>
                </div>
              )}
              
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Payment token generated successfully. This token can be used to process the payment securely without storing credit card information.
                </AlertDescription>
              </Alert>

              <Button
                onClick={processPayment}
                disabled={isProcessing}
                className="w-full shadow-button bg-gradient-primary"
                size="lg"
              >
                {isProcessing ? 'Processing Payment...' : 'Process Payment'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Payment Response Display */}
        {paymentResponse && showResponseDetails && (
          <PaymentResponseDisplay 
            response={paymentResponse}
            onDismiss={() => {
              setPaymentResponse(null);
              setShowResponseDetails(false);
              setResponseType(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default PaymentForm;