import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Code, Globe, ArrowRight, CheckCircle, ShieldCheck, ShieldAlert } from 'lucide-react';
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
              {/* AcceptJS Card */}
              <Card className="border-primary/20 flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 flex-wrap">
                    <span>AcceptJS</span>
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 gap-1 shrink-0">
                      <ShieldAlert className="h-3 w-3" />
                      SAQ A-EP
                    </Badge>
                  </CardTitle>
                  <div className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1 inline-block mt-2">
                    Card data enters your page (higher PCI scope)
                  </div>
                  <CardDescription className="mt-2">
                    Client-side tokenization with custom payment forms
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 flex-1">
                  <div>
                    <h4 className="font-medium mb-2">Display Methods:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-primary" />
                        Custom Form (your design)
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Key Features:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Client-side tokenization</li>
                      <li>• Full design control</li>
                      <li>• Credit card & eCheck</li>
                      <li>• Real-time validation</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Best For:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Custom branded checkout</li>
                      <li>• Maximum design flexibility</li>
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

              {/* AcceptUI Card */}
              <Card className="border-primary/20 flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 flex-wrap">
                    <span>AcceptUI</span>
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 gap-1 shrink-0">
                      <ShieldCheck className="h-3 w-3" />
                      SAQ-A
                    </Badge>
                  </CardTitle>
                  <div className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1 inline-block mt-2">
                    No card data on your page (lowest PCI scope)
                  </div>
                  <CardDescription className="mt-2">
                    Hosted modal lightbox for quick integration
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 flex-1">
                  <div>
                    <h4 className="font-medium mb-2">Display Methods:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-primary" />
                        Lightbox Modal
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Key Features:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Iframe-based modal</li>
                      <li>• No card data on page</li>
                      <li>• Credit card & eCheck</li>
                      <li>• Billing address option</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Best For:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Quick integration</li>
                      <li>• Minimal PCI scope</li>
                    </ul>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={() => setSelectedMethod('acceptui')}
                    className="w-full"
                  >
                    Test AcceptUI
                  </Button>
                </CardFooter>
              </Card>

              {/* Accept Hosted Card */}
              <Card className="border-primary/20 flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 flex-wrap">
                    <span>Accept Hosted</span>
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 gap-1 shrink-0">
                      <ShieldCheck className="h-3 w-3" />
                      SAQ-A
                    </Badge>
                  </CardTitle>
                  <div className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1 inline-block mt-2">
                    No card data on your page (lowest PCI scope)
                  </div>
                  <CardDescription className="mt-2">
                    Flexible hosted payment with multiple display options
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 flex-1">
                  <div>
                    <h4 className="font-medium mb-2">Display Methods:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Full Page Redirect</li>
                      <li>• Lightbox (Popup)</li>
                      <li>• Embedded iFrame</li>
                      <li>• Customer profiles</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Best For:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Enterprise applications</li>
                      <li>• Multi-step checkouts</li>
                      <li>• Maximum security</li>
                      <li>• Flexible UX needs</li>
                    </ul>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={() => setSelectedMethod('accepthosted')}
                    className="w-full"
                  >
                    Test Accept Hosted
                  </Button>
                </CardFooter>
              </Card>

              {/* Accept Customer Card */}
              <Card className="border-primary/20 flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 flex-wrap">
                    <span>Accept Customer</span>
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 gap-1 shrink-0">
                      <ShieldCheck className="h-3 w-3" />
                      SAQ-A
                    </Badge>
                  </CardTitle>
                  <div className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1 inline-block mt-2">
                    Hosted forms + Direct API for stored profiles
                  </div>
                  <CardDescription className="mt-2">
                    Stored payment profiles for recurring use
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 flex-1">
                  <div>
                    <h4 className="font-medium mb-2">Display Methods:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-primary" />
                        Hosted Profile Pages
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-primary" />
                        Direct API Calls
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Key Features:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Tokenized storage</li>
                      <li>• Multiple payment methods</li>
                      <li>• Hosted profile pages</li>
                      <li>• Direct API charging</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Best For:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Subscription billing</li>
                      <li>• Repeat customers</li>
                    </ul>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={() => setSelectedMethod('acceptcustomer')}
                    className="w-full"
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
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle>AcceptJS Technical Details</CardTitle>
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 gap-1">
                    <ShieldAlert className="h-3 w-3" />
                    SAQ A-EP
                  </Badge>
                </div>
                <CardDescription>
                  Client-side tokenization for custom payment form integration
                </CardDescription>
                <div className="mt-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    <strong>Higher PCI Scope:</strong> Card data enters your page before tokenization. 
                    Requires SAQ A-EP self-assessment questionnaire (22 questions).
                  </p>
                </div>
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

                {/* Integration Architecture */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Integration Architecture</h3>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <pre className="text-xs text-muted-foreground overflow-x-auto whitespace-pre-wrap">
{`// 1. Load Accept.js library
<script src="https://js.authorize.net/v1/Accept.js" />

// 2. Collect card data in your custom form
const cardData = {
  cardNumber: "4111111111111111",
  month: "12",
  year: "2025",
  cardCode: "123"
};

// 3. Build secure data object
const secureData = {
  authData: {
    clientKey: "YOUR_PUBLIC_CLIENT_KEY",
    apiLoginID: "YOUR_API_LOGIN_ID"
  },
  cardData: cardData
};

// 4. Dispatch to Authorize.Net for tokenization
Accept.dispatchData(secureData, responseHandler);

// 5. Handle response with payment nonce
function responseHandler(response) {
  if (response.messages.resultCode === "Ok") {
    const nonce = response.opaqueData.dataValue;
    // Send nonce to your server for processing
  }
}`}
                    </pre>
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
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle>AcceptUI Technical Details</CardTitle>
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 gap-1">
                    <ShieldCheck className="h-3 w-3" />
                    SAQ-A
                  </Badge>
                </div>
                <CardDescription>
                  Hosted modal lightbox for quick and secure payment integration
                </CardDescription>
                <div className="mt-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <p className="text-sm text-emerald-700 dark:text-emerald-400">
                    <strong>Lowest PCI Scope:</strong> Card data never touches your page. 
                    Only 22 questions in SAQ-A self-assessment.
                  </p>
                </div>
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

                {/* Integration Architecture */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Integration Architecture</h3>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <pre className="text-xs text-muted-foreground overflow-x-auto whitespace-pre-wrap">
{`// 1. Load AcceptUI.js library
<script src="https://js.authorize.net/v1/AcceptUI.js" />

// 2. Add payment button with data attributes
<button
  class="AcceptUI"
  data-billingAddressOptions='{"show":true,"required":false}'
  data-apiLoginID="YOUR_API_LOGIN_ID"
  data-clientKey="YOUR_PUBLIC_CLIENT_KEY"
  data-acceptUIFormBtnTxt="Submit"
  data-acceptUIFormHeaderTxt="Card Information"
  data-responseHandler="responseHandler"
>
  Pay Now
</button>

// 3. Handle response with payment nonce
function responseHandler(response) {
  if (response.messages.resultCode === "Ok") {
    const nonce = response.opaqueData.dataValue;
    const descriptor = response.opaqueData.dataDescriptor;
    // Send to your server for processing
  }
}`}
                    </pre>
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
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle>Accept Hosted Technical Details</CardTitle>
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 gap-1">
                    <ShieldCheck className="h-3 w-3" />
                    SAQ-A
                  </Badge>
                </div>
                <CardDescription>
                  Flexible hosted payment with multiple display methods and customer profile support
                </CardDescription>
                <div className="mt-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <p className="text-sm text-emerald-700 dark:text-emerald-400">
                    <strong>Lowest PCI Scope:</strong> All payment data collection happens on Authorize.Net's hosted pages. 
                    Simplest compliance with SAQ-A (22 questions).
                  </p>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Display Methods Section */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Display Methods</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <Card className="bg-muted/50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          Full Page Redirect
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm text-muted-foreground space-y-2">
                        <p>Customer leaves your site and completes payment on Authorize.Net's hosted page.</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Simplest implementation</li>
                          <li>No iFrame communication</li>
                          <li>Return URL for completion</li>
                          <li>Best for simple checkouts</li>
                        </ul>
                      </CardContent>
                    </Card>
                    <Card className="bg-muted/50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Code className="h-4 w-4" />
                          Lightbox (Popup)
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm text-muted-foreground space-y-2">
                        <p>Payment form appears as a modal overlay on your page using iFrame communication.</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Customer stays on your site</li>
                          <li>iFrameCommunicator required</li>
                          <li>Real-time status updates</li>
                          <li>Best for seamless UX</li>
                        </ul>
                      </CardContent>
                    </Card>
                    <Card className="bg-muted/50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Embedded iFrame
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm text-muted-foreground space-y-2">
                        <p>Payment form embedded directly within your page layout using an iFrame.</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Inline payment experience</li>
                          <li>iFrameCommunicator required</li>
                          <li>Custom page integration</li>
                          <li>Best for multi-step flows</li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Implementation Steps</h3>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                      <li>Server generates hosted payment token</li>
                      <li>Choose display method (redirect/lightbox/iFrame)</li>
                      <li>Configure iFrameCommunicator if using overlay</li>
                      <li>Customer completes payment on hosted form</li>
                      <li>Handle return/message based on display method</li>
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
                      <li>Full Page Redirect (simplest)</li>
                      <li>Lightbox Popup (overlay modal)</li>
                      <li>Embedded iFrame (inline form)</li>
                      <li>Customer profile creation</li>
                      <li>Returning customer support</li>
                    </ul>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-semibold">Best Use Cases</h3>
                    <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                      <li>Enterprise applications</li>
                      <li>Multi-step checkout flows</li>
                      <li>Returning customer payments</li>
                      <li>Maximum security required</li>
                      <li>Flexible display requirements</li>
                    </ul>
                  </div>
                </div>

                {/* Integration Architecture */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Integration Architecture</h3>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <pre className="text-xs text-muted-foreground overflow-x-auto whitespace-pre-wrap">
{`// 1. Server-side: Get hosted payment page token
const response = await fetch('/api/accept-hosted-token', {
  method: 'POST',
  body: JSON.stringify({
    amount: 19.99,
    customerInfo: { email, firstName, lastName, ... },
    createProfile: true  // Optional: save for future use
  })
});
const { token } = await response.json();

// 2. Display Method Options:

// A) Full Page Redirect
const form = document.createElement('form');
form.action = 'https://test.authorize.net/payment/payment';
form.method = 'POST';
// Add token input and submit

// B) Lightbox Popup
AuthorizeNetPopup.openPopup(token);

// C) Embedded iFrame
<iframe src="https://test.authorize.net/payment/payment"
        name="acceptPaymentFrame" />

// 3. Handle return via webhook or redirect URL`}
                    </pre>
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
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle>Accept Customer (CIM) Technical Details</CardTitle>
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 gap-1">
                    <ShieldCheck className="h-3 w-3" />
                    SAQ-A
                  </Badge>
                </div>
                <CardDescription>
                  Customer Information Manager for stored payment profiles
                </CardDescription>
                <div className="mt-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <p className="text-sm text-emerald-700 dark:text-emerald-400">
                    <strong>Lowest PCI Scope:</strong> Hosted forms for card collection, tokenized references for API calls. 
                    SAQ-A compliant for payment method management.
                  </p>
                </div>
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

                {/* Integration Architecture */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Integration Architecture</h3>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <pre className="text-xs text-muted-foreground overflow-x-auto whitespace-pre-wrap">
{`// 1. Create Customer Profile (Direct API)
POST /api/create-customer-profile
{ email, firstName, lastName, address, ... }
→ Returns: customerProfileId

// 2. Add Payment Methods (Hosted Form)
POST /api/get-hosted-profile-token
{ customerProfileId, pageType: "addPayment" }
→ Returns: token for hosted profile page

// 3. Display Method Options:
// A) Full Page Redirect
// B) Lightbox Popup (iFrameCommunicator)
// C) Embedded iFrame (iFrameCommunicator)

// 4. Get Profile Details (Direct API)
POST /api/get-customer-profile
{ customerProfileId }
→ Returns: paymentProfiles[], shippingAddresses[]

// 5. Charge Stored Profile (Direct API)
POST /api/charge-customer-profile
{ customerProfileId, paymentProfileId, amount }
→ Returns: transactionId, authCode`}
                    </pre>
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