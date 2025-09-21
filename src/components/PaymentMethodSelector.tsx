import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Code, Globe, ArrowRight, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import PaymentForm from './PaymentForm';
import AcceptUIForm from './AcceptUIForm';
import AcceptUIFormV2 from './AcceptUIFormV2';
import SIMForm from './SIMForm';

const PaymentMethodSelector = () => {
  const { toast } = useToast();
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  if (selectedMethod === 'acceptjs') {
    return <PaymentForm onBack={() => setSelectedMethod(null)} />;
  }

  if (selectedMethod === 'acceptui-v2') {
    return <AcceptUIFormV2 onBack={() => setSelectedMethod(null)} />;
  }

  if (selectedMethod === 'acceptui-v3') {
    return <AcceptUIForm onBack={() => setSelectedMethod(null)} />;
  }

  if (selectedMethod === 'accepthosted') {
    // Accept Hosted requires backend integration - show message
    toast({
      title: "Backend Required",
      description: "Accept Hosted requires server-side integration. Connect to Supabase to implement this feature.",
      variant: "destructive"
    });
    setSelectedMethod(null);
    return null;
  }

  if (selectedMethod === 'sim') {
    return <SIMForm onBack={() => setSelectedMethod(null)} />;
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
        <Tabs defaultValue="comparison" className="w-full max-w-6xl">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="comparison">Compare Methods</TabsTrigger>
            <TabsTrigger value="acceptjs">AcceptJS Details</TabsTrigger>
            <TabsTrigger value="acceptui-v2">AcceptUI v2 Details</TabsTrigger>
            <TabsTrigger value="acceptui-v3">AcceptUI v3 Details</TabsTrigger>
            <TabsTrigger value="accepthosted">Accept Hosted Details</TabsTrigger>
            <TabsTrigger value="sim">SIM (Legacy) Details</TabsTrigger>
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
                    Accept UI v2
                    <Badge variant="outline">Enhanced AcceptJS</Badge>
                  </CardTitle>
                  <CardDescription>
                    Enhanced AcceptJS using v2/Accept.js with improved UX
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Key Features:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Enhanced AcceptJS tokenization</li>
                      <li>• Improved response processing</li>
                      <li>• Modern styling and animations</li>
                      <li>• Dynamic auth configuration</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Best For:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Improved AcceptJS experience</li>
                      <li>• Enhanced error handling</li>
                      <li>• Better response feedback</li>
                    </ul>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={() => setSelectedMethod('acceptui-v2')}
                    className="w-full"
                    variant="outline"
                  >
                    Test AcceptUI v2
                  </Button>
                </CardFooter>
              </Card>

              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Accept UI v3
                    <Badge variant="outline">Experimental</Badge>
                  </CardTitle>
                  <CardDescription>
                    Testing v3/AcceptUI.js library with API research
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Key Features:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• v3/AcceptUI.js library testing</li>
                      <li>• API method discovery</li>
                      <li>• Experimental implementation</li>
                      <li>• Enhanced response processing</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Best For:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• API research and testing</li>
                      <li>• v3 library exploration</li>
                      <li>• Method compatibility testing</li>
                    </ul>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={() => setSelectedMethod('acceptui-v3')}
                    className="w-full"
                    variant="outline"
                  >
                    Test AcceptUI v3
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
                    disabled
                  >
                    Requires Backend
                  </Button>
                </CardFooter>
              </Card>

              <Card className="border-muted/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    SIM (Legacy)
                    <Badge variant="destructive">Deprecated</Badge>
                  </CardTitle>
                  <CardDescription>
                    Server Integration Method - Direct form submission
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Key Features:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Simple HTML forms</li>
                      <li>• No JavaScript required</li>
                      <li>• Direct submission</li>
                      <li>• Basic implementation</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Migration Path:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Upgrade to AcceptJS</li>
                      <li>• Consider Accept Hosted</li>
                      <li>• Enhanced security benefits</li>
                    </ul>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={() => setSelectedMethod('sim')}
                    className="w-full"
                    variant="destructive"
                  >
                    Test SIM (Legacy)
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