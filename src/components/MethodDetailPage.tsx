import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ShieldCheck, ShieldAlert, Users, CreditCard, ArrowRight, Repeat, Ban, Globe, Code, Shield, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Props for MethodDetailPage component
interface MethodDetailPageProps {
  method: string;
  onBack: () => void;
  onDemo: () => void;
  initialTab?: 'overview' | 'api';
}

type TabType = 'overview' | 'api' | 'demo';

interface ApiExample {
  title: string;
  description: string;
  code: string;
}

const apiExamples: Record<string, { flow: string; examples: ApiExample[] }> = {
  acceptjs: {
    flow: 'Load Accept.js → Collect Card Data → Tokenize (Browser) → Send Token → Process Payment (API)',
    examples: [
      {
        title: '1. Load Accept.js Library',
        description: 'Include the Accept.js script in your HTML page.',
        code: `<script type="text/javascript" 
  src="https://jstest.authorize.net/v1/Accept.js" 
  charset="utf-8">
</script>`
      },
      {
        title: '2. Dispatch Payment Data',
        description: 'Collect card data and request a payment nonce from Authorize.Net.',
        code: `const secureData = {
  authData: {
    clientKey: "YOUR_PUBLIC_CLIENT_KEY",
    apiLoginID: "YOUR_API_LOGIN_ID"
  },
  cardData: {
    cardNumber: "4111111111111111",
    month: "12",
    year: "2025",
    cardCode: "123"
  }
};

Accept.dispatchData(secureData, responseHandler);

function responseHandler(response) {
  if (response.messages.resultCode === "Error") {
    console.error(response.messages.message);
  } else {
    // Send to your server
    const nonce = response.opaqueData.dataValue;
    const descriptor = response.opaqueData.dataDescriptor;
  }
}`
      },
      {
        title: '3. Process Payment (Server-Side)',
        description: 'Use the payment nonce to create a transaction via Authorize.Net API.',
        code: `{
  "createTransactionRequest": {
    "merchantAuthentication": {
      "name": "API_LOGIN_ID",
      "transactionKey": "TRANSACTION_KEY"
    },
    "transactionRequest": {
      "transactionType": "authCaptureTransaction",
      "amount": "29.99",
      "payment": {
        "opaqueData": {
          "dataDescriptor": "COMMON.ACCEPT.INAPP.PAYMENT",
          "dataValue": "PAYMENT_NONCE_FROM_ACCEPT_JS"
        }
      }
    }
  }
}`
      }
    ]
  },
  acceptui: {
    flow: 'Add Button → User Clicks → Hosted Lightbox → Token Callback → Process Payment (API)',
    examples: [
      {
        title: '1. Add AcceptUI Button',
        description: 'Add a payment button with AcceptUI data attributes.',
        code: `<button type="button"
  class="AcceptUI"
  data-billingAddressOptions='{"show":true, "required":false}'
  data-apiLoginID="YOUR_API_LOGIN_ID"
  data-clientKey="YOUR_PUBLIC_CLIENT_KEY"
  data-acceptUIFormBtnTxt="Pay Now"
  data-acceptUIFormHeaderTxt="Card Information"
  data-responseHandler="responseHandler">
  Pay Now
</button>

<script type="text/javascript"
  src="https://jstest.authorize.net/v3/AcceptUI.js"
  charset="utf-8">
</script>`
      },
      {
        title: '2. Handle Response',
        description: 'Define the callback function to receive the payment nonce.',
        code: `function responseHandler(response) {
  if (response.messages.resultCode === "Error") {
    let errors = response.messages.message;
    errors.forEach(error => {
      console.error(error.code + ": " + error.text);
    });
  } else {
    // Payment nonce received
    const nonce = response.opaqueData.dataValue;
    const descriptor = response.opaqueData.dataDescriptor;
    
    // Send to your server for processing
    processPayment(nonce, descriptor);
  }
}`
      },
      {
        title: '3. Process Payment (Server-Side)',
        description: 'Use the payment nonce to create a transaction.',
        code: `{
  "createTransactionRequest": {
    "merchantAuthentication": {
      "name": "API_LOGIN_ID",
      "transactionKey": "TRANSACTION_KEY"
    },
    "transactionRequest": {
      "transactionType": "authCaptureTransaction",
      "amount": "49.99",
      "payment": {
        "opaqueData": {
          "dataDescriptor": "COMMON.ACCEPT.INAPP.PAYMENT",
          "dataValue": "PAYMENT_NONCE_FROM_ACCEPT_UI"
        }
      }
    }
  }
}`
      }
    ]
  },
  accepthosted: {
    flow: 'Get Token (API) → Redirect/iFrame/Lightbox → Customer Pays → Webhook/Return URL',
    examples: [
      {
        title: '1. Get Hosted Payment Page Token',
        description: 'Request a hosted payment page token from Authorize.Net.',
        code: `{
  "getHostedPaymentPageRequest": {
    "merchantAuthentication": {
      "name": "API_LOGIN_ID",
      "transactionKey": "TRANSACTION_KEY"
    },
    "transactionRequest": {
      "transactionType": "authCaptureTransaction",
      "amount": "99.99",
      "customer": {
        "email": "customer@example.com"
      }
    },
    "hostedPaymentSettings": {
      "setting": [
        {
          "settingName": "hostedPaymentReturnOptions",
          "settingValue": "{\\"showReceipt\\": true, \\"url\\": \\"https://example.com/receipt\\"}"
        },
        {
          "settingName": "hostedPaymentButtonOptions",
          "settingValue": "{\\"text\\": \\"Pay Now\\"}"
        }
      ]
    }
  }
}`
      },
      {
        title: '2. Display Hosted Page (Redirect)',
        description: 'Redirect the customer to the hosted payment page.',
        code: `// Redirect to hosted payment page
const hostedPageUrl = "https://test.authorize.net/payment/payment";

// Create form and submit
const form = document.createElement('form');
form.method = 'POST';
form.action = hostedPageUrl;

const tokenInput = document.createElement('input');
tokenInput.type = 'hidden';
tokenInput.name = 'token';
tokenInput.value = 'TOKEN_FROM_API_RESPONSE';

form.appendChild(tokenInput);
document.body.appendChild(form);
form.submit();`
      },
      {
        title: '3. Display Hosted Page (iFrame/Lightbox)',
        description: 'Embed the hosted page in an iFrame or lightbox.',
        code: `// iFrame Communicator (save as iFrameCommunicator.html)
<html>
<head>
<script>
function receiveMessage(event) {
  if (event.data && event.data.action) {
    switch(event.data.action) {
      case "successfulSave":
        window.parent.postMessage({
          action: "paymentComplete",
          data: event.data
        }, "*");
        break;
      case "cancel":
        window.parent.postMessage({
          action: "paymentCancelled"
        }, "*");
        break;
    }
  }
}
window.addEventListener("message", receiveMessage, false);
</script>
</head>
<body></body>
</html>`
      },
      {
        title: '4. Handle Webhook Notification',
        description: 'Process webhook events for transaction confirmation.',
        code: `// Webhook payload example
{
  "notificationId": "abc123-def456",
  "eventType": "net.authorize.payment.authcapture.created",
  "eventDate": "2024-01-15T10:30:00Z",
  "webhookId": "webhook-id-123",
  "payload": {
    "responseCode": 1,
    "authCode": "ABC123",
    "transId": "123456789",
    "invoiceNumber": "INV-001",
    "accountType": "Visa",
    "accountNumber": "XXXX1111"
  }
}`
      }
    ]
  },
  acceptcustomer: {
    flow: 'Create Customer Profile (API) → Generate Hosted Token → Display Hosted Form → Store Tokenized Payment Profile → Charge Profile (API)',
    examples: [
      {
        title: '1. Create Customer Profile',
        description: 'Create a customer profile in CIM and store the returned customerProfileId in your database.',
        code: `{
  "createCustomerProfileRequest": {
    "merchantAuthentication": {
      "name": "API_LOGIN_ID",
      "transactionKey": "TRANSACTION_KEY"
    },
    "profile": {
      "merchantCustomerId": "local-customer-123",
      "email": "customer@example.com",
      "description": "Customer portal account"
    },
    "validationMode": "none"
  }
}`
      },
      {
        title: '2. Generate Hosted Form Token',
        description: 'Use the customerProfileId to request a short-lived token for the Accept Customer hosted form.',
        code: `{
  "getHostedProfilePageRequest": {
    "merchantAuthentication": {
      "name": "API_LOGIN_ID",
      "transactionKey": "TRANSACTION_KEY"
    },
    "customerProfileId": "123456789",
    "hostedProfileSettings": {
      "setting": [
        {
          "settingName": "hostedProfileReturnUrl",
          "settingValue": "https://example.com/account"
        },
        {
          "settingName": "hostedProfilePageBorderVisible",
          "settingValue": "false"
        },
        {
          "settingName": "hostedProfileIFrameCommunicatorUrl",
          "settingValue": "https://example.com/anet-iframe-communicator.html"
        }
      ]
    }
  }
}`
      },
      {
        title: '3. Get Customer Profile',
        description: 'Retrieve the customer profile with all payment and shipping profiles.',
        code: `{
  "getCustomerProfileRequest": {
    "merchantAuthentication": {
      "name": "API_LOGIN_ID",
      "transactionKey": "TRANSACTION_KEY"
    },
    "customerProfileId": "123456789",
    "includeIssuerInfo": "true"
  }
}

// Response includes:
// - customerPaymentProfileId(s)
// - shippingAddressId(s)
// - Masked card numbers
// - Card types and expiration dates`
      },
      {
        title: '4. Charge Customer Profile',
        description: 'Process a payment using stored customer and payment profile IDs.',
        code: `{
  "createTransactionRequest": {
    "merchantAuthentication": {
      "name": "API_LOGIN_ID",
      "transactionKey": "TRANSACTION_KEY"
    },
    "transactionRequest": {
      "transactionType": "authCaptureTransaction",
      "amount": "29.99",
      "profile": {
        "customerProfileId": "123456789",
        "paymentProfile": {
          "paymentProfileId": "987654321"
        }
      }
    }
  }
}`
      }
    ]
  }
};

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
      components: [
        { name: 'Client (Browser)', description: 'Loads Accept.js library and collects card data' },
        { name: 'Accept.js Library', description: 'Tokenizes payment data client-side' },
        { name: 'Your Server', description: 'Receives nonce, processes transaction' },
        { name: 'Authorize.Net API', description: 'Validates and settles payment' },
      ],
      dataFlow: 'Card data enters your page temporarily before tokenization. Only the secure nonce travels to your server.',
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
      components: [
        { name: 'Payment Button', description: 'Triggers hosted lightbox modal' },
        { name: 'Hosted Lightbox', description: 'Authorize.Net iframe collects card data' },
        { name: 'Callback Handler', description: 'Receives tokenized payment nonce' },
        { name: 'Your Server', description: 'Processes transaction with nonce' },
      ],
      dataFlow: 'Card data never touches your page. All sensitive data is collected within the secure hosted iframe.',
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
      components: [
        { name: 'Your Server (Backend)', description: 'Requests hosted payment token from API' },
        { name: 'Hosted Payment Page', description: 'Authorize.Net-hosted form (redirect/iframe/lightbox)' },
        { name: 'iFrameCommunicator', description: 'Handles cross-origin messaging for embedded modes' },
        { name: 'Webhook Endpoint', description: 'Receives transaction confirmation events' },
      ],
      dataFlow: 'All payment data is collected on Authorize.Net hosted pages. Your server only handles tokens and webhooks.',
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
      components: [
        { name: 'CIM API', description: 'Creates and manages customer profiles' },
        { name: 'Hosted Profile Form', description: 'Securely collects payment methods (SAQ-A)' },
        { name: 'Token Vault', description: 'Stores encrypted payment profiles' },
        { name: 'Transaction API', description: 'Charges stored profiles on demand' },
      ],
      dataFlow: 'Hybrid approach: Direct API for profile management, hosted forms for card collection. No card data on your servers.',
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

const CodeBlock: React.FC<{ code: string }> = ({ code }) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast({ title: 'Copied to clipboard' });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 h-8 gap-1 text-xs"
        onClick={handleCopy}
      >
        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        {copied ? 'Copied' : 'Copy'}
      </Button>
      <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
        <code>{code}</code>
      </pre>
    </div>
  );
};

const MethodDetailPage: React.FC<MethodDetailPageProps> = ({ method, onBack, onDemo, initialTab = 'overview' }) => {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const { toast } = useToast();
  const data = methodData[method as keyof typeof methodData];
  const apiData = apiExamples[method as keyof typeof apiExamples];

  if (!data) return null;

  const isSaqA = data.badge.type === 'saq-a';

  const handleTabChange = (tab: TabType) => {
    if (tab === 'demo') {
      onDemo();
    } else {
      setActiveTab(tab);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/5 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-2">
            <Button variant="ghost" size="sm" onClick={onBack} className="gap-1 -ml-2 mb-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold">
                {data.name}
                {activeTab === 'api' && ' – API Examples'}
              </h1>
              <Badge 
                variant="outline" 
                className={`gap-1 ${isSaqA ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' : 'bg-amber-500/10 text-amber-600 border-amber-500/30'}`}
              >
                {isSaqA ? <ShieldCheck className="h-3 w-3" /> : <ShieldAlert className="h-3 w-3" />}
                {data.badge.text}
              </Badge>
            </div>
            <p className="text-muted-foreground max-w-2xl">
              {activeTab === 'api' 
                ? `Practical request/response examples for ${data.name} integration.`
                : data.description
              }
            </p>
            {activeTab === 'overview' && (
              <div className="flex gap-2 pt-2">
                {data.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                ))}
              </div>
            )}
          </div>

          {/* Tab Navigation */}
          <div className="flex bg-muted rounded-lg p-1 shrink-0">
            <Button
              variant={activeTab === 'overview' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => handleTabChange('overview')}
              className="rounded-md"
            >
              Overview
            </Button>
            <Button
              variant={activeTab === 'api' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => handleTabChange('api')}
              className="rounded-md"
            >
              API Examples
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleTabChange('demo')}
              className="rounded-md"
            >
              Demo
            </Button>
          </div>
        </div>

        {activeTab === 'overview' ? (
          <>
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
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">Integration Architecture</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Flow Diagram */}
                  <div className="bg-muted/50 rounded-lg p-3">
                    <code className="text-sm text-primary font-medium">
                      {data.integrationArchitecture.flow}
                    </code>
                  </div>
                  
                  {/* Components Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {data.integrationArchitecture.components.map((component, index) => (
                      <div key={index} className="bg-background border rounded-lg p-3 space-y-1">
                        <div className="font-medium text-sm text-primary">{component.name}</div>
                        <div className="text-xs text-muted-foreground">{component.description}</div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Data Flow Description */}
                  <div className="text-sm text-muted-foreground border-l-2 border-primary/30 pl-3">
                    {data.integrationArchitecture.dataFlow}
                  </div>
                  
                  {/* Supported Payment Types */}
                  <div className="flex gap-2 flex-wrap pt-2">
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
          </>
        ) : (
          /* API Examples Tab */
          <>
            {/* Flow Banner */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="py-4">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-primary">Flow:</span>
                  <span className="text-muted-foreground">{apiData?.flow}</span>
                </div>
              </CardContent>
            </Card>

            {/* API Examples */}
            <div className="space-y-6">
              {apiData?.examples.map((example, index) => (
                <Card key={index}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Code className="h-4 w-4 text-primary" />
                          {example.title}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {example.description}
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="text-xs">JSON</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CodeBlock code={example.code} />
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MethodDetailPage;
