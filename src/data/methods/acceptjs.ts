import { Code, CreditCard, ArrowRight, Shield, Globe, Monitor, Server, Lock } from 'lucide-react';
import type { MethodData, ApiExamples, AIStarterContent, ComparisonCard } from '../types';

export const acceptjsMethod: MethodData = {
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
};

export const acceptjsApiExamples: ApiExamples = {
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
};

export const acceptjsAIStarter: AIStarterContent = {
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
};

export const acceptjsComparison: ComparisonCard = {
  id: 'acceptjs',
  name: 'AcceptJS',
  badge: { type: 'saq-aep', text: 'SAQ A-EP' },
  pciScope: 'Card data enters your page (higher PCI scope)',
  description: 'Client-side tokenization with custom payment forms',
  displayMethods: ['Custom Form (your design)'],
  keyFeatures: [
    'Client-side tokenization',
    'Full design control',
    'Credit card & eCheck',
    'Real-time validation',
  ],
  bestFor: [
    'Custom branded checkout',
    'Maximum design flexibility',
  ],
};
