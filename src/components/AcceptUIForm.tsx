import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';

declare global {
  interface Window {
    Accept: {
      render: (options: any, target: string) => void;
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
    description: 'Test transaction for Accept UI'
  });
  const [isAcceptLoaded, setIsAcceptLoaded] = useState(false);
  const [hostedFieldsRendered, setHostedFieldsRendered] = useState(false);

  useEffect(() => {
    const loadAcceptJS = () => {
      // Clean up any existing script
      const existingScript = document.querySelector('script[src*="authorize.net"]');
      if (existingScript) {
        existingScript.remove();
      }

      const script = document.createElement('script');
      script.src = 'https://jstest.authorize.net/v3/AcceptUI.js';
      script.charset = 'utf-8';
      script.onload = () => {
        // Give it a moment to initialize
        setTimeout(() => {
          setIsAcceptLoaded(true);
          console.log('AcceptUI loaded, window.Accept:', window.Accept);
          toast({
            title: "AcceptUI Loaded",
            description: "Ready to render hosted form elements",
          });
        }, 100);
      };
      script.onerror = () => {
        toast({
          title: "Error",
          description: "Failed to load AcceptUI library",
          variant: "destructive",
        });
      };

      document.head.appendChild(script);
    };

    loadAcceptJS();
  }, [toast]);

  const handleCustomerInfoChange = (field: keyof CustomerInfo, value: string) => {
    setCustomerInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const renderHostedFields = () => {
    if (!isAcceptLoaded || hostedFieldsRendered) return;

    try {
      console.log('Attempting to render hosted fields, Accept object:', window.Accept);
      
      if (!window.Accept || typeof window.Accept.render !== 'function') {
        throw new Error('Accept.render method not available');
      }

      // Test credentials for sandbox
      const authData = {
        clientKey: "5FcB6WrfHGS76gHW3v7btBCE3HuuBuke9Pj96Ztfn5R32G5ep42vne7MCWp5LnN6",
        apiLoginID: "5KP3u95bQpv"
      };

      const hostedFieldOptions = {
        authData: authData,
        containerIds: {
          cardNumber: "cardNumber",
          expirationDate: "expirationDate", 
          cardCode: "cardCode"
        },
        acceptUIFormBtnTxt: "Submit",
        acceptUIFormHeaderTxt: "Card Information",
        paymentOptions: {
          showCreditCard: true,
          showBankAccount: false
        },
        style: {
          base: {
            color: '#000',
            fontSize: '15px',
            fontFamily: 'helvetica, tahoma, calibri, sans-serif',
            fontSmoothing: 'antialiased',
            focus: {
              color: '#424770',
            },
            '::placeholder': {
              color: '#9BACC8',
            },
          },
          invalid: {
            color: '#9e2146',
          }
        }
      };

      console.log('Rendering with options:', hostedFieldOptions);
      window.Accept.render(hostedFieldOptions, "acceptUIContainer");
      setHostedFieldsRendered(true);
      
      toast({
        title: "Hosted Fields Rendered",
        description: "Accept UI hosted form elements are now active",
      });
    } catch (error) {
      console.error('Error rendering hosted fields:', error);
      toast({
        title: "Error", 
        description: `Failed to render hosted form elements: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!window.Accept) {
      toast({
        title: "Error",
        description: "Accept.js is not loaded",
        variant: "destructive",
      });
      return;
    }

    const paymentForm = {
      cardData: {
        // The hosted fields will automatically populate this
      },
      authData: {
        clientKey: "5FcB6WrfHGS76gHW3v7btBCE3HuuBuke9Pj96Ztfn5R32G5ep42vne7MCWp5LnN6",
        apiLoginID: "5KP3u95bQpv"
      }
    };

    window.Accept.dispatchData(paymentForm, (response: any) => {
      if (response.messages.resultCode === "Error") {
        const errors = response.messages.message.map((msg: any) => msg.text).join(', ');
        toast({
          title: "Payment Token Error",
          description: errors,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Payment Token Generated",
          description: `Token: ${response.opaqueData.dataDescriptor}`,
        });
        console.log('Payment Token Response:', response);
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Accept UI Testing</h1>
            <p className="text-muted-foreground">
              Test AcceptJS hosted form elements within custom forms
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
              <CardDescription>
                Enter customer details for the transaction
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

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={customerInfo.phone}
                  onChange={(e) => handleCustomerInfoChange('phone', e.target.value)}
                />
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

          {/* Transaction Details */}
          <Card>
            <CardHeader>
              <CardTitle>Transaction Details</CardTitle>
              <CardDescription>
                Configure transaction amount and description
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                <Label htmlFor="invoice">Invoice Number</Label>
                <Input
                  id="invoice"
                  value={customerInfo.invoice}
                  onChange={(e) => handleCustomerInfoChange('invoice', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={customerInfo.description}
                  onChange={(e) => handleCustomerInfoChange('description', e.target.value)}
                />
              </div>

              <div className="pt-4">
                <Button 
                  onClick={renderHostedFields}
                  disabled={!isAcceptLoaded || hostedFieldsRendered}
                  className="w-full"
                >
                  {hostedFieldsRendered ? 'Hosted Fields Ready' : 'Render Hosted Fields'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Accept UI Hosted Form Elements */}
        {isAcceptLoaded && (
          <Card>
            <CardHeader>
              <CardTitle>Accept UI Hosted Payment Form</CardTitle>
              <CardDescription>
                Secure hosted form elements powered by AcceptJS
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <div id="acceptUIContainer">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Card Number</Label>
                      <div id="cardNumber" className="border rounded-md p-3 bg-background min-h-[44px]"></div>
                    </div>
                    <div className="space-y-2">
                      <Label>Expiration Date</Label>
                      <div id="expirationDate" className="border rounded-md p-3 bg-background min-h-[44px]"></div>
                    </div>
                    <div className="space-y-2">
                      <Label>CVV</Label>
                      <div id="cardCode" className="border rounded-md p-3 bg-background min-h-[44px]"></div>
                    </div>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={!hostedFieldsRendered}
                  className="w-full"
                >
                  Generate Payment Token
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Testing Information */}
        <Card className="border-muted">
          <CardHeader>
            <CardTitle>Accept UI Testing Information</CardTitle>
            <CardDescription>
              Essential information for testing Accept UI hosted forms
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Test Credentials (Sandbox):</h4>
              <div className="bg-muted p-3 rounded text-sm font-mono">
                <div>API Login ID: 5KP3u95bQpv</div>
                <div>Client Key: 5FcB6WrfHGS76gHW3v7btBCE3HuuBuke9Pj96Ztfn5R32G5ep42vne7MCWp5LnN6</div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Test Credit Card Numbers:</h4>
              <div className="bg-muted p-3 rounded text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>Visa: 4111111111111111</div>
                  <div>MasterCard: 5555555555554444</div>
                  <div>American Express: 378282246310005</div>
                  <div>Discover: 6011111111111117</div>
                </div>
                <div className="mt-2 text-muted-foreground">
                  Use any future expiration date and any 3-4 digit CVV
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Accept UI Features:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Hosted form elements embedded in custom forms</li>
                <li>• AcceptJS tokenization with enhanced security</li>
                <li>• Customizable styling and validation</li>
                <li>• Reduced PCI compliance scope</li>
                <li>• Real-time field validation</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AcceptUIForm;