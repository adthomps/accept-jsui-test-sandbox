import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, ShieldCheck, ShieldAlert, Users, CreditCard, ArrowRight, Repeat, Ban, Globe, Code, Shield } from 'lucide-react';

interface MethodDetailPageProps {
  method: string;
  onBack: () => void;
  onDemo: () => void;
}

const methodData = {
  acceptjs: {
    name: 'AcceptJS',
    badge: { type: 'saq-aep', text: 'SAQ A-EP' },
    description: 'Client-side tokenization for custom payment form integration. Card data enters your page before tokenization.',
    tags: ['Custom Forms', 'Tokenization'],
    howItWorks: {
      steps: [
        { icon: Code, label: 'Load Accept.js' },
        { icon: CreditCard, label: 'Collect Card Data' },
        { icon: ArrowRight, label: '' },
        { icon: Shield, label: 'Tokenize (Browser)' },
        { icon: ArrowRight, label: '' },
        { icon: Globe, label: 'Process Payment (API)' },
      ]
    },
    integrationDetails: [
      'Load Accept.js library from Authorize.Net CDN',
      'Create custom payment form with your design',
      'Collect card/bank data in browser',
      'Call Accept.dispatchData() to tokenize',
      'Send payment nonce to your server',
      'Process transaction via Authorize.Net API',
    ],
    integrationArchitecture: {
      flow: 'Browser → Accept.js → Payment Token → Your Server → Authorize.Net',
      supports: ['Credit Cards', 'Debit Cards', 'eCheck/ACH'],
    },
    availableOptions: [
      'Credit/Debit card payments',
      'eCheck/ACH bank transfers',
      'Custom form styling',
      'Real-time validation',
      'Mobile-optimized forms',
    ],
    bestUseCases: [
      'Custom branded checkout',
      'E-commerce platforms',
      'Single-page applications',
      'Mobile web payments',
      'Design flexibility required',
    ],
    securityCompliance: [
      'SAQ A-EP compliant tokenization',
      'Card data enters your page (higher scope)',
      'TLS encrypted transmission',
      'One-time use payment nonces',
      'PCI DSS compliance assistance',
    ],
    warnings: [
      'Card data enters your page before tokenization',
      'Requires SAQ A-EP self-assessment (22+ questions)',
    ],
  },
  acceptui: {
    name: 'AcceptUI',
    badge: { type: 'saq-a', text: 'SAQ-A' },
    description: 'Hosted modal lightbox for quick and secure payment integration. No card data touches your page.',
    tags: ['Lightbox', 'Hosted UI'],
    howItWorks: {
      steps: [
        { icon: Users, label: 'Click Button' },
        { icon: ArrowRight, label: '' },
        { icon: Shield, label: 'Hosted Lightbox' },
        { icon: ArrowRight, label: '' },
        { icon: CreditCard, label: 'Payment Token' },
        { icon: ArrowRight, label: '' },
        { icon: Globe, label: 'Process (API)' },
      ]
    },
    integrationDetails: [
      'Load AcceptUI.js library from Authorize.Net',
      'Add button with AcceptUI class',
      'Configure data attributes on button',
      'User clicks to open lightbox modal',
      'Handle response in callback function',
      'Process payment nonce on server',
    ],
    integrationArchitecture: {
      flow: 'Button Click → Hosted Lightbox → Payment Token → Your Server → Authorize.Net',
      supports: ['Credit Cards', 'Debit Cards', 'eCheck/ACH'],
    },
    availableOptions: [
      'Credit/Debit card payments',
      'eCheck/ACH bank transfers',
      'Billing address collection',
      'Customizable button text',
      'Response handler callbacks',
    ],
    bestUseCases: [
      'Quick integration needed',
      'Minimal PCI scope required',
      'Standard payment forms',
      'Low development resources',
      'Hosted UI acceptable',
    ],
    securityCompliance: [
      'SAQ-A compliant hosted collection',
      'No card data on your servers',
      'Iframe-based secure modal',
      'Authorize.Net hosted UI',
      'Automatic PCI compliance',
    ],
    warnings: [],
  },
  accepthosted: {
    name: 'Accept Hosted',
    badge: { type: 'saq-a', text: 'SAQ-A' },
    description: 'Flexible hosted payment with multiple display methods and customer profile support. No card data touches your servers.',
    tags: ['Hosted Page', 'Profiles'],
    howItWorks: {
      steps: [
        { icon: Globe, label: 'Get Token (API)' },
        { icon: ArrowRight, label: '' },
        { icon: Shield, label: 'Display Hosted Page' },
        { icon: ArrowRight, label: '' },
        { icon: CreditCard, label: 'Customer Pays' },
        { icon: ArrowRight, label: '' },
        { icon: Repeat, label: 'Webhook/Return' },
      ]
    },
    integrationDetails: [
      'Server generates hosted payment token',
      'Choose display method (redirect/lightbox/iFrame)',
      'Configure iFrameCommunicator if using overlay',
      'Customer completes payment on hosted form',
      'Handle return/message based on display method',
      'Webhook confirms transaction status',
    ],
    integrationArchitecture: {
      flow: 'Your Server → Get Token → Display Hosted Page → Customer Pays → Webhook/Return',
      supports: ['Credit Cards', 'Customer Profiles', 'Recurring'],
    },
    availableOptions: [
      'Full Page Redirect (simplest)',
      'Lightbox Popup (overlay modal)',
      'Embedded iFrame (inline form)',
      'Customer profile creation',
      'Returning customer support',
    ],
    bestUseCases: [
      'Enterprise applications',
      'Multi-step checkout flows',
      'Returning customer payments',
      'Maximum security required',
      'Flexible display requirements',
    ],
    securityCompliance: [
      'SAQ-A compliant hosted collection',
      'No card data on your servers',
      'PCI DSS Level 1 compliant',
      'Webhook transaction verification',
      'Customer profile encryption',
    ],
    warnings: [],
    displayMethods: [
      { name: 'Full Page Redirect', description: 'Customer leaves your site and completes payment on Authorize.Net\'s hosted page.' },
      { name: 'Lightbox (Popup)', description: 'Payment form appears as a modal overlay on your page using iFrame communication.' },
      { name: 'Embedded iFrame', description: 'Payment form embedded directly within your page layout using an iFrame.' },
    ],
  },
  acceptcustomer: {
    name: 'Accept Customer (CIM)',
    badge: { type: 'saq-a', text: 'SAQ-A' },
    description: 'Secure stored payment profiles with hosted forms (SAQ-A) + Direct API for charging. No card data touches your servers.',
    tags: ['CIM', 'Profiles'],
    howItWorks: {
      steps: [
        { icon: Users, label: 'Create Profile (API)' },
        { icon: ArrowRight, label: '' },
        { icon: CreditCard, label: 'Add/Edit Payment (Hosted Form)' },
        { icon: ArrowRight, label: '' },
        { icon: Repeat, label: 'Charge Profile (API)' },
      ]
    },
    integrationDetails: [
      'Create customer profile via API',
      'Generate hosted form token',
      'Display iframe/lightbox/redirect form',
      'Store tokenized payment profile',
      'Charge stored profile via API',
      'Support recurring billing & returns',
    ],
    integrationArchitecture: {
      flow: 'Create Profile (API) → Add Payment (Hosted) → Charge Profile (API)',
      supports: ['Stored Cards', 'Recurring', 'ACH'],
    },
    availableOptions: [
      'Create Profile (API)',
      'Get Profile (API)',
      'Manage Profile (Hosted Form)',
      'Add/Edit Payment Methods (Hosted)',
      'Charge Profile (API)',
    ],
    bestUseCases: [
      'Subscriptions & memberships',
      'Customer payment portals',
      'Save card for next time checkout',
      'ACH recurring payments',
      'Returning customer experiences',
    ],
    securityCompliance: [
      'SAQ-A compliant hosted collection',
      'No card data on your servers',
      'Tokenized vault storage',
      'Secure recurring billing',
      'Supports PCI Level 1 environment',
    ],
    warnings: [],
  },
};

const MethodDetailPage: React.FC<MethodDetailPageProps> = ({ method, onBack, onDemo }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const data = methodData[method as keyof typeof methodData];

  if (!data) return null;

  const isSaqA = data.badge.type === 'saq-a';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/5 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <Button variant="ghost" size="sm" onClick={onBack} className="gap-1 -ml-2 mb-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold">{data.name}</h1>
              <Badge 
                variant="outline" 
                className={`gap-1 ${isSaqA ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' : 'bg-amber-500/10 text-amber-600 border-amber-500/30'}`}
              >
                {isSaqA ? <ShieldCheck className="h-3 w-3" /> : <ShieldAlert className="h-3 w-3" />}
                {data.badge.text}
              </Badge>
            </div>
            <p className="text-muted-foreground max-w-2xl">{data.description}</p>
            <div className="flex gap-2 pt-2">
              {data.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
              ))}
            </div>
          </div>

          {/* Tab Navigation */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="shrink-0">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="api">API Examples</TabsTrigger>
              <TabsTrigger value="demo" onClick={onDemo}>Demo</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* How It Works Banner */}
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 flex-wrap">
              {data.howItWorks.steps.map((step, index) => (
                <React.Fragment key={index}>
                  {step.label ? (
                    <div className="flex items-center gap-2 text-sm">
                      <step.icon className="h-4 w-4 text-primary" />
                      <span>{step.label}</span>
                    </div>
                  ) : (
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Content Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Integration Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Integration Details</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2 text-sm text-muted-foreground">
                {data.integrationDetails.map((step, index) => (
                  <li key={index} className="text-primary">
                    {index + 1}. <span className="text-muted-foreground">{step}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          {/* Integration Architecture */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Integration Architecture</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <code className="text-sm text-primary block">
                {data.integrationArchitecture.flow}
              </code>
              <div className="flex gap-2 flex-wrap">
                {data.integrationArchitecture.supports.map(item => (
                  <Badge key={item} variant="outline" className={`text-xs ${isSaqA ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' : 'bg-amber-500/10 text-amber-600 border-amber-500/30'}`}>
                    {item}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Available Options */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Available Options</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {data.availableOptions.map((option, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>{option}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Best Use Cases */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Best Use Cases</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {data.bestUseCases.map((useCase, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>{useCase}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Security & Compliance */}
        <Card className={data.warnings.length > 0 ? 'border-amber-500/20' : ''}>
          <CardHeader>
            <CardTitle className="text-base">Security & Compliance</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {data.securityCompliance.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Warnings (if any) */}
        {data.warnings.length > 0 && (
          <Card className="bg-amber-500/5 border-amber-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-amber-600">
                <Ban className="h-4 w-4" />
                Do Not Do This
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {data.warnings.map((warning, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-amber-600">•</span>
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MethodDetailPage;
