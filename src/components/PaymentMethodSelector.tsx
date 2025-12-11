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
import { comparisonCards } from '@/data';

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
          {comparisonCards.map((card) => {
            const isSaqA = card.badge.type === 'saq-a';
            const hasDisplayMethods = card.displayMethods.length > 0;
            const hasKeyFeatures = card.keyFeatures.length > 0;
            
            return (
              <Card key={card.id} className="border-primary/20 flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 flex-wrap">
                    <span>{card.name}</span>
                    <Badge 
                      variant="outline" 
                      className={`gap-1 shrink-0 ${
                        isSaqA 
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' 
                          : 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                      }`}
                    >
                      {isSaqA ? <ShieldCheck className="h-3 w-3" /> : <ShieldAlert className="h-3 w-3" />}
                      {card.badge.text}
                    </Badge>
                  </CardTitle>
                  <div className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1 inline-block mt-2">
                    {card.pciScope}
                  </div>
                  <CardDescription className="mt-2">
                    {card.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 flex-1">
                  {hasDisplayMethods && (
                    <div>
                      <h4 className="font-medium mb-2">Display Methods:</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {card.displayMethods.map((method, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-primary" />
                            {method}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {hasKeyFeatures && (
                    <div>
                      <h4 className="font-medium mb-2">Key Features:</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {card.keyFeatures.map((feature, idx) => (
                          <li key={idx}>• {feature}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div>
                    <h4 className="font-medium mb-2">Best For:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {card.bestFor.map((item, idx) => (
                        <li key={idx}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Button 
                    variant="outline"
                    onClick={() => { setSelectedMethod(card.id); setViewMode('overview'); }}
                    className="flex-1 gap-1"
                  >
                    <BookOpen className="h-4 w-4" />
                    Overview
                  </Button>
                  <Button 
                    onClick={() => { setSelectedMethod(card.id); setViewMode('demo'); }}
                    className="flex-1 gap-1"
                  >
                    <Play className="h-4 w-4" />
                    Demo
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodSelector;
