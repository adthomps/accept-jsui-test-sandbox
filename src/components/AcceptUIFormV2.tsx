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
        const existingScript = document.querySelector('script[src*="Accept.js"]');
        if (existingScript) {
          existingScript.remove();
        }

        // Load AcceptUI v2
        const script = document.createElement('script');
        script.src = 'https://jstest.authorize.net/v2/AcceptUI.js';
        script.charset = 'utf-8';
        
        script.onload = () => {
          console.log('AcceptUI v2 loaded, window.Accept:', window.Accept);
          console.log('Available methods:', window.Accept ? Object.keys(window.Accept) : 'No Accept object');
          setIsAcceptLoaded(true);
          setAcceptError(null);
          
          toast({
            title: "AcceptUI v2 Ready",
            description: "v2/Accept.js library loaded successfully",
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

    loadAuthConfigAndAcceptUI();

    return () => {
      // Clean up script
      const script = document.querySelector('script[src*="Accept.js"]');
      if (script) {
        script.remove();
      }
      
      setIsAcceptLoaded(false);
      setAcceptError(null);
    };
  }, [toast]);

  // Update button when config changes and AcceptUI is loaded
  useEffect(() => {
    if (authConfig && isAcceptLoaded && acceptUIButtonRef.current) {
      console.log('Setting AcceptUI v2 attributes...');
      const btn = acceptUIButtonRef.current;
      btn.setAttribute('data-billingAddressOptions', '{"show":true, "required":false}');
      btn.setAttribute('data-apiLoginID', authConfig.apiLoginId);
      btn.setAttribute('data-clientKey', authConfig.clientKey);
      btn.setAttribute('data-acceptUIFormBtnTxt', 'Complete Payment');
      btn.setAttribute('data-acceptUIFormHeaderTxt', 'Payment Information');
      btn.setAttribute('data-paymentOptions', '{"showCreditCard": true, "showBankAccount": false}');
      btn.setAttribute('data-responseHandler', 'acceptUIV2ResponseHandler');
      
      console.log('AcceptUI v2 button attributes set:', {
        apiLoginID: authConfig.apiLoginId,
        clientKey: authConfig.clientKey,
        className: btn.className,
        attributes: btn.attributes
      });
      
      // Check available methods on window.Accept
      if (window.Accept) {
        console.log('AcceptUI v2 methods available:', Object.keys(window.Accept));
      } else {
        console.warn('AcceptUI v2 Accept object not available');
      }
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
              Testing v2/Accept.js library with lightbox functionality
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

          {/* AcceptUI v2 Lightbox Payment */}
          <Card className="shadow-card bg-gradient-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                AcceptUI v2 Lightbox Payment
              </CardTitle>
              <CardDescription>
                Click button to open AcceptUI v2 lightbox for secure payment entry
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
                    <div className="text-right text-sm text-muted-foreground">
                      <div>Transaction Type: Sale</div>
                      <div>Invoice: {customerInfo.invoice}</div>
                    </div>
                  </div>
                </div>

                 <div className="w-full">
                   {!authConfig ? (
                     <Alert>
                       <AlertDescription>
                         {acceptError || 'Loading AcceptUI v2 configuration...'}
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
                       data-paymentoptions='{"showCreditCard": true, "showBankAccount": false}'
                       data-responsehandler="acceptUIV2ResponseHandler"
                     >
                       Open AcceptUI v2 Lightbox Payment
                     </button>
                   )}
                 </div>
              </form>
              
              {paymentToken && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="gap-1">
                      <Shield className="h-3 w-3" />
                      Payment Token Ready
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setShowTokenDetails(!showTokenDetails)}
                    >
                      {showTokenDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  
                  {showTokenDetails && (
                    <div className="p-3 bg-muted/30 rounded border text-sm font-mono">
                      <div className="space-y-1">
                        <div><strong>Descriptor:</strong> {paymentToken.opaqueData?.dataDescriptor}</div>
                        <div><strong>Value:</strong> {paymentToken.opaqueData?.dataValue}</div>
                        <div><strong>Card:</strong> {paymentToken.encryptedCardData?.cardNumber || 'N/A'}</div>
                        <div><strong>Customer:</strong> {paymentToken.customerInformation?.firstName} {paymentToken.customerInformation?.lastName}</div>
                      </div>
                    </div>
                  )}
                  
                  <Button 
                    onClick={processPayment} 
                    disabled={isProcessing}
                    className="w-full"
                  >
                    {isProcessing ? 'Processing...' : 'Process Payment'}
                  </Button>
                </div>
              )}
              
              <div className="text-xs text-muted-foreground space-y-1">
                <div className="font-medium">AcceptUI v2 Implementation Details:</div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Uses jstest.authorize.net/v2/Accept.js library</li>
                  <li>• Lightbox payment form integration</li>
                  <li>• Secure tokenization of payment data</li>
                </ul>
              </div>
              
              <div className="mt-4 p-3 bg-accent/10 rounded-lg border">
                <div className="text-sm font-medium mb-2">AcceptUI v2 Status</div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>Library: jstest.authorize.net/v2/Accept.js</div>
                  <div>Method: window.Accept.dispatchData (if available)</div>
                  <div>Status: {isAcceptLoaded ? '✅ Loaded' : '⏳ Loading...'}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Response Display */}
        {paymentResponse && (
          <PaymentResponseDisplay 
            response={paymentResponse}
            onDismiss={() => setPaymentResponse(null)}
          />
        )}
      </div>
    </div>
  );
};

export default AcceptUIFormV2;