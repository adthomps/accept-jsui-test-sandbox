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
                  Client-side tokenization for custom payment form integration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Implementation Steps</h3>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                      <li>Load Accept.js library from Authorize.Net CDN</li>
                      <li>Create custom payment form with your design</li>
                      <li>Collect card/bank data in browser</li>
                      <li>Call Accept.dispatchData() to tokenize</li>
                      <li>Send payment nonce to your server</li>
                      <li>Process transaction via Authorize.Net API</li>
                    </ol>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-semibold">Security Features</h3>
                    <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                      <li>Client-side tokenization (SAQ A-EP)</li>
                      <li>No sensitive data on your servers</li>
                      <li>TLS encrypted transmission</li>
                      <li>One-time use payment nonces</li>
                      <li>PCI DSS compliance assistance</li>
                    </ul>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Available Options</h3>
                    <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                      <li>Credit/Debit card payments</li>
                      <li>eCheck/ACH bank transfers</li>
                      <li>Custom form styling</li>
                      <li>Real-time validation</li>
                      <li>Mobile-optimized forms</li>
                    </ul>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-semibold">Best Use Cases</h3>
                    <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                      <li>Custom branded checkout</li>
                      <li>E-commerce platforms</li>
                      <li>Single-page applications</li>
                      <li>Mobile web payments</li>
                      <li>Design flexibility required</li>
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
                  Hosted modal lightbox for quick and secure payment integration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Implementation Steps</h3>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                      <li>Load AcceptUI.js library from Authorize.Net</li>
                      <li>Add button with AcceptUI class</li>
                      <li>Configure data attributes on button</li>
                      <li>User clicks to open lightbox modal</li>
                      <li>Handle response in callback function</li>
                      <li>Process payment nonce on server</li>
                    </ol>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-semibold">Security Features</h3>
                    <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                      <li>Iframe-based hosted forms (SAQ-A)</li>
                      <li>No card data touches your page</li>
                      <li>Authorize.Net hosted UI</li>
                      <li>Secure modal overlay</li>
                      <li>Automatic PCI compliance</li>
                    </ul>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Available Options</h3>
                    <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                      <li>Credit/Debit card payments</li>
                      <li>eCheck/ACH bank transfers</li>
                      <li>Billing address collection</li>
                      <li>Customizable button text</li>
                      <li>Response handler callbacks</li>
                    </ul>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-semibold">Best Use Cases</h3>
                    <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                      <li>Quick integration needed</li>
                      <li>Minimal PCI scope required</li>
                      <li>Standard payment forms</li>
                      <li>Low development resources</li>
                      <li>Hosted UI acceptable</li>
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
                  Full-page hosted payment with customer profile support
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Implementation Steps</h3>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                      <li>Server generates hosted payment token</li>
                      <li>Redirect customer to Authorize.Net</li>
                      <li>Customer completes payment on hosted page</li>
                      <li>Authorize.Net processes transaction</li>
                      <li>Customer redirected to return URL</li>
                      <li>Webhook confirms transaction status</li>
                    </ol>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-semibold">Security Features</h3>
                    <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                      <li>Fully hosted payment page (SAQ-A)</li>
                      <li>PCI DSS Level 1 compliant</li>
                      <li>No payment data on your site</li>
                      <li>Webhook transaction verification</li>
                      <li>Customer profile encryption</li>
                    </ul>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Available Options</h3>
                    <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                      <li>One-time payments</li>
                      <li>Customer profile creation</li>
                      <li>Returning customer support</li>
                      <li>Save payment for future use</li>
                      <li>Customizable hosted page</li>
                    </ul>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-semibold">Best Use Cases</h3>
                    <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                      <li>Enterprise applications</li>
                      <li>Complex payment flows</li>
                      <li>Returning customer payments</li>
                      <li>Maximum security required</li>
                      <li>Webhook-driven architecture</li>
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
                  Customer Information Manager for stored payment profiles
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Implementation Steps</h3>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                      <li>Create customer profile via CIM API</li>
                      <li>Add payment methods via hosted forms</li>
                      <li>Store tokenized payment profiles</li>
                      <li>Charge profiles with stored tokens</li>
                      <li>Manage profiles via hosted pages</li>
                      <li>Handle recurring/repeat payments</li>
                    </ol>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-semibold">Security Features</h3>
                    <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                      <li>PCI-compliant token storage</li>
                      <li>Hosted profile management (SAQ-A)</li>
                      <li>No card data on your servers</li>
                      <li>Tokenized payment references</li>
                      <li>Secure recurring billing</li>
                    </ul>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Available Options</h3>
                    <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                      <li>Create Profile (Direct API)</li>
                      <li>Get Profile (Direct API)</li>
                      <li>Manage Profile (Hosted Form)</li>
                      <li>Add/Edit Payment Methods</li>
                      <li>Charge Profile (Direct API)</li>
                    </ul>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-semibold">Best Use Cases</h3>
                    <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                      <li>Subscription billing</li>
                      <li>Returning customer payments</li>
                      <li>Saved payment methods</li>
                      <li>Multi-card customer accounts</li>
                      <li>Recurring payment systems</li>
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
      </div>
    </div>
  );
};

export default PaymentMethodSelector;