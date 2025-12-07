import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Code, Globe, ArrowRight, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import PaymentForm from './PaymentForm';
import AcceptUIForm from './AcceptUIForm';
import AcceptHostedForm from './AcceptHostedForm';
import AcceptCustomerForm from './AcceptCustomerForm';

const PaymentMethodSelector = () => {
  const { toast } = useToast();
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  if (selectedMethod === 'acceptjs') {
    return <PaymentForm onBack={() => setSelectedMethod(null)} />;
  }

  if (selectedMethod === 'acceptui') {
    return <AcceptUIForm onBack={() => setSelectedMethod(null)} />;
  }

  if (selectedMethod === 'accepthosted') {
    return <AcceptHostedForm onBack={() => setSelectedMethod(null)} />;
  }

  if (selectedMethod === 'acceptcustomer') {
    return <AcceptCustomerForm onBack={() => setSelectedMethod(null)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/5 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Authorize.Net Payment Testing
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Test different Authorize.Net integration methods for secure payment processing
          </p>
          <Badge variant="secondary" className="gap-2">
            <Shield className="h-4 w-4" />
            Sandbox Environment
          </Badge>
        </div>

        {/* Method Comparison */}
        <Tabs defaultValue="comparison" className="w-full max-w-6xl">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="comparison">Compare</TabsTrigger>
            <TabsTrigger value="acceptjs">AcceptJS</TabsTrigger>
            <TabsTrigger value="acceptui">AcceptUI</TabsTrigger>
            <TabsTrigger value="accepthosted">Accept Hosted</TabsTrigger>
            <TabsTrigger value="acceptcustomer">Accept Customer</TabsTrigger>
          </TabsList>

          <TabsContent value="comparison" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    AcceptJS
                    <Badge variant="secondary">Recommended</Badge>
                  </CardTitle>
                  <CardDescription>
                    Client-side tokenization for secure payment processing
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Key Features:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• PCI DSS compliant tokenization</li>
                      <li>• Complete control over form design</li>
                      <li>• Real-time validation</li>
                      <li>• Mobile-optimized</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Best For:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Custom checkout experiences</li>
                      <li>• E-commerce platforms</li>
                      <li>• Applications requiring design flexibility</li>
                    </ul>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={() => setSelectedMethod('acceptjs')}
                    className="w-full"
                  >
                    Test AcceptJS
                  </Button>
                </CardFooter>
              </Card>

              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    AcceptUI
                    <Badge variant="secondary">Hosted Forms</Badge>
                  </CardTitle>
                  <CardDescription>
                    Iframe-based hosted payment forms with complete PCI compliance
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Key Features:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Iframe-based hosted forms</li>
                      <li>• SAQ A PCI compliance</li>
                      <li>• Modal overlay UI</li>
                      <li>• Mobile optimized</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Best For:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Quick integration</li>
                      <li>• Minimal PCI scope</li>
                      <li>• Hosted payment UI</li>
                    </ul>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={() => setSelectedMethod('acceptui')}
                    className="w-full"
                    variant="outline"
                  >
                    Test AcceptUI
                  </Button>
                </CardFooter>
              </Card>

              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Accept Hosted
                    <Badge variant="outline">API-Driven</Badge>
                  </CardTitle>
                  <CardDescription>
                    Modern API-based hosted payment forms
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Key Features:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Server-side token generation</li>
                      <li>• Enhanced customization</li>
                      <li>• Webhook integration</li>
                      <li>• Advanced security</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Best For:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Enterprise applications</li>
                      <li>• Complex payment flows</li>
                      <li>• Advanced customization needs</li>
                    </ul>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={() => setSelectedMethod('accepthosted')}
                    className="w-full"
                    variant="outline"
                  >
                    Test Accept Hosted
                  </Button>
                </CardFooter>
              </Card>

              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Accept Customer
                    <Badge variant="secondary">CIM</Badge>
                  </CardTitle>
                  <CardDescription>
                    Customer Information Manager API for storing payment methods
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Key Features:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Store customer payment methods</li>
                      <li>• Tokenized payment profiles</li>
                      <li>• Recurring billing support</li>
                      <li>• PCI-compliant storage</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Best For:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Subscription services</li>
                      <li>• Repeat customers</li>
                      <li>• Saved payment methods</li>
                    </ul>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={() => setSelectedMethod('acceptcustomer')}
                    className="w-full"
                    variant="outline"
                  >
                    Test Accept Customer
                  </Button>
                </CardFooter>
              </Card>

            </div>
          </TabsContent>

          <TabsContent value="acceptjs" className="space-y-6">
            <Card className="shadow-card bg-gradient-card">
              <CardHeader>
                <CardTitle>AcceptJS Technical Details</CardTitle>
                <CardDescription>
                  Understanding the AcceptJS implementation and workflow
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Implementation Steps</h3>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                      <li>Load AcceptJS library from Authorize.Net</li>
                      <li>Create custom payment form</li>
                      <li>Collect payment data client-side</li>
                      <li>Generate secure payment token</li>
                      <li>Send token to your server for processing</li>
                    </ol>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-semibold">Security Features</h3>
                    <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                      <li>Client-side tokenization</li>
                      <li>No sensitive data on your servers</li>
                      <li>PCI DSS compliance assistance</li>
                      <li>Encrypted data transmission</li>
                    </ul>
                  </div>
                </div>
                
                <Button
                  onClick={() => setSelectedMethod('acceptjs')}
                  className="w-full shadow-button"
                >
                  Start AcceptJS Testing
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="acceptui" className="space-y-6">
            <Card className="shadow-card bg-gradient-card">
              <CardHeader>
                <CardTitle>AcceptUI Technical Details</CardTitle>
                <CardDescription>
                  Understanding the AcceptUI hosted form implementation and workflow
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Implementation Steps</h3>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                      <li>Load AcceptUI v3 library from Authorize.Net</li>
                      <li>Create button with AcceptUI class</li>
                      <li>Configure data attributes for form</li>
                      <li>Handle response in callback function</li>
                      <li>Process token on your server</li>
                    </ol>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-semibold">Security Features</h3>
                    <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                      <li>Iframe-based hosted forms</li>
                      <li>SAQ A PCI compliance</li>
                      <li>No sensitive data handling</li>
                      <li>Modal overlay interface</li>
                    </ul>
                  </div>
                </div>
                
                <Button
                  onClick={() => setSelectedMethod('acceptui')}
                  className="w-full shadow-button"
                >
                  Start AcceptUI Testing
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="accepthosted" className="space-y-6">
            <Card className="shadow-card bg-gradient-card">
              <CardHeader>
                <CardTitle>Accept Hosted Technical Details</CardTitle>
                <CardDescription>
                  Understanding the Accept Hosted Payment implementation and workflow
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Implementation Steps</h3>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                      <li>Generate payment token via server API</li>
                      <li>Redirect customer to Authorize.Net hosted page</li>
                      <li>Customer completes payment on secure form</li>
                      <li>Authorize.Net processes transaction</li>
                      <li>Customer redirected back with results</li>
                    </ol>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-semibold">Security Features</h3>
                    <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                      <li>Fully hosted payment pages</li>
                      <li>PCI DSS Level 1 compliant</li>
                      <li>Customer profile management</li>
                      <li>Webhook integration support</li>
                    </ul>
                  </div>
                </div>
                
                <Button
                  onClick={() => setSelectedMethod('accepthosted')}
                  className="w-full shadow-button"
                >
                  Start Accept Hosted Testing
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="acceptcustomer" className="space-y-6">
            <Card className="shadow-card bg-gradient-card">
              <CardHeader>
                <CardTitle>Accept Customer (CIM) Technical Details</CardTitle>
                <CardDescription>
                  Understanding the Customer Information Manager implementation and workflow
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Implementation Steps</h3>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                      <li>Create customer profile via CIM API</li>
                      <li>Store payment methods securely</li>
                      <li>Use hosted forms for profile management</li>
                      <li>Charge saved payment profiles</li>
                      <li>Manage shipping addresses</li>
                    </ol>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-semibold">Security Features</h3>
                    <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                      <li>PCI-compliant token storage</li>
                      <li>Hosted profile management pages</li>
                      <li>No card data on your servers</li>
                      <li>Secure recurring billing</li>
                    </ul>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Available Operations</h3>
                    <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                      <li>Create Profile (Direct API)</li>
                      <li>Get Profile (Direct API)</li>
                      <li>Manage Profile (Hosted Form)</li>
                      <li>Add/Edit Payment Methods (Hosted Form)</li>
                      <li>Charge Profile (Direct API)</li>
                    </ul>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-semibold">Best Use Cases</h3>
                    <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                      <li>Subscription billing</li>
                      <li>Returning customer payments</li>
                      <li>Saved payment methods</li>
                      <li>Multi-payment profile customers</li>
                    </ul>
                  </div>
                </div>
                
                <Button
                  onClick={() => setSelectedMethod('acceptcustomer')}
                  className="w-full shadow-button"
                >
                  Start Accept Customer Testing
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Additional Information */}
        <Card className="shadow-card bg-gradient-card">
          <CardHeader>
            <CardTitle>Testing Information</CardTitle>
            <CardDescription>
              Important notes for testing both integration methods
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="font-semibold">Test Credentials Needed</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>API Login ID (for all methods)</li>
                  <li>Client Key (AcceptJS & AcceptUI)</li>
                  <li>Transaction Key (server-side processing)</li>
                  <li>Sandbox account from Authorize.Net</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold">Test Credit Cards</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Visa: 4111111111111111</li>
                  <li>Mastercard: 5555555555554444</li>
                  <li>American Express: 378282246310005</li>
                  <li>Any future expiry date and CVV</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentMethodSelector;