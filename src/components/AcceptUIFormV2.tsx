import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Shield, CreditCard, User, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import PaymentResponseDisplay from './PaymentResponseDisplay';

declare global {
  interface Window {
    Accept: {
      dispatchData: (paymentForm: any, responseHandler: any) => void;
    };
  }
}

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
  invoice: string;
  description: string;
}

interface AcceptUIFormV2Props {
  onBack: () => void;
}

const AcceptUIFormV2 = ({ onBack }: AcceptUIFormV2Props) => {
  const { toast } = useToast();
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '555-123-4567',
    address: '123 Main Street',
    city: 'Bellevue',
    state: 'WA',
    zip: '98004',
    amount: '29.99',
    invoice: 'INV-' + Date.now(),
    description: 'AcceptUI v2 Test Transaction'
  });

  const [isAcceptLoaded, setIsAcceptLoaded] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [authConfig, setAuthConfig] = useState<any>(null);
  const [paymentToken, setPaymentToken] = useState<any>(null);
  const [showTokenDetails, setShowTokenDetails] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentResponse, setPaymentResponse] = useState<any>(null);
  const [showResponseDetails, setShowResponseDetails] = useState(true);
  const buttonContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadAuthConfigAndAcceptJS = async () => {
      try {
        // Get auth configuration
        const configResponse = await fetch('https://pzzzcxspasbswpxzdqku.supabase.co/functions/v1/get-auth-config');
        const config = await configResponse.json();
        
        if (!config.success) {
          throw new Error(config.error || 'Failed to load authentication configuration');
        }
        
        setAuthConfig(config);

        // Remove existing script
        const existingScript = document.querySelector('script[src*="Accept.js"]');
        if (existingScript) {
          existingScript.remove();
        }

        // Load Accept.js v2 for AcceptUI v2
        const script = document.createElement('script');
        script.src = `${config.environment.jsUrl}/v1/Accept.js`;
        script.charset = 'utf-8';
        
        script.onload = () => {
          console.log('AcceptUI v2 (Accept.js) loaded successfully');
          setIsAcceptLoaded(true);
          setAcceptError(null);
          
          // Create AcceptUI button after script loads and config is available
          if (config && buttonContainerRef.current) {
            createAcceptUIButton(config);
          }
          
          toast({
            title: "AcceptUI v2 Ready",
            description: "Enhanced AcceptJS tokenization loaded successfully",
          });
        };
        
        script.onerror = (error) => {
          console.error('Failed to load AcceptUI v2:', error);
          setAcceptError('Failed to load AcceptUI v2 library');
          setIsAcceptLoaded(false);
        };

        document.head.appendChild(script);
      } catch (error) {
        console.error('Error loading AcceptUI v2:', error);
        setAcceptError('Failed to initialize AcceptUI v2 system');
      }
    };

    loadAuthConfigAndAcceptJS();

    return () => {
      const script = document.querySelector('script[src*="Accept.js"]');
      if (script) {
        script.remove();
      }
      setIsAcceptLoaded(false);
      setAcceptError(null);
    };
  }, [toast]);

  // Create AcceptUI button dynamically after library loads
  const createAcceptUIButton = (config: any) => {
    if (!buttonContainerRef.current || !config) return;
    
    // Clear existing button
    buttonContainerRef.current.innerHTML = '';
    
    // Create button element
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'AcceptUI w-full h-12 bg-gradient-primary text-primary-foreground rounded-lg font-medium shadow-button hover:opacity-90 transition-opacity';
    button.textContent = 'Open AcceptUI v2 Lightbox Payment';
    
    // Set AcceptUI data attributes
    button.setAttribute('data-billingAddressOptions', '{"show":true, "required":false}');
    button.setAttribute('data-apiLoginID', config.apiLoginId);
    button.setAttribute('data-clientKey', config.clientKey);
    button.setAttribute('data-acceptUIFormBtnTxt', 'Complete Payment');
    button.setAttribute('data-acceptUIFormHeaderTxt', 'Payment Information');
    button.setAttribute('data-paymentOptions', '{"showCreditCard": true, "showBankAccount": false}');
    button.setAttribute('data-responseHandler', 'acceptUIV2ResponseHandler');
    
    buttonContainerRef.current.appendChild(button);
  };

  // Update button when config changes and AcceptUI is loaded
  useEffect(() => {
    if (authConfig && isAcceptLoaded && buttonContainerRef.current) {
      createAcceptUIButton(authConfig);
    }
  }, [authConfig, isAcceptLoaded]);

  const handleCustomerInfoChange = (field: keyof CustomerInfo, value: string) => {
    setCustomerInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // AcceptUI v2 Response Handler - Global function for AcceptUI lightbox
  useEffect(() => {
    // Define global response handler for AcceptUI v2
    (window as any).acceptUIV2ResponseHandler = (response: any) => {
      console.log('AcceptUI v2 lightbox response:', response);
      
      if (response.messages && response.messages.resultCode === "Error") {
        const errors = response.messages.message.map((msg: any) => `${msg.code}: ${msg.text}`).join(', ');
        toast({
          title: "AcceptUI v2 Payment Error",
          description: errors,
          variant: "destructive",
        });
      } else if (response.opaqueData) {
        // Set hidden form values
        const dataValueInput = document.getElementById('dataValue') as HTMLInputElement;
        const dataDescriptorInput = document.getElementById('dataDescriptor') as HTMLInputElement;
        
        if (dataValueInput && dataDescriptorInput) {
          dataValueInput.value = response.opaqueData.dataValue;
          dataDescriptorInput.value = response.opaqueData.dataDescriptor;
        }
        
        setPaymentToken({ opaqueData: response.opaqueData, messages: response.messages });
        toast({
          title: "AcceptUI v2 Payment Ready",
          description: "Payment information captured securely via lightbox",
        });
      } else {
        console.error('AcceptUI v2 - Unexpected response format:', response);
        toast({
          title: "AcceptUI v2 Response Error",
          description: "Unexpected response format from AcceptUI v2 lightbox",
          variant: "destructive",
        });
      }
    };

    // Cleanup
    return () => {
      delete (window as any).acceptUIV2ResponseHandler;
    };
  }, [toast]);

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
      console.log('AcceptUI v2 - Processing payment with token');

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
            country: 'US',
            amount: parseFloat(customerInfo.amount)
          }
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.success) {
        setPaymentResponse(data);
        setShowResponseDetails(true);
        
        toast({
          title: "AcceptUI v2 Payment Success",
          description: `Transaction ID: ${data.transactionId}`,
        });
        
        // Reset form
        setPaymentToken(null);
        setCustomerInfo({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phone: '555-123-4567',
          address: '123 Main Street',
          city: 'Bellevue',
          state: 'WA',
          zip: '98004',
          amount: '29.99',
          invoice: 'INV-' + Date.now(),
          description: 'AcceptUI v2 Test Transaction'
        });
      } else {
        setPaymentResponse(data);
        setShowResponseDetails(true);
        
        toast({
          title: "AcceptUI v2 Payment Failed",
          description: data.error || "Payment could not be processed",
          variant: "destructive"
        });
      }
      
    } catch (error: any) {
      console.error('AcceptUI v2 payment processing error:', error);
      
      const errorResponse = {
        success: false,
        error: error.message || "There was an error processing your payment. Please try again.",
        requestId: `acceptui_v2_error_${Date.now()}`,
        processing: {
          startTime: Date.now(),
          endTime: Date.now(),
          duration: 0,
          timestamp: new Date().toISOString()
        }
      };
      
      setPaymentResponse(errorResponse);
      setShowResponseDetails(true);
      
      toast({
        title: "AcceptUI v2 Processing Error",
        description: error.message || "There was an error processing your payment.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/5 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              AcceptUI v2 Testing
            </h1>
            <p className="text-muted-foreground">
              Enhanced AcceptJS implementation with improved UX and styling
            </p>
          </div>
          <div className="ml-auto">
            <Badge variant="secondary" className="gap-2">
              <Shield className="h-4 w-4" />
              v2/Accept.js
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
                Customer details for AcceptUI v2 transaction processing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email" 
                  type="email"
                  value={customerInfo.email}
                  onChange={(e) => handleCustomerInfoChange('email', e.target.value)}
                />
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
                  <Label htmlFor="amount">Amount ($)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={customerInfo.amount}
                    onChange={(e) => handleCustomerInfoChange('amount', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={customerInfo.address}
                  onChange={(e) => handleCustomerInfoChange('address', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={customerInfo.city}
                    onChange={(e) => handleCustomerInfoChange('city', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={customerInfo.state}
                    onChange={(e) => handleCustomerInfoChange('state', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip">ZIP Code</Label>
                  <Input
                    id="zip"
                    value={customerInfo.zip}
                    onChange={(e) => handleCustomerInfoChange('zip', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card className="shadow-card bg-gradient-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                AcceptUI v2 Payment Form
              </CardTitle>
              <CardDescription>
                Enhanced secure payment processing with improved styling
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form id="acceptUIV2PaymentForm" className="space-y-4">
                <input type="hidden" name="dataValue" id="dataValue" />
                <input type="hidden" name="dataDescriptor" id="dataDescriptor" />
                
                <div className="p-4 border border-muted rounded-lg bg-muted/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Payment Amount</h4>
                      <p className="text-2xl font-bold text-primary">${customerInfo.amount}</p>
                    </div>
                    <Badge variant="outline" className="gap-2">
                      <Shield className="h-4 w-4" />
                      Secure Lightbox
                    </Badge>
                  </div>
                </div>

                <div ref={buttonContainerRef} className="w-full">
                  {!authConfig || !isAcceptLoaded ? (
                    <Alert>
                      <AlertDescription>
                        {acceptError || 'Loading AcceptUI v2 configuration...'}
                      </AlertDescription>
                    </Alert>
                  ) : null}
                </div>
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
                  AcceptUI v2 Payment Token
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
                Enhanced token display with detailed information
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
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Data Descriptor</Label>
                      <Input
                        value={paymentToken.opaqueData?.dataDescriptor || ''}
                        readOnly
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Token Length</Label>
                      <Input
                        value={paymentToken.opaqueData?.dataValue?.length || 0}
                        readOnly
                        className="font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}
              
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  AcceptUI v2 payment token generated successfully with enhanced security features.
                </AlertDescription>
              </Alert>

              <Button
                onClick={processPayment}
                disabled={isProcessing}
                className="w-full shadow-button bg-gradient-primary"
                size="lg"
              >
                {isProcessing ? 'Processing AcceptUI v2 Payment...' : 'Process AcceptUI v2 Payment'}
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
            }}
          />
        )}

        {/* AcceptUI v2 Information */}
        <Card className="border-muted shadow-card">
          <CardHeader>
            <CardTitle>AcceptUI v2 Features</CardTitle>
            <CardDescription>
              Enhanced AcceptJS implementation with improved user experience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">Enhanced Features:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Dynamic authentication configuration</li>
                  <li>• Enhanced response processing with PaymentResponseDisplay</li>
                  <li>• Improved error handling and user feedback</li>
                  <li>• Modern gradient styling and animations</li>
                  <li>• Detailed token information display</li>
                  <li>• Processing timestamps and request tracking</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Test Information:</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>Uses: {authConfig?.environment?.jsUrl}/v1/Accept.js</div>
                  <div>Test Cards: 4111111111111111 (Visa)</div>
                  <div>Expiry: Any future date</div>
                  <div>CVV: Any 3-4 digits</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AcceptUIFormV2;