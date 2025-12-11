import { Globe, ArrowRight, Shield, CreditCard, Repeat, Server, Webhook } from 'lucide-react';
import type { MethodData, ApiExamples, AIStarterContent, ComparisonCard } from '../types';

export const accepthostedMethod: MethodData = {
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
};

export const accepthostedApiExamples: ApiExamples = {
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
};

export const accepthostedAIStarter: AIStarterContent = {
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
};

export const accepthostedComparison: ComparisonCard = {
  id: 'accepthosted',
  name: 'Accept Hosted',
  badge: { type: 'saq-a', text: 'SAQ-A' },
  pciScope: 'No card data on your page (lowest PCI scope)',
  description: 'Flexible hosted payment with multiple display options',
  displayMethods: [
    'Full Page Redirect',
    'Lightbox (Popup)',
    'Embedded iFrame',
    'Customer profiles',
  ],
  keyFeatures: [],
  bestFor: [
    'Enterprise applications',
    'Multi-step checkouts',
    'Maximum security',
    'Flexible UX needs',
  ],
};
