import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, CreditCard, Shield, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAcceptEndpointHealth, logAcceptEndpoint } from '@/hooks/useAcceptEndpointHealth';
import PaymentResponseDisplay from './PaymentResponseDisplay';

// Declare global Accept interface for v1
declare global {
  interface Window {
    AcceptV1?: {
      dispatchData: (secureData: any, responseHandler: (response: any) => void) => void;
    };
  }
}

interface CustomerInfo {
  amount: string;
  invoiceNumber: string;
  firstName: string;
  lastName: string;
  company: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  email: string;
  phone: string;
  cardNumber: string;
  expirationDate: string;
  cardCode: string;
}

interface AcceptJSv1FormProps {
  onBack: () => void;
}

interface AuthConfig {
  clientKey: string;
  apiLoginId: string;
  environment: {
    apiUrl: string;
    jsUrl: string;
    gatewayUrl: string;
  };
}

const AcceptJSv1Form: React.FC<AcceptJSv1FormProps> = ({ onBack }) => {
  const { toast } = useToast();
  const endpointHealth = useAcceptEndpointHealth();
  
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    amount: '10.00',
    invoiceNumber: 'INV-' + Date.now(),
    firstName: 'John',
    lastName: 'Doe',
    company: 'Test Company',
    address: '123 Main St',
    city: 'Anytown',
    state: 'CA',
    zip: '12345',
    email: 'john.doe@example.com',
    phone: '555-123-4567',
    cardNumber: '4111111111111111',
    expirationDate: '12/25',
    cardCode: '123'
  });

  const [isAcceptLoaded, setIsAcceptLoaded] = useState(false);
  const [authConfig, setAuthConfig] = useState<AuthConfig | null>(null);
  const [paymentToken, setPaymentToken] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentResponse, setPaymentResponse] = useState<any>(null);

  // Load Accept.js v1 script and fetch auth config
  useEffect(() => {
    const loadAcceptJS = async () => {
      try {
        // Fetch authentication configuration
        const { data: authData, error: authError } = await supabase.functions.invoke('get-auth-config');
        
        if (authError || !authData?.success) {
          throw new Error(authData?.error || 'Failed to get auth configuration');
        }
        
        console.log('Auth config loaded:', authData);
        setAuthConfig(authData);

        // Load Accept.js v1 script
        const script = document.createElement('script');
        script.src = `${authData.environment.jsUrl}/v1/Accept.js`;
        script.async = true;
        script.onload = () => {
          console.log('Accept.js v1 loaded successfully');
          // Map Accept to AcceptV1 to avoid conflicts
          if ((window as any).Accept) {
            (window as any).AcceptV1 = (window as any).Accept;
          }
          setIsAcceptLoaded(true);
          logAcceptEndpoint();
        };
        script.onerror = (error) => {
          console.error('Failed to load Accept.js v1:', error);
          toast({
            title: "Script Loading Error",
            description: "Failed to load Accept.js v1 library",
            variant: "destructive"
          });
        };
        
        document.head.appendChild(script);
        
        return () => {
          document.head.removeChild(script);
        };
      } catch (error) {
        console.error('Error loading Accept.js v1:', error);
        toast({
          title: "Configuration Error",
          description: error instanceof Error ? error.message : "Failed to load configuration",
          variant: "destructive"
        });
      }
    };

    loadAcceptJS();
  }, [toast]);

  const handleCustomerInfoChange = (field: keyof CustomerInfo, value: string) => {
    setCustomerInfo(prev => ({ ...prev, [field]: value }));
  };

  const generatePaymentToken = async () => {
    if (!window.AcceptV1 || !authConfig) {
      toast({
        title: "Library Not Ready",
        description: "Accept.js v1 library is not loaded yet",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    const secureData = {
      authData: {
        apiLoginID: authConfig.apiLoginId,
        clientKey: authConfig.clientKey
      },
      cardData: {
        cardNumber: customerInfo.cardNumber.replace(/\s/g, ''),
        month: customerInfo.expirationDate.split('/')[0],
        year: customerInfo.expirationDate.split('/')[1],
        cardCode: customerInfo.cardCode
      }
    };

    console.log('Generating token with data:', secureData);

    window.AcceptV1.dispatchData(secureData, (response) => {
      setIsProcessing(false);
      console.log('Accept.js v1 response:', response);

      if (response.messages.resultCode === 'Error') {
        const errorMessage = response.messages.message.map((msg: any) => msg.text).join(', ');
        toast({
          title: "Tokenization Failed",
          description: errorMessage,
          variant: "destructive"
        });
        return;
      }

      // Success - we have the payment token
      setPaymentToken(response.opaqueData);
      toast({
        title: "Token Generated",
        description: "Payment data tokenized successfully using Accept.js v1",
        variant: "default"
      });
    });
  };

  const processPayment = async () => {
    if (!paymentToken) return;

    setIsProcessing(true);

    try {
      const paymentData = {
        opaqueData: paymentToken,
        customerInfo: {
          amount: customerInfo.amount,
          invoiceNumber: customerInfo.invoiceNumber,
          firstName: customerInfo.firstName,
          lastName: customerInfo.lastName,
          company: customerInfo.company,
          address: customerInfo.address,
          city: customerInfo.city,
          state: customerInfo.state,
          zip: customerInfo.zip,
          email: customerInfo.email,
          phone: customerInfo.phone
        }
      };

      console.log('Processing payment with data:', paymentData);

      const { data, error } = await supabase.functions.invoke('process-payment', {
        body: paymentData
      });

      if (error) {
        throw error;
      }

      console.log('Payment response:', data);
      setPaymentResponse(data);

      if (data.success) {
        toast({
          title: "Payment Successful",
          description: `Transaction ID: ${data.transactionId}`,
          variant: "default"
        });
        
        // Reset form for another transaction
        setPaymentToken(null);
        setCustomerInfo(prev => ({
          ...prev,
          invoiceNumber: 'INV-' + Date.now(),
          cardNumber: '4111111111111111',
          expirationDate: '12/25',
          cardCode: '123'
        }));
      } else {
        toast({
          title: "Payment Failed",
          description: data.message || "Transaction was declined",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      toast({
        title: "Processing Error",
        description: error instanceof Error ? error.message : "Failed to process payment",
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
          <Button variant="outline" onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Accept.js v1 Custom Form</h1>
            <Badge variant="secondary" className="gap-2">
              <Shield className="h-3 w-3" />
              SAQ A-EP
            </Badge>
          </div>
        </div>

        {/* Status Information */}
        <div className="grid md:grid-cols-2 gap-4">
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Accept.js v1 Status:</strong> {isAcceptLoaded ? '✅ Loaded' : '⏳ Loading...'}
              <br />
              <strong>Endpoint:</strong> {endpointHealth.host || 'Not detected'}
              <br />
              <strong>Library:</strong> {endpointHealth.version || 'Unknown'}
            </AlertDescription>
          </Alert>
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>PCI Compliance:</strong> SAQ A-EP (you handle card inputs)
              <br />
              <strong>Tokenization:</strong> Client-side using api2.authorize.net
              <br />
              <strong>Control:</strong> Full UX customization
            </AlertDescription>
          </Alert>
        </div>

        {/* Customer Information Form */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
            <CardDescription>
              Enter customer and payment details for tokenization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Transaction Details */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount ($)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={customerInfo.amount}
                  onChange={(e) => handleCustomerInfoChange('amount', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invoiceNumber">Invoice Number</Label>
                <Input
                  id="invoiceNumber"
                  value={customerInfo.invoiceNumber}
                  onChange={(e) => handleCustomerInfoChange('invoiceNumber', e.target.value)}
                />
              </div>
            </div>

            {/* Customer Details */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={customerInfo.firstName}
                  onChange={(e) => handleCustomerInfoChange('firstName', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={customerInfo.lastName}
                  onChange={(e) => handleCustomerInfoChange('lastName', e.target.value)}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={customerInfo.email}
                  onChange={(e) => handleCustomerInfoChange('email', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={customerInfo.phone}
                  onChange={(e) => handleCustomerInfoChange('phone', e.target.value)}
                />
              </div>
            </div>

            {/* Payment Information */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Payment Information</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input
                    id="cardNumber"
                    value={customerInfo.cardNumber}
                    onChange={(e) => handleCustomerInfoChange('cardNumber', e.target.value)}
                    placeholder="4111111111111111"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="expirationDate">Expiry (MM/YY)</Label>
                    <Input
                      id="expirationDate"
                      value={customerInfo.expirationDate}
                      onChange={(e) => handleCustomerInfoChange('expirationDate', e.target.value)}
                      placeholder="12/25"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cardCode">CVV</Label>
                    <Input
                      id="cardCode"
                      value={customerInfo.cardCode}
                      onChange={(e) => handleCustomerInfoChange('cardCode', e.target.value)}
                      placeholder="123"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Generate Token Button */}
            <Button
              onClick={generatePaymentToken}
              disabled={!isAcceptLoaded || !authConfig || isProcessing}
              className="w-full"
            >
              {isProcessing ? "Generating Token..." : "Generate Payment Token"}
            </Button>

            {/* Payment Token Display */}
            {paymentToken && (
              <div className="border rounded-lg p-4 bg-muted/20">
                <h4 className="font-semibold mb-2">Payment Token Generated</h4>
                <div className="text-sm space-y-1">
                  <p><strong>Data Descriptor:</strong> {paymentToken.dataDescriptor}</p>
                  <p><strong>Data Value:</strong> {paymentToken.dataValue.substring(0, 50)}...</p>
                </div>
                <Button
                  onClick={processPayment}
                  disabled={isProcessing}
                  className="w-full mt-4"
                >
                  {isProcessing ? "Processing Payment..." : "Process Payment"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Response Display */}
        {paymentResponse && (
          <PaymentResponseDisplay response={paymentResponse} />
        )}
      </div>
    </div>
  );
};

export default AcceptJSv1Form;