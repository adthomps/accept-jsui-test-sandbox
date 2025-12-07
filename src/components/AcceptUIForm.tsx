import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Shield, CreditCard, User, Eye, EyeOff } from 'lucide-react';
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

interface AcceptUIFormProps {
  onBack: () => void;
}

const AcceptUIForm = ({ onBack }: AcceptUIFormProps) => {
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
    description: 'AcceptUI v3 Test Transaction'
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
  const acceptUIButtonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const loadAuthConfigAndAcceptUI = async () => {
      try {
        // Get auth configuration
        const configResponse = await fetch('https://pzzzcxspasbswpxzdqku.supabase.co/functions/v1/get-auth-config');
        const config = await configResponse.json();
        
        if (!config.success) {
          throw new Error(config.error || 'Failed to load authentication configuration');
        }
        
        setAuthConfig(config);

        // Remove existing script
        const existingScript = document.querySelector('script[src*="AcceptUI.js"]');
        if (existingScript) {
          existingScript.remove();
        }

        // Load AcceptUI v3
        const script = document.createElement('script');
        script.src = 'https://jstest.authorize.net/v3/AcceptUI.js';
        script.charset = 'utf-8';
        
        script.onload = () => {
          console.log('AcceptUI v3 loaded, window.Accept:', window.Accept);
          console.log('Available methods:', window.Accept ? Object.keys(window.Accept) : 'No Accept object');
          setIsAcceptLoaded(true);
          setAcceptError(null);
          
          toast({
            title: "AcceptUI v3 Ready",
            description: "v3/AcceptUI.js library loaded successfully",
          });
        };
        
        script.onerror = (error) => {
          console.error('Failed to load AcceptUI v3:', error);
          setAcceptError('Failed to load AcceptUI v3 library');
          setIsAcceptLoaded(false);
        };

        document.head.appendChild(script);
      } catch (error) {
        console.error('Error loading AcceptUI v3:', error);
        setAcceptError('Failed to initialize AcceptUI v3 system');
      }
    };

    loadAuthConfigAndAcceptUI();

    return () => {
      // Clean up script
      const script = document.querySelector('script[src*="AcceptUI.js"]');
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
    button.textContent = 'Open AcceptUI v3 Lightbox Payment';
    
    // Set AcceptUI data attributes
    button.setAttribute('data-billingAddressOptions', '{"show":true, "required":false}');
    button.setAttribute('data-apiLoginID', config.apiLoginId);
    button.setAttribute('data-clientKey', config.clientKey);
    button.setAttribute('data-acceptUIFormBtnTxt', 'Complete Payment');
    button.setAttribute('data-acceptUIFormHeaderTxt', 'Payment Information');
    button.setAttribute('data-paymentOptions', '{"showCreditCard": true, "showBankAccount": true}');
    button.setAttribute('data-responseHandler', 'acceptUIResponseHandler');
    
    buttonContainerRef.current.appendChild(button);
  };

  // Update button when config changes and AcceptUI is loaded
  useEffect(() => {
    if (authConfig && isAcceptLoaded && acceptUIButtonRef.current) {
      console.log('Setting AcceptUI v3 attributes...');
      const btn = acceptUIButtonRef.current;
      btn.setAttribute('data-billingAddressOptions', '{"show":true, "required":false}');
      btn.setAttribute('data-apiLoginID', authConfig.apiLoginId);
      btn.setAttribute('data-clientKey', authConfig.clientKey);
      btn.setAttribute('data-acceptUIFormBtnTxt', 'Complete Payment');
      btn.setAttribute('data-acceptUIFormHeaderTxt', 'Payment Information');
      btn.setAttribute('data-paymentOptions', '{"showCreditCard": true, "showBankAccount": true}');
      btn.setAttribute('data-responseHandler', 'acceptUIResponseHandler');
      
      console.log('AcceptUI v3 button attributes set:', {
        apiLoginID: authConfig.apiLoginId,
        clientKey: authConfig.clientKey,
        className: btn.className,
        attributes: btn.attributes
      });
      
      // Check available methods on window.Accept
      if (window.Accept) {
        console.log('AcceptUI v3 methods available:', Object.keys(window.Accept));
      } else {
        console.warn('AcceptUI v3 Accept object not available');
      }
    }
  }, [authConfig, isAcceptLoaded]);

  const handleCustomerInfoChange = (field: keyof CustomerInfo, value: string) => {
    setCustomerInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // AcceptUI v3 Response Handler - Global function for AcceptUI lightbox
  useEffect(() => {
    // Define global response handler for AcceptUI v3
    (window as any).acceptUIResponseHandler = (response: any) => {
      console.log('AcceptUI v3 lightbox response:', response);
      
      if (response.messages && response.messages.resultCode === "Error") {
        const errors = response.messages.message.map((msg: any) => `${msg.code}: ${msg.text}`).join(', ');
        toast({
          title: "AcceptUI v3 Payment Error",
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
          title: "AcceptUI v3 Payment Ready",
          description: "Payment information captured securely via lightbox",
        });
      } else {
        console.error('AcceptUI v3 - Unexpected response format:', response);
        toast({
          title: "AcceptUI v3 Response Error",
          description: "Unexpected response format from AcceptUI v3 lightbox",
          variant: "destructive",
        });
      }
    };

    // Cleanup
    return () => {
      delete (window as any).acceptUIResponseHandler;
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
      console.log('AcceptUI v3 - Processing payment with token');

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
          title: "AcceptUI v3 Payment Success",
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
          description: 'AcceptUI v3 Test Transaction'
        });
      } else {
        setPaymentResponse(data);
        setShowResponseDetails(true);
        
        toast({
          title: "AcceptUI v3 Payment Failed",
          description: data.error || "Payment could not be processed",
          variant: "destructive"
        });
      }
      
    } catch (error: any) {
      console.error('AcceptUI v3 payment processing error:', error);
      
      const errorResponse = {
        success: false,
        error: error.message || "There was an error processing your payment. Please try again.",
        requestId: `acceptui_v3_error_${Date.now()}`,
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
        title: "AcceptUI v3 Processing Error",
        description: error.message || "There was an error processing your payment.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
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
              AcceptUI Payment
            </h1>
            <p className="text-muted-foreground">
              Hosted modal lightbox for secure payment entry
            </p>
          </div>
          <div className="ml-auto flex gap-2">
            <Badge variant="secondary" className="gap-2">
              <Shield className="h-4 w-4" />
              SAQ-A
            </Badge>
            <Badge variant="outline" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Lightbox
            </Badge>
          </div>
        </div>

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
                <Badge variant="default" className="text-xs">AcceptUI Hosted Modal</Badge>
                <span className="text-xs text-muted-foreground">SAQ-A Compliant</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Payment form is rendered in a secure iframe modal hosted by Authorize.Net.
                Your page never handles or sees sensitive card data.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                <strong>Flow:</strong> Button Click → Authorize.Net Modal → Payment Token → Your Handler
              </p>
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs">Lightbox Integration</Badge>
                <span className="text-xs text-muted-foreground">v3/AcceptUI.js</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Uses data attributes on a button element to configure the payment modal.
                Response handler receives the payment nonce for server processing.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                <strong>Supports:</strong> Credit Cards, Debit Cards, eCheck/ACH, Billing Address Collection
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Customer Information */}
          <Card className="shadow-card bg-gradient-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Customer Information
              </CardTitle>
              <CardDescription>
                Customer details for AcceptUI v3 transaction processing
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

          {/* AcceptUI v3 Lightbox Payment */}
          <Card className="shadow-card bg-gradient-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                AcceptUI v3 Lightbox Payment
              </CardTitle>
              <CardDescription>
                Click button to open AcceptUI v3 lightbox for secure payment entry
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form id="acceptUIPaymentForm" className="space-y-4">
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

                 <div className="w-full">
                   {!authConfig ? (
                     <Alert>
                       <AlertDescription>
                         {acceptError || 'Loading AcceptUI v3 configuration...'}
                       </AlertDescription>
                     </Alert>
                   ) : (
                     <button
                       ref={acceptUIButtonRef}
                       type="button"
                       className="AcceptUI w-full h-12 bg-gradient-primary text-primary-foreground rounded-lg font-medium shadow-button hover:opacity-90 transition-opacity"
                       data-billingaddressoptions='{"show":true, "required":false}'
                       data-apiloginid={authConfig.apiLoginId}
                       data-clientkey={authConfig.clientKey}
                       data-acceptuiformbtntxt="Complete Payment"
                       data-acceptuiformheadertxt="Payment Information"
                       data-paymentoptions='{"showCreditCard": true, "showBankAccount": true}'
                       data-responsehandler="acceptUIResponseHandler"
                     >
                       Open AcceptUI v3 Lightbox Payment
                     </button>
                   )}
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
                  AcceptUI v3 Payment Token
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
                Payment token generated using v3 AcceptUI library
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
                      <Label>Message Code</Label>
                      <Input
                        value={(paymentToken.messages?.message?.map((m: any) => m.code).join(', ')) || ''}
                        readOnly
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Message</Label>
                      <Input
                        value={(paymentToken.messages?.message?.map((m: any) => m.text).join(' | ')) || ''}
                        readOnly
                        className="font-mono"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Data Type (Data Descriptor)</Label>
                    <Input
                      value={paymentToken.opaqueData?.dataDescriptor || ''}
                      readOnly
                      className="font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Nonce (Data Value)</Label>
                    <textarea
                      value={paymentToken.opaqueData?.dataValue || ''}
                      readOnly
                      className="w-full h-20 p-2 text-xs font-mono bg-muted border rounded-md resize-none"
                    />
                  </div>
                </div>
              )}
              
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  AcceptUI v3 payment token generated successfully.
                </AlertDescription>
              </Alert>

              <Button
                onClick={processPayment}
                disabled={isProcessing}
                className="w-full shadow-button bg-gradient-primary"
                size="lg"
              >
                {isProcessing ? 'Processing AcceptUI v3 Payment...' : 'Process AcceptUI v3 Payment'}
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
              <h4 className="font-medium mb-2">AcceptUI Integration</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div>Library: AcceptUI.js v3</div>
                <div>Method: Hosted lightbox modal</div>
                <div>PCI Scope: SAQ A</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AcceptUIForm;