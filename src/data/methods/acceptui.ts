import { Users, ArrowRight, Shield, CreditCard, Globe, MousePointer, LayoutGrid, Code, Server } from 'lucide-react';
import type { MethodData, ApiExamples, AIStarterContent, ComparisonCard } from '../types';

export const acceptuiMethod: MethodData = {
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
};

export const acceptuiApiExamples: ApiExamples = {
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
};

export const acceptuiAIStarter: AIStarterContent = {
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
};

export const acceptuiComparison: ComparisonCard = {
  id: 'acceptui',
  name: 'AcceptUI',
  badge: { type: 'saq-a', text: 'SAQ-A' },
  pciScope: 'No card data on your page (lowest PCI scope)',
  description: 'Hosted modal lightbox for quick integration',
  displayMethods: ['Lightbox Modal'],
  keyFeatures: [
    'Iframe-based modal',
    'No card data on page',
    'Credit card & eCheck',
    'Billing address option',
  ],
  bestFor: [
    'Quick integration',
    'Minimal PCI scope',
  ],
};
