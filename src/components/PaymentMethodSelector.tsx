import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, CheckCircle, ShieldCheck, ShieldAlert, Play, BookOpen } from 'lucide-react';
import PaymentForm from '@/components/PaymentForm';
import AcceptUIForm from '@/components/AcceptUIForm';
import AcceptHostedForm from '@/components/AcceptHostedForm';
import AcceptCustomerForm from '@/components/AcceptCustomerForm';
import MethodDetailPage from '@/components/MethodDetailPage';

type ViewMode = 'demo' | 'overview' | 'api' | null;

const PaymentMethodSelector = () => {
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(null);

  const handleBack = () => { setSelectedMethod(null); setViewMode(null); };
  const handleOverview = () => setViewMode('overview');
  const handleApi = () => setViewMode('api');
  const handleDemo = () => setViewMode('demo');

  // Demo views
  if (selectedMethod === 'acceptjs' && viewMode === 'demo') {
    return <PaymentForm onBack={handleBack} onOverview={handleOverview} onApi={handleApi} />;
  }

  if (selectedMethod === 'acceptui' && viewMode === 'demo') {
    return <AcceptUIForm onBack={handleBack} onOverview={handleOverview} onApi={handleApi} />;
  }

  if (selectedMethod === 'accepthosted' && viewMode === 'demo') {
    return <AcceptHostedForm onBack={handleBack} onOverview={handleOverview} onApi={handleApi} />;
  }

  if (selectedMethod === 'acceptcustomer' && viewMode === 'demo') {
    return <AcceptCustomerForm onBack={handleBack} onOverview={handleOverview} onApi={handleApi} />;
  }

  // Overview/API views
  if (selectedMethod && (viewMode === 'overview' || viewMode === 'api')) {
    return (
      <MethodDetailPage 
        method={selectedMethod} 
        onBack={handleBack}
        onDemo={handleDemo}
        initialTab={viewMode}
      />
    );
  }

  // Main comparison view
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

        {/* Comparison Cards */}
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
            <CardFooter className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => { setSelectedMethod('acceptjs'); setViewMode('overview'); }}
                className="flex-1 gap-1"
              >
                <BookOpen className="h-4 w-4" />
                Overview
              </Button>
              <Button 
                onClick={() => { setSelectedMethod('acceptjs'); setViewMode('demo'); }}
                className="flex-1 gap-1"
              >
                <Play className="h-4 w-4" />
                Demo
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
            <CardFooter className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => { setSelectedMethod('acceptui'); setViewMode('overview'); }}
                className="flex-1 gap-1"
              >
                <BookOpen className="h-4 w-4" />
                Overview
              </Button>
              <Button 
                onClick={() => { setSelectedMethod('acceptui'); setViewMode('demo'); }}
                className="flex-1 gap-1"
              >
                <Play className="h-4 w-4" />
                Demo
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
            <CardFooter className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => { setSelectedMethod('accepthosted'); setViewMode('overview'); }}
                className="flex-1 gap-1"
              >
                <BookOpen className="h-4 w-4" />
                Overview
              </Button>
              <Button 
                onClick={() => { setSelectedMethod('accepthosted'); setViewMode('demo'); }}
                className="flex-1 gap-1"
              >
                <Play className="h-4 w-4" />
                Demo
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
            <CardFooter className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => { setSelectedMethod('acceptcustomer'); setViewMode('overview'); }}
                className="flex-1 gap-1"
              >
                <BookOpen className="h-4 w-4" />
                Overview
              </Button>
              <Button 
                onClick={() => { setSelectedMethod('acceptcustomer'); setViewMode('demo'); }}
                className="flex-1 gap-1"
              >
                <Play className="h-4 w-4" />
                Demo
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodSelector;
