import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Shield, CreditCard, User, MapPin, Eye, EyeOff, ArrowLeft, Landmark, Code, ChevronDown } from 'lucide-react';
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
  
  // Payment type selection
  const [paymentType, setPaymentType] = useState<'card' | 'bank'>('card');
  
  // Enhanced response handling
  const [paymentResponse, setPaymentResponse] = useState<any>(null);
  const [showResponseDetails, setShowResponseDetails] = useState(true);
  const [responseType, setResponseType] = useState<'success' | 'failure' | null>(null);
  
  // Debug mode
  const [debugMode, setDebugMode] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [showDebug, setShowDebug] = useState(false);

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

    // Use AcceptJS to create payment token
    try {
      let secureData: any = { authData };

      if (paymentType === 'card') {
        const cardData = {
          cardNumber: formData.get('cardNumber') as string,
          month: formData.get('expMonth') as string,
          year: formData.get('expYear') as string,
          cardCode: formData.get('cvv') as string
        };

        secureData.cardData = {
          ...cardData,
          cardNumber: (cardData.cardNumber || '').replace(/\s+/g, ''),
        };

        console.log('Calling Accept.dispatchData with card data:', { authData, cardData });
      } else {
        const bankData = {
          accountType: formData.get('accountType') as string,
          routingNumber: formData.get('routingNumber') as string,
          accountNumber: formData.get('accountNumber') as string,
          nameOnAccount: formData.get('nameOnAccount') as string,
          bankName: formData.get('bankName') as string || undefined
        };

        secureData.bankData = bankData;
        console.log('Calling Accept.dispatchData with bank data:', { authData, bankData });
      }

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
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/5 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              AcceptJS Payment
            </h1>
            <p className="text-muted-foreground">
              Client-side tokenization with custom payment form
            </p>
          </div>
          <div className="ml-auto flex gap-2">
            <Badge variant="secondary" className="gap-2">
              <Shield className="h-4 w-4" />
              SAQ A-EP
            </Badge>
            <Badge variant="outline" className="gap-2">
              {paymentType === 'card' ? (
                <CreditCard className="h-4 w-4" />
              ) : (
                <Landmark className="h-4 w-4" />
              )}
              {paymentType === 'card' ? 'Card' : 'eCheck'}
            </Badge>
          </div>
        </div>

        {/* Debug Mode Toggle */}
        <Card className="shadow-card bg-gradient-card border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch id="debug-mode" checked={debugMode} onCheckedChange={setDebugMode} />
                <Label htmlFor="debug-mode" className="flex items-center gap-2 cursor-pointer">
                  <Code className="h-4 w-4 text-primary" />
                  Debug Mode - View API request/response details
                </Label>
              </div>
              {debugMode && <Badge variant="secondary">Debug Mode Active</Badge>}
            </div>
            {debugMode && (
              <p className="text-xs text-muted-foreground mt-2">
                When enabled, API requests and responses will be displayed for troubleshooting and development.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Integration Architecture Info */}
        <Card className="border-blue-500/50 bg-blue-500/5">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Integration Architecture
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="default" className="text-xs">Accept.js Client-Side</Badge>
                <span className="text-xs text-muted-foreground">SAQ A-EP Compliant</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Payment data is tokenized directly in the browser using Authorize.Net's Accept.js library.
                Card details never touch your server - only the secure payment nonce is transmitted.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                <strong>Flow:</strong> Browser → Accept.js → Payment Token → Your Server → Authorize.Net
              </p>
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs">Server Processing</Badge>
                <span className="text-xs text-muted-foreground">Edge Function</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Server receives only the payment nonce and processes the transaction via Authorize.Net API.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                <strong>Supports:</strong> Credit Cards, Debit Cards, eCheck/ACH
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Debug Info Panel */}
        {debugMode && debugInfo && (
          <Collapsible open={showDebug} onOpenChange={setShowDebug}>
            <Card className="border-yellow-500/50 bg-yellow-500/5">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-accent/5 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Code className="h-4 w-4" />
                      Debug Information
                    </CardTitle>
                    <ChevronDown className={`h-4 w-4 transition-transform ${showDebug ? 'rotate-180' : ''}`} />
                  </div>
                  <CardDescription>API request and response details for troubleshooting</CardDescription>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  {debugInfo.request && (
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">API Request</Label>
                      <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto border max-h-48">
                        {JSON.stringify(debugInfo.request, null, 2)}
                      </pre>
                    </div>
                  )}
                  {debugInfo.response && (
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">API Response</Label>
                      <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto border max-h-48">
                        {JSON.stringify(debugInfo.response, null, 2)}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}

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
                {paymentType === 'card' ? (
                  <CreditCard className="h-5 w-5 text-primary" />
                ) : (
                  <Landmark className="h-5 w-5 text-primary" />
                )}
                Payment Information
              </CardTitle>
              <CardDescription>
                Secure payment processing via Authorize.Net AcceptJS
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePaymentSubmit} className="space-y-6">
                {/* Payment Type Selection */}
                <Tabs value={paymentType} onValueChange={(value) => setPaymentType(value as 'card' | 'bank')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="card" className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Credit Card
                    </TabsTrigger>
                    <TabsTrigger value="bank" className="flex items-center gap-2">
                      <Landmark className="h-4 w-4" />
                      Bank Account
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="card" className="space-y-6 mt-6">
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
                  </TabsContent>

                  <TabsContent value="bank" className="space-y-6 mt-6">
                    <div className="space-y-2">
                      <Label htmlFor="bankName">Bank Name (Optional)</Label>
                      <Input
                        id="bankName"
                        name="bankName"
                        placeholder="First National Bank"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="accountType">Account Type</Label>
                      <Select name="accountType">
                        <SelectTrigger>
                          <SelectValue placeholder="Select account type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="checking">Checking</SelectItem>
                          <SelectItem value="savings">Savings</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="routingNumber">Routing Number</Label>
                        <Input
                          id="routingNumber"
                          name="routingNumber"
                          placeholder="111000025"
                          maxLength={9}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="accountNumber">Account Number</Label>
                        <Input
                          id="accountNumber"
                          name="accountNumber"
                          placeholder="123456789"
                          maxLength={17}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="nameOnAccount">Name on Account</Label>
                      <Input
                        id="nameOnAccount"
                        name="nameOnAccount"
                        placeholder="John Doe"
                      />
                    </div>

                    <Alert>
                      <Landmark className="h-4 w-4" />
                      <AlertDescription>
                        ACH payments typically take 1-3 business days to process. Use test routing number 111000025 for testing.
                      </AlertDescription>
                    </Alert>
                  </TabsContent>
                </Tabs>

                <Button 
                  type="submit" 
                  className="w-full shadow-button"
                  disabled={!isAcceptJSLoaded}
                >
                  Generate {paymentType === 'card' ? 'Card' : 'Bank'} Payment Token
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

        {/* Testing Information */}
        <Card className="shadow-card bg-gradient-card border-primary/20">
          <CardHeader>
            <CardTitle className="text-primary">Testing Information</CardTitle>
            <CardDescription>Use these test credentials for sandbox testing</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Test Credit Cards</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Visa:</span>
                  <code className="bg-muted px-1 py-0.5 rounded">4111111111111111</code>
                </div>
                <div className="flex justify-between">
                  <span>Mastercard:</span>
                  <code className="bg-muted px-1 py-0.5 rounded">5424000000000015</code>
                </div>
                <div className="flex justify-between">
                  <span>Amex:</span>
                  <code className="bg-muted px-1 py-0.5 rounded">370000000000002</code>
                </div>
                <div className="flex justify-between">
                  <span>Discover:</span>
                  <code className="bg-muted px-1 py-0.5 rounded">6011000000000012</code>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Test Bank Account (eCheck)</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Routing:</span>
                  <code className="bg-muted px-1 py-0.5 rounded">111000025</code>
                </div>
                <div className="flex justify-between">
                  <span>Account:</span>
                  <code className="bg-muted px-1 py-0.5 rounded">123456789</code>
                </div>
                <div className="flex justify-between">
                  <span>Type:</span>
                  <code className="bg-muted px-1 py-0.5 rounded">Checking</code>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Card Details</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div>Expiry: Any future date (e.g., 12/2025)</div>
                <div>CVV: Any 3-4 digits (e.g., 123)</div>
                <div>ZIP: Any 5 digits (e.g., 12345)</div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">AcceptJS Integration</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div>Library: Accept.js v1</div>
                <div>Method: Client-side tokenization</div>
                <div>PCI Scope: SAQ A-EP</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentForm;