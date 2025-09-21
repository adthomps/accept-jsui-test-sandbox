import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Code, Globe, ArrowRight, CheckCircle } from 'lucide-react';
import PaymentForm from './PaymentForm';
import AcceptUIForm from './AcceptUIForm';

const PaymentMethodSelector = () => {
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  if (selectedMethod === 'acceptjs') {
    return (
      <div>
        <div className="fixed top-4 left-4 z-10">
          <Button 
            variant="outline" 
            onClick={() => setSelectedMethod(null)}
            className="bg-background/80 backdrop-blur-sm"
          >
            ← Back to Selection
          </Button>
        </div>
        <PaymentForm />
      </div>
    );
  }

  if (selectedMethod === 'acceptui') {
    return (
      <div>
        <div className="fixed top-4 left-4 z-10">
          <Button 
            variant="outline" 
            onClick={() => setSelectedMethod(null)}
            className="bg-background/80 backdrop-blur-sm"
          >
            ← Back to Selection
          </Button>
        </div>
        <AcceptUIForm />
      </div>
    );
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
            Choose between AcceptJS and AcceptUI integration methods to test secure payment processing
          </p>
          <Badge variant="secondary" className="gap-2">
            <Shield className="h-4 w-4" />
            Sandbox Environment
          </Badge>
        </div>

        {/* Method Comparison */}
        <Tabs defaultValue="comparison" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="comparison">Compare Methods</TabsTrigger>
            <TabsTrigger value="acceptjs">AcceptJS Details</TabsTrigger>
            <TabsTrigger value="acceptui">AcceptUI Details</TabsTrigger>
          </TabsList>

          <TabsContent value="comparison" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* AcceptJS Card */}
              <Card className="shadow-card bg-gradient-card relative overflow-hidden">
                <div className="absolute top-4 right-4">
                  <Badge className="bg-primary text-primary-foreground gap-2">
                    <Code className="h-3 w-3" />
                    Developer Friendly
                  </Badge>
                </div>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-6 w-6 text-primary" />
                    AcceptJS Integration
                  </CardTitle>
                  <CardDescription>
                    JavaScript library for tokenizing payment data on your own forms
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <h4 className="font-semibold flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-success" />
                        Key Features
                      </h4>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>• Custom payment form design</li>
                        <li>• Client-side tokenization</li>
                        <li>• Real-time validation</li>
                        <li>• Token inspection for testing</li>
                        <li>• Full UI control</li>
                      </ul>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-semibold">Best For:</h4>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>• Custom branded checkout flows</li>
                        <li>• Complex form requirements</li>
                        <li>• Advanced validation needs</li>
                        <li>• Developer-controlled experience</li>
                      </ul>
                    </div>
                  </div>

                  <Button
                    onClick={() => setSelectedMethod('acceptjs')}
                    className="w-full shadow-button"
                    size="lg"
                  >
                    Test AcceptJS Integration
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>

              {/* AcceptUI Card */}
              <Card className="shadow-card bg-gradient-card relative overflow-hidden">
                <div className="absolute top-4 right-4">
                  <Badge className="bg-accent text-accent-foreground gap-2">
                    <Shield className="h-3 w-3" />
                    Maximum Security
                  </Badge>
                </div>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-6 w-6 text-accent" />
                    AcceptUI Integration
                  </CardTitle>
                  <CardDescription>
                    Hosted payment forms for maximum security and PCI compliance
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <h4 className="font-semibold flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-success" />
                        Key Features
                      </h4>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>• Hosted by Authorize.Net</li>
                        <li>• Zero PCI scope</li>
                        <li>• Multiple integration methods</li>
                        <li>• Built-in fraud protection</li>
                        <li>• Automatic updates</li>
                      </ul>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-semibold">Best For:</h4>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>• Quick implementation</li>
                        <li>• Maximum security requirements</li>
                        <li>• Reduced compliance burden</li>
                        <li>• Standard checkout flows</li>
                      </ul>
                    </div>
                  </div>

                  <Button
                    onClick={() => setSelectedMethod('acceptui')}
                    className="w-full shadow-button bg-gradient-primary"
                    size="lg"
                  >
                    Test AcceptUI Integration
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
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
                  Understanding the AcceptUI hosted form options and integration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Redirect Method</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      <li>Full page redirect</li>
                      <li>Authorize.Net handles everything</li>
                      <li>Customer returns after payment</li>
                      <li>Highest security level</li>
                    </ul>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-semibold">Embedded Method</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      <li>Iframe within your page</li>
                      <li>Seamless user experience</li>
                      <li>Maintain brand consistency</li>
                      <li>Still fully PCI compliant</li>
                    </ul>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-semibold">Lightbox Method</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      <li>Modal popup overlay</li>
                      <li>Modern user interface</li>
                      <li>Quick checkout flow</li>
                      <li>Mobile optimized</li>
                    </ul>
                  </div>
                </div>
                
                <Button
                  onClick={() => setSelectedMethod('acceptui')}
                  className="w-full shadow-button bg-gradient-primary"
                >
                  Start AcceptUI Testing
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
                  <li>API Login ID (for both methods)</li>
                  <li>Transaction Key (AcceptUI)</li>
                  <li>Client Key (AcceptJS)</li>
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