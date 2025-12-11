import { Users, ArrowRight, CreditCard, Repeat, Database, Shield, Vault } from 'lucide-react';
import type { MethodData, ApiExamples, AIStarterContent, ComparisonCard } from '../types';

export const acceptcustomerMethod: MethodData = {
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
};

export const acceptcustomerApiExamples: ApiExamples = {
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
};

export const acceptcustomerAIStarter: AIStarterContent = {
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
};

export const acceptcustomerComparison: ComparisonCard = {
  id: 'acceptcustomer',
  name: 'Accept Customer',
  badge: { type: 'saq-a', text: 'SAQ-A' },
  pciScope: 'Hosted forms + Direct API for stored profiles',
  description: 'Stored payment profiles for recurring use',
  displayMethods: [
    'Hosted Profile Pages',
    'Direct API Calls',
  ],
  keyFeatures: [
    'Tokenized storage',
    'Multiple payment methods',
    'Hosted profile pages',
    'Direct API charging',
  ],
  bestFor: [
    'Subscription billing',
    'Repeat customers',
  ],
};
