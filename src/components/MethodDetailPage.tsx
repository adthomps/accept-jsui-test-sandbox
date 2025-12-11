import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ShieldCheck, ShieldAlert, Users, CreditCard, ArrowRight, Repeat, Ban, Globe, Code, Shield, Copy, Check, Monitor, Lock, Server, Webhook, MousePointer, LayoutGrid, Vault, Database, Sparkles, FileText, Clipboard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Props for MethodDetailPage component
interface MethodDetailPageProps {
  method: string;
  onBack: () => void;
  onDemo: () => void;
  initialTab?: 'overview' | 'api';
}

type TabType = 'overview' | 'api' | 'ai' | 'demo';

interface ApiExample {
  title: string;
  description: string;
  code: string;
  language: 'html' | 'javascript' | 'json';
}

const apiExamples: Record<string, { flow: string; examples: ApiExample[] }> = {
  acceptjs: {
    flow: 'Load Accept.js → Collect Card Data → Tokenize (Browser) → Send Token → Process Payment (API)',
    examples: [
      {
        title: 'Load Accept.js Library',
        description: 'Include the Accept.js script in your HTML page.',
        language: 'html',
        code: `<script type="text/javascript" 
  src="https://jstest.authorize.net/v1/Accept.js" 
  charset="utf-8">
</script>`
      },
      {
        title: 'Dispatch Payment Data',
        description: 'Collect card data and request a payment nonce from Authorize.Net.',
        language: 'javascript',
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
        title: 'Process Payment (Server-Side)',
        description: 'Use the payment nonce to create a transaction via Authorize.Net API.',
        language: 'json',
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
        title: 'Add AcceptUI Button',
        description: 'Add a payment button with AcceptUI data attributes.',
        language: 'html',
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
        title: 'Handle Response',
        description: 'Define the callback function to receive the payment nonce.',
        language: 'javascript',
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
        title: 'Process Payment (Server-Side)',
        description: 'Use the payment nonce to create a transaction.',
        language: 'json',
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
        title: 'Get Hosted Payment Page Token',
        description: 'Request a hosted payment page token from Authorize.Net.',
        language: 'json',
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
        title: 'Display Hosted Page (Redirect)',
        description: 'Redirect the customer to the hosted payment page.',
        language: 'javascript',
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
        title: 'Display Hosted Page (iFrame/Lightbox)',
        description: 'Embed the hosted page in an iFrame or lightbox.',
        language: 'html',
        code: `<!-- iFrame Communicator (save as iFrameCommunicator.html) -->
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
        title: 'Handle Webhook Notification',
        description: 'Process webhook events for transaction confirmation.',
        language: 'json',
        code: `{
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
        title: 'Create Customer Profile',
        description: 'Create a customer profile in CIM and store the returned customerProfileId in your database.',
        language: 'json',
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
        title: 'Generate Hosted Form Token',
        description: 'Use the customerProfileId to request a short-lived token for the Accept Customer hosted form.',
        language: 'json',
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
        title: 'Get Customer Profile',
        description: 'Retrieve the customer profile with all payment and shipping profiles.',
        language: 'json',
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
        title: 'Charge Customer Profile',
        description: 'Process a payment using stored customer and payment profile IDs.',
        language: 'json',
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
        { name: 'Client (Browser)', icon: Monitor, description: 'Loads Accept.js library and collects card data' },
        { name: 'Accept.js Library', icon: Code, description: 'Tokenizes payment data client-side' },
        { name: 'Your Server', icon: Server, description: 'Receives nonce, processes transaction' },
        { name: 'Authorize.Net API', icon: Lock, description: 'Validates and settles payment' },
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
        { name: 'Payment Button', icon: MousePointer, description: 'Triggers hosted lightbox modal' },
        { name: 'Hosted Lightbox', icon: LayoutGrid, description: 'Authorize.Net iframe collects card data' },
        { name: 'Callback Handler', icon: Code, description: 'Receives tokenized payment nonce' },
        { name: 'Your Server', icon: Server, description: 'Processes transaction with nonce' },
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
    warnings: [
      'Do not try to intercept or access card data from the lightbox iframe',
      'Do not store or log the payment nonce after it has been used',
      'Do not use in environments where popups are blocked without fallback',
    ],
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
        { name: 'Your Server (Backend)', icon: Server, description: 'Requests hosted payment token from API' },
        { name: 'Hosted Payment Page', icon: Shield, description: 'Authorize.Net-hosted form (redirect/iframe/lightbox)' },
        { name: 'iFrameCommunicator', icon: Globe, description: 'Handles cross-origin messaging for embedded modes' },
        { name: 'Webhook Endpoint', icon: Webhook, description: 'Receives transaction confirmation events' },
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
    warnings: [
      'Do not include query parameters in cancelUrl (causes form to fail)',
      'Do not embed without iFrameCommunicator for lightbox/iframe modes',
      'Do not skip webhook verification for transaction confirmation',
      'Do not expose hosted payment tokens in client-side logs',
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
      components: [
        { name: 'CIM API', icon: Database, description: 'Creates and manages customer profiles' },
        { name: 'Hosted Profile Form', icon: Shield, description: 'Securely collects payment methods (SAQ-A)' },
        { name: 'Token Vault', icon: Vault, description: 'Stores encrypted payment profiles' },
        { name: 'Transaction API', icon: CreditCard, description: 'Charges stored profiles on demand' },
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
    warnings: [
      'Do not store raw card data - always use hosted forms for collection',
      'Do not expose customerProfileId or paymentProfileId in client-side code',
      'Do not charge profiles without proper user authorization',
      'Do not use editPayment/editShipping without the specific profile ID',
    ],
  },
};

// AI Starter content for each method
const aiStarterContent: Record<string, { prompt: string; specs: string }> = {
  acceptjs: {
    prompt: `I need to implement Authorize.Net Accept.js payment integration for a web application.

## Requirements
- SAQ A-EP PCI compliance (card data enters page but is tokenized client-side)
- React/TypeScript frontend
- Supabase Edge Functions for backend processing
- Test/sandbox environment first, then production

## What I Need
1. Load Accept.js library dynamically
2. Create a payment form that collects card data
3. Tokenize card data using Accept.dispatchData()
4. Send payment nonce to backend for processing
5. Handle success/error responses

## Constraints
- Never store raw card data
- Use payment nonce only once (single-use token)
- Handle network errors gracefully
- Support for billing address collection (optional)`,
    specs: `# Accept.js Technical Specification

## Environment URLs
- Sandbox: https://jstest.authorize.net/v1/Accept.js
- Production: https://js.authorize.net/v1/Accept.js

## Required Credentials
- API Login ID (public, used client-side)
- Public Client Key (public, used client-side)  
- Transaction Key (secret, backend only)

## Client-Side Data Structure
\`\`\`typescript
interface SecureData {
  authData: {
    clientKey: string;      // Public Client Key
    apiLoginID: string;     // API Login ID
  };
  cardData: {
    cardNumber: string;     // 13-19 digits
    month: string;          // MM format
    year: string;           // YYYY format
    cardCode: string;       // 3-4 digit CVV
  };
}

interface AcceptResponse {
  messages: {
    resultCode: 'Ok' | 'Error';
    message: Array<{ code: string; text: string }>;
  };
  opaqueData?: {
    dataDescriptor: 'COMMON.ACCEPT.INAPP.PAYMENT';
    dataValue: string;  // Payment nonce (single-use)
  };
}
\`\`\`

## Server-Side Transaction Request
\`\`\`json
{
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
          "dataValue": "PAYMENT_NONCE"
        }
      }
    }
  }
}
\`\`\`

## API Endpoints
- Sandbox: https://apitest.authorize.net/xml/v1/request.api
- Production: https://api.authorize.net/xml/v1/request.api

## Test Card Numbers
- Visa: 4111111111111111
- Mastercard: 5424000000000015
- Amex: 370000000000002
- Discover: 6011000000000012

## Error Codes
- E00001: An error occurred during processing
- E00003: The 'AnetApi/xml/v1/schema/AnetApiSchema.xsd' is invalid
- E00007: User authentication failed
- E00039: A duplicate transaction has been submitted`
  },
  acceptui: {
    prompt: `I need to implement Authorize.Net Accept UI (lightbox) payment integration.

## Requirements
- SAQ-A PCI compliance (no card data on my page)
- React/TypeScript frontend
- Supabase Edge Functions for backend processing
- Hosted lightbox modal for card collection
- Test/sandbox environment first

## What I Need
1. Add Accept UI button with data attributes
2. Load AcceptUI.js library
3. Handle payment nonce in callback function
4. Process payment on backend
5. Display success/error to user

## Constraints
- Card data never touches my page
- Handle popup blockers gracefully
- Support billing address display (optional)
- Global responseHandler function required`,
    specs: `# Accept UI Technical Specification

## Environment URLs
- Sandbox: https://jstest.authorize.net/v3/AcceptUI.js
- Production: https://js.authorize.net/v3/AcceptUI.js

## Required Credentials
- API Login ID (public, data attribute)
- Public Client Key (public, data attribute)
- Transaction Key (secret, backend only)

## Button Data Attributes
\`\`\`html
<button type="button"
  class="AcceptUI"
  data-billingAddressOptions='{"show":true,"required":false}'
  data-apiLoginID="YOUR_API_LOGIN_ID"
  data-clientKey="YOUR_PUBLIC_CLIENT_KEY"
  data-acceptUIFormBtnTxt="Pay Now"
  data-acceptUIFormHeaderTxt="Card Information"
  data-responseHandler="responseHandler">
  Pay Now
</button>
\`\`\`

## Response Handler Interface
\`\`\`typescript
interface AcceptUIResponse {
  messages: {
    resultCode: 'Ok' | 'Error';
    message: Array<{ code: string; text: string }>;
  };
  opaqueData?: {
    dataDescriptor: 'COMMON.ACCEPT.INAPP.PAYMENT';
    dataValue: string;
  };
}

// Must be global function
window.responseHandler = (response: AcceptUIResponse) => {
  if (response.messages.resultCode === 'Ok') {
    // Send response.opaqueData to server
  }
};
\`\`\`

## Configuration Options
| Attribute | Description |
|-----------|-------------|
| data-billingAddressOptions | Show/require billing address |
| data-acceptUIFormBtnTxt | Submit button text |
| data-acceptUIFormHeaderTxt | Modal header text |
| data-paymentOptions | Card types to accept |

## Server-Side Processing
Same as Accept.js - use opaqueData in createTransactionRequest.

## Important Notes
- responseHandler MUST be a global function on window
- Lightbox opens in iframe, no popup blocker issues
- Script automatically finds buttons with .AcceptUI class
- Token is single-use, process immediately`
  },
  accepthosted: {
    prompt: `I need to implement Authorize.Net Accept Hosted payment page integration.

## Requirements
- SAQ-A PCI compliance (fully hosted payment form)
- React/TypeScript frontend
- Supabase Edge Functions for backend processing
- Support redirect, lightbox, and iframe display modes
- Customer profile creation optional
- Return URL handling for payment completion

## What I Need
1. Request hosted payment page token from backend
2. Redirect user or embed iframe with token
3. Handle return URL with transaction result
4. Optional: Create customer profile for saved cards
5. Process webhooks for transaction confirmation

## Constraints
- cancelUrl must NOT have query parameters
- Token expires after 15 minutes
- iFrameCommunicator.html required for lightbox/iframe
- Customer and billTo elements omitted for returning customers`,
    specs: `# Accept Hosted Technical Specification

## API Endpoint
- Sandbox: https://apitest.authorize.net/xml/v1/request.api
- Production: https://api.authorize.net/xml/v1/request.api

## Hosted Page URLs
- Sandbox: https://test.authorize.net/payment/payment
- Production: https://accept.authorize.net/payment/payment

## Token Request (getHostedPaymentPageRequest)
\`\`\`json
{
  "getHostedPaymentPageRequest": {
    "merchantAuthentication": {
      "name": "API_LOGIN_ID",
      "transactionKey": "TRANSACTION_KEY"
    },
    "transactionRequest": {
      "transactionType": "authCaptureTransaction",
      "amount": "29.99",
      "customer": { "email": "customer@example.com" },
      "billTo": {
        "firstName": "John",
        "lastName": "Doe"
      }
    },
    "hostedPaymentSettings": {
      "setting": [
        {
          "settingName": "hostedPaymentReturnOptions",
          "settingValue": "{\\"showReceipt\\": false, \\"url\\": \\"https://yoursite.com/return?refId=123\\", \\"cancelUrl\\": \\"https://yoursite.com/cancel\\"}"
        },
        {
          "settingName": "hostedPaymentButtonOptions",
          "settingValue": "{\\"text\\": \\"Pay Now\\"}"
        },
        {
          "settingName": "hostedPaymentCustomerOptions",
          "settingValue": "{\\"showEmail\\": true, \\"addPaymentProfile\\": true}"
        }
      ]
    }
  }
}
\`\`\`

## Display Modes
| Mode | Implementation |
|------|----------------|
| Redirect | window.location = gatewayUrl + '?token=' + token |
| Lightbox | AuthorizeNetPopup.openAddPaymentPopup() |
| iFrame | <iframe src={gatewayUrl + '?token=' + token} /> |

## Lightbox/iFrame Requirements
- hostedPaymentIFrameCommunicatorUrl setting required
- iFrameCommunicator.html handles postMessage events
- Events: cancel, transactResponse, resizeWindow

## Return URL Parameters
- response_code: 1=Approved, 2=Declined, 3=Error
- transaction_id: Authorize.Net transaction ID
- customer_profile_id: If profile created
- customer_payment_profile_id: If payment saved

## CRITICAL: URL Requirements
- cancelUrl: NO query parameters allowed
- url (success): Query parameters OK (use for refId tracking)

## Returning Customer Request
Omit customer and billTo, include profile:
\`\`\`json
{
  "transactionRequest": {
    "transactionType": "authCaptureTransaction",
    "amount": "29.99",
    "profile": {
      "customerProfileId": "123456789"
    }
  }
}
\`\`\``
  },
  acceptcustomer: {
    prompt: `I need to implement Authorize.Net Accept Customer (CIM) for managing saved payment profiles.

## Requirements
- SAQ-A PCI compliance for hosted form operations
- React/TypeScript frontend
- Supabase Edge Functions for backend processing
- Support profile management: create, view, edit, delete
- Charge saved payment methods
- Multiple display modes (redirect, lightbox, iframe)

## What I Need
1. Create customer profiles via API
2. Get hosted profile page token for managing payment methods
3. Display hosted forms for adding/editing payment profiles
4. Charge existing payment profiles
5. Handle webhooks for profile updates

## Constraints  
- Direct API for create/get/charge operations
- Hosted forms for add/edit payment methods (SAQ-A)
- editPayment requires paymentProfileId, not customerProfileId
- editShipping requires shippingAddressId
- Profile IDs should not be exposed client-side`,
    specs: `# Accept Customer (CIM) Technical Specification

## API Endpoint
- Sandbox: https://apitest.authorize.net/xml/v1/request.api
- Production: https://api.authorize.net/xml/v1/request.api

## Hosted Profile Page URL
- Sandbox: https://test.authorize.net/customer/
- Production: https://accept.authorize.net/customer/

## Create Customer Profile (Direct API)
\`\`\`json
{
  "createCustomerProfileRequest": {
    "merchantAuthentication": {
      "name": "API_LOGIN_ID",
      "transactionKey": "TRANSACTION_KEY"
    },
    "profile": {
      "email": "customer@example.com",
      "description": "Customer profile"
    }
  }
}
\`\`\`

## Get Hosted Profile Token
\`\`\`json
{
  "getHostedProfilePageRequest": {
    "merchantAuthentication": {
      "name": "API_LOGIN_ID",
      "transactionKey": "TRANSACTION_KEY"
    },
    "customerProfileId": "123456789",
    "hostedProfileSettings": {
      "setting": [
        {
          "settingName": "hostedProfilePageBorderVisible",
          "settingValue": "false"
        },
        {
          "settingName": "hostedProfileIFrameCommunicatorUrl",
          "settingValue": "https://yoursite.com/iFrameCommunicator.html"
        },
        {
          "settingName": "hostedProfileManageOptions",
          "settingValue": "showPayment,showShipping"
        }
      ]
    }
  }
}
\`\`\`

## Page Types
| Type | Required ID | Description |
|------|-------------|-------------|
| manage | customerProfileId | View/manage all profiles |
| addPayment | customerProfileId | Add new payment method |
| addShipping | customerProfileId | Add new shipping address |
| editPayment | paymentProfileId | Edit specific payment |
| editShipping | shippingAddressId | Edit specific address |

## Charge Customer Profile
\`\`\`json
{
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
}
\`\`\`

## Get Customer Profile (for listing payment methods)
\`\`\`json
{
  "getCustomerProfileRequest": {
    "merchantAuthentication": {
      "name": "API_LOGIN_ID",
      "transactionKey": "TRANSACTION_KEY"
    },
    "customerProfileId": "123456789",
    "includeIssuerInfo": "true"
  }
}
\`\`\`

## iFrameCommunicator Events
- action=successfulSave: Profile updated
- action=cancel: User cancelled
- action=resizeWindow: Adjust iframe height`
  }
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

// AI Starter Content Component
const AIStarterContent: React.FC<{ method: string }> = ({ method }) => {
  const { toast } = useToast();
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedSpecs, setCopiedSpecs] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  
  const aiData = aiStarterContent[method as keyof typeof aiStarterContent];
  
  if (!aiData) return null;

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(aiData.prompt);
    setCopiedPrompt(true);
    toast({ title: 'Prompt copied to clipboard' });
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleCopySpecs = () => {
    navigator.clipboard.writeText(aiData.specs);
    setCopiedSpecs(true);
    toast({ title: 'Specs copied to clipboard' });
    setTimeout(() => setCopiedSpecs(false), 2000);
  };

  const handleCopyAll = () => {
    const combined = `${aiData.prompt}\n\n---\n\n${aiData.specs}`;
    navigator.clipboard.writeText(combined);
    setCopiedAll(true);
    toast({ title: 'All content copied to clipboard' });
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <>
      {/* Intro Banner */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium">AI-Ready Implementation Guide</p>
              <p className="text-sm text-muted-foreground">
                Copy the prompt template and technical specs below to use with your favorite AI assistant (ChatGPT, Claude, Copilot, etc.) to jumpstart your integration.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Copy All Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleCopyAll}
          className="gap-2"
        >
          {copiedAll ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
          {copiedAll ? 'Copied!' : 'Copy All to Clipboard'}
        </Button>
      </div>

      {/* Prompt Template */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Prompt Template
              </CardTitle>
              <CardDescription className="mt-1">
                Describe your requirements to an AI assistant
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleCopyPrompt}
              className="gap-1 shrink-0"
            >
              {copiedPrompt ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copiedPrompt ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm whitespace-pre-wrap">
            <code>{aiData.prompt}</code>
          </pre>
        </CardContent>
      </Card>

      {/* Technical Specifications */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Code className="h-4 w-4 text-primary" />
                Technical Specifications
              </CardTitle>
              <CardDescription className="mt-1">
                API details, types, and request/response structures
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleCopySpecs}
              className="gap-1 shrink-0"
            >
              {copiedSpecs ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copiedSpecs ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm whitespace-pre-wrap">
            <code>{aiData.specs}</code>
          </pre>
        </CardContent>
      </Card>

      {/* Tips Card */}
      <Card className="bg-muted/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Tips for Best Results</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Modify the prompt to match your specific tech stack (e.g., replace "Supabase" with your backend)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Add any additional requirements or constraints specific to your project</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Use "Copy All" to give the AI both context and specs in one go</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Always test in sandbox environment before switching to production URLs</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </>
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
                : activeTab === 'ai'
                  ? `AI-ready prompts and specs to jumpstart your ${data.name} implementation.`
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
              variant={activeTab === 'ai' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => handleTabChange('ai')}
              className="rounded-md gap-1"
            >
              <Sparkles className="h-3 w-3" />
              AI Starter
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

        {activeTab === 'overview' && (
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

            {/* Integration Architecture (Combined) */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Integration Architecture</CardTitle>
                <CardDescription>{data.integrationArchitecture.dataFlow}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Flow Diagram */}
                <div className="bg-muted/50 rounded-lg p-4">
                  <code className="text-sm text-primary font-medium">
                    {data.integrationArchitecture.flow}
                  </code>
                </div>
                
                {/* Components & Steps Grid */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Architecture Components */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-foreground">Components</h4>
                    <div className="grid gap-2">
                      {data.integrationArchitecture.components.map((component, index) => (
                        <div key={index} className="bg-background border rounded-lg p-3 flex items-start gap-3">
                          <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                            <component.icon className="h-4 w-4 text-primary" />
                          </div>
                          <div className="space-y-0.5">
                            <div className="font-medium text-sm">{component.name}</div>
                            <div className="text-xs text-muted-foreground">{component.description}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Implementation Steps */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-foreground">Implementation Steps</h4>
                    <ol className="space-y-2 text-sm text-muted-foreground">
                      {data.integrationDetails.map((step, index) => (
                        <li key={index} className="flex gap-2">
                          <span className="text-primary font-medium shrink-0">{index + 1}.</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
                
                {/* Supported Payment Types */}
                <div className="flex items-center gap-3 pt-2 border-t">
                  <span className="text-sm font-medium text-muted-foreground">Supports:</span>
                  <div className="flex gap-2 flex-wrap">
                    {data.integrationArchitecture.supports.map(item => (
                      <Badge key={item} variant="outline" className={`text-xs ${isSaqA ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' : 'bg-amber-500/10 text-amber-600 border-amber-500/30'}`}>
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Content Grid */}
            <div className="grid md:grid-cols-2 gap-6">

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
        )}

        {activeTab === 'api' && (
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

            {/* API Examples with Step Indicators */}
            <div className="relative">
              {apiData?.examples.map((example, index) => (
                <div key={index} className="relative flex gap-4 pb-6 last:pb-0">
                  {/* Step Number with Connector */}
                  <div className="flex flex-col items-center shrink-0">
                    <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                    {index < (apiData?.examples.length ?? 0) - 1 && (
                      <div className="w-0.5 flex-1 bg-border mt-2" />
                    )}
                  </div>
                  
                  {/* Card Content */}
                  <Card className="flex-1">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <CardTitle className="text-base flex items-center gap-2">
                            <Code className="h-4 w-4 text-primary" />
                            {example.title}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {example.description}
                          </CardDescription>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={`text-xs shrink-0 ${
                            example.language === 'javascript' 
                              ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30' 
                              : example.language === 'html' 
                                ? 'bg-orange-500/10 text-orange-600 border-orange-500/30' 
                                : 'bg-blue-500/10 text-blue-600 border-blue-500/30'
                          }`}
                        >
                          {example.language.toUpperCase()}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CodeBlock code={example.code} />
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'ai' && (
          <AIStarterContent method={method} />
        )}
      </div>
    </div>
  );
};

export default MethodDetailPage;
