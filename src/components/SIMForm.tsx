import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, CreditCard, User, MapPin, ExternalLink, Globe, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  invoiceNumber: string;
  description: string;
}

interface SIMFormProps {
  onBack: () => void;
}

const SIMForm = ({ onBack }: SIMFormProps) => {
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
    amount: '',
    invoiceNumber: '',
    description: ''
  });

  const handleCustomerInfoChange = (field: keyof CustomerInfo, value: string) => {
    setCustomerInfo(prev => ({ ...prev, [field]: value }));
  };

  const generateAcceptUIUrl = () => {
    if (!customerInfo.amount || parseFloat(customerInfo.amount) <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid payment amount.",
        variant: "destructive"
      });
      return;
    }

    // AcceptUI parameters for hosted payment form
    const acceptUIParams = {
      // Replace these with your actual Authorize.Net credentials
      apiLoginId: 'YOUR_API_LOGIN_ID',
      transactionKey: 'YOUR_TRANSACTION_KEY',
      
      // Transaction details
      amount: customerInfo.amount,
      invoiceNumber: customerInfo.invoiceNumber || `INV-${Date.now()}`,
      description: customerInfo.description || 'Payment Transaction',
      
      // Customer information
      firstName: customerInfo.firstName,
      lastName: customerInfo.lastName,
      email: customerInfo.email,
      phone: customerInfo.phone,
      address: customerInfo.address,
      city: customerInfo.city,
      state: customerInfo.state,
      zip: customerInfo.zip,
      
      // AcceptUI specific parameters
      acceptUIFormBtnTxt: 'Pay Now',
      acceptUIFormHeaderTxt: 'Secure Payment',
      showReceipt: 'true',
      relayResponseURL: window.location.origin + '/payment-response', // Your response handler
      
      // Test environment
      testMode: 'true'
    };

    // Create form data for POST to AcceptUI
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = 'https://test.authorize.net/gateway/transact.dll'; // Test URL
    form.target = '_blank';

    // Add all parameters as hidden inputs
    Object.entries(acceptUIParams).forEach(([key, value]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = value.toString();
      form.appendChild(input);
    });

    // Add required AcceptUI type parameter
    const typeInput = document.createElement('input');
    typeInput.type = 'hidden';
    typeInput.name = 'type';
    typeInput.value = 'AUTH_CAPTURE';
    form.appendChild(typeInput);

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);

    toast({
      title: "Redirecting to AcceptUI",
      description: "Opening Authorize.Net hosted payment form in a new tab.",
      variant: "default"
    });
  };

  const openAcceptUIHosted = () => {
    // Alternative: Direct iframe embedding approach
    const hostedFormUrl = `https://test.authorize.net/payment/payment`;
    
    // In a real implementation, you would:
    // 1. Create a transaction on your server
    // 2. Get a form token from Authorize.Net
    // 3. Use that token to embed the hosted form
    
    toast({
      title: "AcceptUI Hosted Form",
      description: "In production, this would embed the hosted payment form directly on your page.",
      variant: "default"
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-4">
            <Button variant="outline" size="icon" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Globe className="h-8 w-8 text-accent" />
              <h1 className="text-3xl font-bold text-foreground">
                SIM (Legacy) Payment Integration
              </h1>
            </div>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Process payments using Authorize.Net's legacy SIM method for direct form submission
          </p>
          <div className="flex justify-center gap-2">
            <Badge variant="secondary" className="gap-2">
              <Shield className="h-4 w-4" />
              PCI Compliant
            </Badge>
            <Badge variant="outline" className="gap-2">
              <Globe className="h-4 w-4" />
              Hosted Solution
            </Badge>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Customer Information */}
          <Card className="shadow-card bg-gradient-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Customer & Transaction Details
              </CardTitle>
              <CardDescription>
                Enter customer and transaction information for AcceptUI processing
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
            </CardContent>
          </Card>

          {/* Transaction Information */}
          <Card className="shadow-card bg-gradient-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-accent" />
                Transaction Information
              </CardTitle>
              <CardDescription>
                Configure payment details for the AcceptUI hosted form
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="amount">Payment Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="99.99"
                  value={customerInfo.amount}
                  onChange={(e) => handleCustomerInfoChange('amount', e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="invoiceNumber">Invoice Number</Label>
                <Input
                  id="invoiceNumber"
                  placeholder="INV-001 (auto-generated if empty)"
                  value={customerInfo.invoiceNumber}
                  onChange={(e) => handleCustomerInfoChange('invoiceNumber', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Payment for services"
                  value={customerInfo.description}
                  onChange={(e) => handleCustomerInfoChange('description', e.target.value)}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    AcceptUI provides maximum security by hosting the payment form on Authorize.Net's servers, ensuring PCI compliance without handling sensitive payment data.
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <Button
                    onClick={generateAcceptUIUrl}
                    className="w-full shadow-button bg-gradient-primary"
                    size="lg"
                    disabled={!customerInfo.amount}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Launch AcceptUI Payment Form
                  </Button>
                  
                  <Button
                    onClick={openAcceptUIHosted}
                    variant="outline"
                    className="w-full"
                    size="lg"
                  >
                    <Globe className="mr-2 h-4 w-4" />
                    Demo: Embedded Hosted Form
                  </Button>
                </div>

                <div className="text-sm text-muted-foreground space-y-2">
                  <p><strong>AcceptUI Options:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Hosted Payment Form (redirects to Authorize.Net)</li>
                    <li>Embedded iframe (hosted form within your page)</li>
                    <li>Lightbox popup (overlay modal)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Integration Methods */}
        <Card className="shadow-card bg-gradient-card">
          <CardHeader>
            <CardTitle>AcceptUI Integration Methods</CardTitle>
            <CardDescription>
              Choose the integration method that best fits your application needs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <Badge className="bg-accent text-accent-foreground">Redirect Method</Badge>
                <h3 className="font-semibold">Full Page Redirect</h3>
                <p className="text-sm text-muted-foreground">
                  Customer is redirected to Authorize.Net's secure payment page and returns to your site after payment.
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside">
                  <li>Highest security</li>
                  <li>PCI compliance</li>
                  <li>Mobile optimized</li>
                </ul>
              </div>

              <div className="space-y-3">
                <Badge variant="outline">Embedded Method</Badge>
                <h3 className="font-semibold">Iframe Embedding</h3>
                <p className="text-sm text-muted-foreground">
                  Payment form is embedded directly into your page using a secure iframe.
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside">
                  <li>Seamless UX</li>
                  <li>Brand consistency</li>
                  <li>Still PCI compliant</li>
                </ul>
              </div>

              <div className="space-y-3">
                <Badge variant="secondary">Lightbox Method</Badge>
                <h3 className="font-semibold">Modal Overlay</h3>
                <p className="text-sm text-muted-foreground">
                  Payment form appears as a modal overlay on your current page.
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside">
                  <li>Modern UI</li>
                  <li>Quick checkout</li>
                  <li>Mobile friendly</li>
                </ul>
              </div>
            </div>

            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>Setup Required:</strong> Replace YOUR_API_LOGIN_ID and YOUR_TRANSACTION_KEY with your actual Authorize.Net sandbox credentials. For production, change the form action URL to https://secure2.authorize.net/gateway/transact.dll
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SIMForm;