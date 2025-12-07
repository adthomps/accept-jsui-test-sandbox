import React, { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Shield, CreditCard, User, MapPin, ExternalLink, UserCheck, ChevronDown, Code, Globe, Monitor, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

type DisplayMode = 'redirect' | 'lightbox' | 'iframe';

// Schema for new customers (requires all fields)
const newCustomerSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  address: z.string().min(1, "Address is required").max(100),
  city: z.string().min(1, "City is required").max(50),
  state: z.string().min(1, "State is required").max(20),
  zipCode: z.string().min(1, "ZIP code is required").max(10),
  country: z.string().default("US"),
  amount: z.number().min(0.01, "Amount must be at least $0.01").max(99999.99),
});

// Schema for returning customers (only need amount, email is separate field)
const returningCustomerSchema = z.object({
  amount: z.number().min(0.01, "Amount must be at least $0.01").max(99999.99),
});

interface CustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  amount: string;
}

interface AcceptHostedFormProps {
  onBack: () => void;
}

const AcceptHostedForm = ({ onBack }: AcceptHostedFormProps) => {
  const { toast } = useToast();
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    phone: "555-123-4567",
    address: "123 Main Street",
    city: "Bellevue",
    state: "WA",
    zipCode: "98004",
    country: "US",
    amount: "29.99",
  });
  const [isReturningCustomer, setIsReturningCustomer] = useState(false);
  const [existingCustomerEmail, setExistingCustomerEmail] = useState("");
  const [createProfile, setCreateProfile] = useState(true);
  const [saveNewPaymentMethod, setSaveNewPaymentMethod] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState("");
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [debugInfo, setDebugInfo] = useState<{
    requestPayload?: any;
    responseData?: any;
    error?: any;
    authorizeNetRequest?: any;
    authorizeNetResponse?: any;
  }>({});
  const [showDebug, setShowDebug] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  
  // Display mode state
  const [displayMode, setDisplayMode] = useState<DisplayMode>('redirect');
  const [showLightbox, setShowLightbox] = useState(false);
  const [showIframe, setShowIframe] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const lightboxIframeRef = useRef<HTMLIFrameElement>(null);

  // Get the iframeCommunicator URL based on current origin
  const getIframeCommunicatorUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/iFrameCommunicator.html`;
    }
    return 'https://accept-jsui-test-sandbox.lovable.app/iFrameCommunicator.html';
  };

  // Handle messages from the iFrameCommunicator
  const handleIframeMessage = useCallback((event: MessageEvent) => {
    console.log('📨 Received message from iframe:', event.data);
    
    // Parse the message if it's a string
    let messageData = event.data;
    if (typeof event.data === 'string') {
      try {
        messageData = JSON.parse(event.data);
      } catch {
        // If it's not JSON, use the string directly
        messageData = { action: event.data };
      }
    }
    
    // Handle different message types from Accept Hosted
    if (messageData.action === 'cancel') {
      console.log('🚫 Payment cancelled by user');
      setShowLightbox(false);
      setShowIframe(false);
      toast({
        title: "Payment Cancelled",
        description: "You cancelled the payment process.",
      });
    } else if (messageData.action === 'transactResponse') {
      console.log('✅ Transaction response received:', messageData);
      setShowLightbox(false);
      setShowIframe(false);
      
      // Parse the response
      const response = messageData.response ? JSON.parse(messageData.response) : null;
      if (response) {
        toast({
          title: response.responseCode === '1' ? "Payment Successful" : "Payment Failed",
          description: response.responseCode === '1' 
            ? `Transaction ID: ${response.transId}` 
            : response.responseText || "Transaction was not approved",
          variant: response.responseCode === '1' ? "default" : "destructive",
        });
      }
    } else if (messageData.action === 'resizeWindow') {
      console.log('📐 Resize request:', messageData);
      // Could handle iframe resizing here if needed
    }
  }, [toast]);

  // Set up message listener for iframe communication
  useEffect(() => {
    window.addEventListener('message', handleIframeMessage);
    return () => window.removeEventListener('message', handleIframeMessage);
  }, [handleIframeMessage]);

  const handleCustomerInfoChange = (field: keyof CustomerInfo, value: string) => {
    setCustomerInfo((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    try {
      if (isReturningCustomer) {
        // For returning customers, only validate amount and email lookup
        if (!existingCustomerEmail || !existingCustomerEmail.includes('@')) {
          setValidationErrors({ existingEmail: "Valid email is required to look up profile" });
          return false;
        }
        returningCustomerSchema.parse({
          amount: parseFloat(customerInfo.amount),
        });
      } else {
        // For new customers, validate all fields
        newCustomerSchema.parse({
          ...customerInfo,
          amount: parseFloat(customerInfo.amount),
        });
      }
      setValidationErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: { [key: string]: string } = {};
        error.issues.forEach((issue) => {
          if (issue.path[0]) {
            errors[issue.path[0] as string] = issue.message;
          }
        });
        setValidationErrors(errors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please correct the errors in the form",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setProcessingStep("Validating payment details...");

    try {
      console.log("🔵 Step 1: Submitting hosted payment request...");

      // For returning customers, only send amount (profile has the rest)
      // For new customers, send all customer info
      const basePayload = {
        returnUrl: `${window.location.origin}/payment-result`,
        cancelUrl: window.location.origin,
        debug: debugMode,
        displayMode,
        iframeCommunicatorUrl: displayMode !== 'redirect' ? getIframeCommunicatorUrl() : undefined,
      };

      const requestPayload = isReturningCustomer ? {
        ...basePayload,
        existingCustomerEmail: existingCustomerEmail,
        amount: parseFloat(customerInfo.amount),
        // For returning customers, optionally add new payment methods to their existing profile
        addPaymentToProfile: saveNewPaymentMethod,
      } : {
        ...basePayload,
        customerInfo: {
          firstName: customerInfo.firstName,
          lastName: customerInfo.lastName,
          email: customerInfo.email,
          phone: customerInfo.phone,
          address: customerInfo.address,
          city: customerInfo.city,
          state: customerInfo.state,
          zipCode: customerInfo.zipCode,
          country: customerInfo.country,
          amount: parseFloat(customerInfo.amount),
        },
        createProfile: createProfile,
      };

      // Store request for debugging
      setDebugInfo((prev) => ({ ...prev, requestPayload }));

      const { data, error } = await supabase.functions.invoke("accept-hosted-token", {
        body: requestPayload,
      });

      setProcessingStep("Generating secure payment token...");
      console.log("🔵 Step 2: Edge function response:", { data, error });

      // Store response for debugging
      setDebugInfo((prev) => ({
        ...prev,
        responseData: data,
        error: error,
        authorizeNetRequest: data?.debug?.request,
        authorizeNetResponse: data?.debug?.response,
      }));

      if (error) {
        console.error("Supabase function invocation error:", error);
        
        // Try to extract the actual error message from FunctionsHttpError
        let errorMessage = error.message;
        let errorTitle = "Payment Initialization Error";
        
        try {
          if (error.context && typeof error.context.json === 'function') {
            const errorBody = await error.context.json();
            console.log("Parsed error body:", errorBody);
            setDebugInfo((prev) => ({ ...prev, errorBody }));
            if (errorBody?.error) {
              errorMessage = errorBody.error;
              if (errorBody.error.includes("No customer profile found")) {
                errorTitle = "Customer Not Found";
              }
            }
          }
        } catch (jsonError) {
          console.error("Failed to parse error response:", jsonError);
        }
        
        toast({
          title: errorTitle,
          description: errorMessage,
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      if (!data) {
        throw new Error("No response data received from payment service");
      }

      if (data.success) {
        setProcessingStep("Token generated successfully!");
        console.log("✅ Step 3: Payment token generated successfully");
        console.log("🎫 Token:", data.token ? `${data.token.substring(0, 30)}...` : "undefined");

        setGeneratedToken(data.token);
        setShowDebug(true);

        // If debug mode, stop here and don't redirect
        if (debugMode) {
          setIsProcessing(false);
          toast({
            title: "Debug Mode: Token Generated",
            description: "Review the debug panel below. Click 'Continue to Payment' when ready.",
          });
          return;
        }

        setProcessingStep("Launching payment form...");
        toast({
          title: "Payment Ready",
          description: displayMode === 'redirect' 
            ? "Opening Authorize.Net hosted payment page..."
            : "Opening payment form...",
        });

        console.log("🚀 Step 4: Launching payment form with display mode:", displayMode);

        if (displayMode === 'redirect') {
          // Full page redirect - create a form to POST the token
          const form = document.createElement("form");
          form.method = "POST";
          form.action = "https://test.authorize.net/payment/payment";
          form.style.display = "none";

          const tokenInput = document.createElement("input");
          tokenInput.type = "hidden";
          tokenInput.name = "token";
          tokenInput.value = data.token;

          form.appendChild(tokenInput);
          document.body.appendChild(form);

          console.log("📤 Step 5: Submitting form to Authorize.Net hosted payment page...");

          // Submit the form after a small delay to show processing state
          setTimeout(() => {
            form.submit();
          }, 1000);
        } else if (displayMode === 'lightbox') {
          // Lightbox mode - show modal with iframe
          setGeneratedToken(data.token);
          setShowLightbox(true);
          setIsProcessing(false);
        } else if (displayMode === 'iframe') {
          // Embedded iframe mode - show inline iframe
          setGeneratedToken(data.token);
          setShowIframe(true);
          setIsProcessing(false);
        }
      } else {
        console.error("Payment token generation failed:", data);
        toast({
          title: "Payment Token Generation Failed",
          description: data.error || "Failed to generate payment token. Please check your information and try again.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Accept Hosted token error:", error);

      // Store error for debugging
      setDebugInfo((prev) => ({ ...prev, error }));

      let errorMessage = "Failed to initialize payment. Please try again.";
      let errorTitle = "Payment Initialization Error";

      // Try to extract error message from FunctionsHttpError response
      try {
        if (error?.context && typeof error.context.json === 'function') {
          const errorBody = await error.context.json();
          console.log("Parsed error body:", errorBody);
          setDebugInfo((prev) => ({ ...prev, errorBody }));
          if (errorBody?.error) {
            errorMessage = errorBody.error;
            if (errorBody.error.includes("No customer profile found")) {
              errorTitle = "Customer Not Found";
            }
          }
        }
      } catch (jsonError) {
        console.error("Failed to parse error response:", jsonError);
      }

      // Fallback to enhanced error message handling
      if (errorMessage === "Failed to initialize payment. Please try again." && error.message) {
        if (error.message.includes("Edge Function returned a non-2xx status code")) {
          errorMessage = "Payment service error. Check debug panel for details.";
        } else if (error.message.includes("Failed to fetch")) {
          errorMessage = "Network error. Please check your connection and try again.";
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });

      setIsProcessing(false);
    }
  };

  const handleContinueToPayment = () => {
    if (!generatedToken) {
      toast({
        title: "No Token",
        description: "Please generate a payment token first",
        variant: "destructive",
      });
      return;
    }

    const form = document.createElement("form");
    form.method = "POST";
    form.action = "https://test.authorize.net/payment/payment";
    form.style.display = "none";

    const tokenInput = document.createElement("input");
    tokenInput.type = "hidden";
    tokenInput.name = "token";
    tokenInput.value = generatedToken;

    form.appendChild(tokenInput);
    document.body.appendChild(form);
    form.submit();
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/5 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Accept Hosted Payment
            </h1>
            <p className="text-muted-foreground">Secure hosted payment page with customer profile support</p>
          </div>
          <div className="ml-auto flex gap-2">
            <Badge variant="secondary" className="gap-2">
              <Shield className="h-4 w-4" />
              PCI SAQ A Compliant
            </Badge>
            <Badge variant="outline" className="gap-2">
              <ExternalLink className="h-4 w-4" />
              Hosted Payment
            </Badge>
          </div>
        </div>

        {/* Debug Mode Toggle */}
        <Card className="shadow-card bg-gradient-card border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch id="debug-mode" checked={debugMode} onCheckedChange={setDebugMode} />
                <Label htmlFor="debug-mode" className="flex items-center gap-2 cursor-pointer">
                  <Code className="h-4 w-4 text-primary" />
                  Debug Mode - View API request/response details
                </Label>
              </div>
              {debugMode && <Badge variant="secondary">Debug Mode Active</Badge>}
            </div>
            {debugMode && (
              <p className="text-xs text-muted-foreground mt-2">
                When enabled, the payment token will be generated but you won't be redirected. Review the debug panel to inspect the API request/response.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Integration Architecture Info */}
        <Card className="border-blue-500/50 bg-blue-500/5">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Integration Architecture
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="default" className="text-xs">Accept Hosted</Badge>
                <span className="text-xs text-muted-foreground">SAQ-A Compliant</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Payment collection happens on Authorize.Net's secure hosted pages.
                Your server only generates a session token - no card data handling.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                <strong>Flow:</strong> Server Token → Display Form → Payment → Return/Callback
              </p>
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs">Customer Profiles</Badge>
                <span className="text-xs text-muted-foreground">CIM Integration</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Supports both new customers and returning customers with saved payment methods.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                <strong>Supports:</strong> One-time Payments, Profile Creation, Saved Payment Methods
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Display Method Selector */}
        <Card className="border-primary/20 bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Monitor className="h-4 w-4 text-primary" />
              Display Method
            </CardTitle>
            <CardDescription>Choose how the payment form is displayed</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={displayMode} onValueChange={(v) => setDisplayMode(v as DisplayMode)} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <RadioGroupItem value="redirect" id="redirect" className="peer sr-only" />
                <Label 
                  htmlFor="redirect" 
                  className="flex flex-col gap-2 p-4 border rounded-lg cursor-pointer hover:bg-accent/5 transition-colors peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                >
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <span className="font-medium">Full Page Redirect</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Customer leaves your site and completes payment on Authorize.Net's hosted page.
                  </p>
                  <Badge variant="secondary" className="w-fit text-xs">Simplest</Badge>
                </Label>
              </div>
              
              <div className="relative">
                <RadioGroupItem value="lightbox" id="lightbox" className="peer sr-only" />
                <Label 
                  htmlFor="lightbox" 
                  className="flex flex-col gap-2 p-4 border rounded-lg cursor-pointer hover:bg-accent/5 transition-colors peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                >
                  <div className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" />
                    <span className="font-medium">Lightbox (Popup)</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Payment form appears as a modal overlay. Customer stays on your site.
                  </p>
                  <Badge variant="secondary" className="w-fit text-xs">Seamless UX</Badge>
                </Label>
              </div>
              
              <div className="relative">
                <RadioGroupItem value="iframe" id="iframe" className="peer sr-only" />
                <Label 
                  htmlFor="iframe" 
                  className="flex flex-col gap-2 p-4 border rounded-lg cursor-pointer hover:bg-accent/5 transition-colors peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                >
                  <div className="flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    <span className="font-medium">Embedded iFrame</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Payment form embedded directly within your page layout.
                  </p>
                  <Badge variant="secondary" className="w-fit text-xs">Custom Integration</Badge>
                </Label>
              </div>
            </RadioGroup>
            
            {displayMode !== 'redirect' && (
              <Alert className="mt-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                <Code className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertDescription className="text-xs">
                  <strong>iFrameCommunicator:</strong> Uses <code className="bg-muted px-1 rounded">/iFrameCommunicator.html</code> for cross-origin messaging between your page and the hosted form.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Debug Panel */}
        {(debugInfo.requestPayload || debugInfo.responseData || debugInfo.error || generatedToken) && (
          <Card className="shadow-card bg-gradient-card border-primary/20">
            <Collapsible open={showDebug} onOpenChange={setShowDebug}>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-accent/5 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Code className="h-5 w-5 text-primary" />
                      Debug Information
                    </CardTitle>
                    <ChevronDown className={`h-5 w-5 transition-transform ${showDebug ? "rotate-180" : ""}`} />
                  </div>
                  <CardDescription>API request payload and response details for troubleshooting</CardDescription>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  {debugInfo.requestPayload && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold">Edge Function Request Payload</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            copyToClipboard(JSON.stringify(debugInfo.requestPayload, null, 2), "Request payload")
                          }
                        >
                          Copy
                        </Button>
                      </div>
                      <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto border">
                        {JSON.stringify(debugInfo.requestPayload, null, 2)}
                      </pre>
                    </div>
                  )}

                  {debugInfo.authorizeNetRequest && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold">Authorize.Net API Request (sanitized)</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            copyToClipboard(
                              JSON.stringify(debugInfo.authorizeNetRequest, null, 2),
                              "Authorize.Net request",
                            )
                          }
                        >
                          Copy
                        </Button>
                      </div>
                      <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto border">
                        {JSON.stringify(debugInfo.authorizeNetRequest, null, 2)}
                      </pre>
                    </div>
                  )}

                  {debugInfo.authorizeNetResponse && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold">Authorize.Net API Response</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            copyToClipboard(
                              JSON.stringify(debugInfo.authorizeNetResponse, null, 2),
                              "Authorize.Net response",
                            )
                          }
                        >
                          Copy
                        </Button>
                      </div>
                      <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto border">
                        {JSON.stringify(debugInfo.authorizeNetResponse, null, 2)}
                      </pre>
                    </div>
                  )}

                  {debugInfo.responseData && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold text-green-600 dark:text-green-400">
                          Edge Function Response
                        </Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            copyToClipboard(JSON.stringify(debugInfo.responseData, null, 2), "Response data")
                          }
                        >
                          Copy
                        </Button>
                      </div>
                      <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto border border-green-500/20">
                        {JSON.stringify(debugInfo.responseData, null, 2)}
                      </pre>
                      {debugInfo.responseData.token && (
                        <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                          <Shield className="h-4 w-4 text-green-600 dark:text-green-400" />
                          <AlertDescription className="text-xs">
                            ✅ Token generated successfully (length: {debugInfo.responseData.token.length} characters)
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}

                  {generatedToken && (
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Generated Token</Label>
                      <div className="bg-muted p-4 rounded-lg text-xs overflow-x-auto border border-primary/20">
                        <code className="break-all">{generatedToken}</code>
                      </div>
                      <Alert>
                        <AlertDescription className="text-xs">
                          This token will be POSTed to: <code>https://test.authorize.net/payment/payment</code>
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}

                  <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                    <AlertDescription className="text-xs">
                      💡 <strong>Tip:</strong> Check the edge function logs for the full Authorize.Net API
                      request/response. The logs contain sanitized versions showing the exact structure sent to
                      Authorize.Net.
                    </AlertDescription>
                  </Alert>

                  {debugInfo.error && (
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-destructive">Error Details</Label>
                      <pre className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg text-xs overflow-x-auto">
                        {JSON.stringify(debugInfo.error, null, 2)}
                      </pre>
                    </div>
                  )}

                  {generatedToken && debugMode && (
                    <div className="pt-4 border-t">
                      <Button onClick={handleContinueToPayment} className="w-full">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Continue to Payment Page
                      </Button>
                      <p className="text-xs text-muted-foreground text-center mt-2">
                        Click to proceed to Authorize.Net with the generated token
                      </p>
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Customer Information */}
          <Card className="shadow-card bg-gradient-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Customer Information
              </CardTitle>
              <CardDescription>Customer details for hosted payment processing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Customer Type Selection */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="returning-customer"
                    checked={isReturningCustomer}
                    onCheckedChange={setIsReturningCustomer}
                  />
                  <Label htmlFor="returning-customer" className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4" />
                    Returning Customer
                  </Label>
                </div>

                {isReturningCustomer && (
                  <div className="space-y-2">
                    <Label htmlFor="existingEmail">Existing Customer Email</Label>
                    <Input
                      id="existingEmail"
                      type="email"
                      placeholder="Enter your email to load saved payment methods"
                      value={existingCustomerEmail}
                      onChange={(e) => setExistingCustomerEmail(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      If you have saved payment methods, they will be available for selection
                    </p>
                  </div>
                )}
              </div>

              <Separator />

              <form onSubmit={handleSubmit} className="space-y-4">
                {isReturningCustomer ? (
                  // Simplified form for returning customers - only show amount
                  <div className="space-y-4">
                    <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                      <UserCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <AlertDescription className="text-sm">
                        <strong>Profile Lookup:</strong> Customer information will be loaded from your saved profile. 
                        Your saved payment methods will be available on the payment page.
                      </AlertDescription>
                    </Alert>
                    
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount ($) *</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        value={customerInfo.amount}
                        onChange={(e) => handleCustomerInfoChange("amount", e.target.value)}
                        className={validationErrors.amount ? "border-destructive" : ""}
                      />
                      {validationErrors.amount && <p className="text-xs text-destructive">{validationErrors.amount}</p>}
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="save-new-payment"
                          checked={saveNewPaymentMethod}
                          onCheckedChange={setSaveNewPaymentMethod}
                        />
                        <Label htmlFor="save-new-payment" className="cursor-pointer">
                          Save new payment method to profile
                        </Label>
                      </div>
                      
                      {saveNewPaymentMethod ? (
                        <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                          <CreditCard className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <AlertDescription className="text-sm">
                            If you enter a new payment method, it will be saved to your profile for future use.
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Use an existing saved payment method, or enter a new one for this transaction only.
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  // Full form for new customers
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name *</Label>
                        <Input
                          id="firstName"
                          value={customerInfo.firstName}
                          onChange={(e) => handleCustomerInfoChange("firstName", e.target.value)}
                          className={validationErrors.firstName ? "border-destructive" : ""}
                        />
                        {validationErrors.firstName && (
                          <p className="text-xs text-destructive">{validationErrors.firstName}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name *</Label>
                        <Input
                          id="lastName"
                          value={customerInfo.lastName}
                          onChange={(e) => handleCustomerInfoChange("lastName", e.target.value)}
                          className={validationErrors.lastName ? "border-destructive" : ""}
                        />
                        {validationErrors.lastName && (
                          <p className="text-xs text-destructive">{validationErrors.lastName}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={customerInfo.email}
                        onChange={(e) => handleCustomerInfoChange("email", e.target.value)}
                        className={validationErrors.email ? "border-destructive" : ""}
                      />
                      {validationErrors.email && <p className="text-xs text-destructive">{validationErrors.email}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={customerInfo.phone}
                          onChange={(e) => handleCustomerInfoChange("phone", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="amount">Amount ($) *</Label>
                        <Input
                          id="amount"
                          type="number"
                          step="0.01"
                          value={customerInfo.amount}
                          onChange={(e) => handleCustomerInfoChange("amount", e.target.value)}
                          className={validationErrors.amount ? "border-destructive" : ""}
                        />
                        {validationErrors.amount && <p className="text-xs text-destructive">{validationErrors.amount}</p>}
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <Label className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Billing Address
                      </Label>

                      <div className="space-y-2">
                        <Input
                          placeholder="Street Address *"
                          value={customerInfo.address}
                          onChange={(e) => handleCustomerInfoChange("address", e.target.value)}
                          className={validationErrors.address ? "border-destructive" : ""}
                        />
                        {validationErrors.address && <p className="text-xs text-destructive">{validationErrors.address}</p>}
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-2">
                          <Input
                            placeholder="City *"
                            value={customerInfo.city}
                            onChange={(e) => handleCustomerInfoChange("city", e.target.value)}
                            className={validationErrors.city ? "border-destructive" : ""}
                          />
                          {validationErrors.city && <p className="text-xs text-destructive">{validationErrors.city}</p>}
                        </div>
                        <div className="space-y-2">
                          <Input
                            placeholder="State *"
                            value={customerInfo.state}
                            onChange={(e) => handleCustomerInfoChange("state", e.target.value)}
                            className={validationErrors.state ? "border-destructive" : ""}
                          />
                          {validationErrors.state && <p className="text-xs text-destructive">{validationErrors.state}</p>}
                        </div>
                        <div className="space-y-2">
                          <Input
                            placeholder="ZIP *"
                            value={customerInfo.zipCode}
                            onChange={(e) => handleCustomerInfoChange("zipCode", e.target.value)}
                            className={validationErrors.zipCode ? "border-destructive" : ""}
                          />
                          {validationErrors.zipCode && (
                            <p className="text-xs text-destructive">{validationErrors.zipCode}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Payment Options */}
          <Card className="shadow-card bg-gradient-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Payment Options
              </CardTitle>
              <CardDescription>
                {isReturningCustomer 
                  ? "Available payment methods for this transaction"
                  : "One-time payment processing"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

              <div className="space-y-3">
                <h4 className="font-medium">Payment Options Available</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 p-3 border rounded-lg">
                    <CreditCard className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Credit Cards</p>
                      <p className="text-xs text-muted-foreground">Visa, MC, Amex, Discover</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 border rounded-lg">
                    <div className="h-5 w-5 bg-primary rounded flex items-center justify-center">
                      <span className="text-xs text-primary-foreground">eC</span>
                    </div>
                    <div>
                      <p className="font-medium">eCheck</p>
                      <p className="text-xs text-muted-foreground">Bank account payment</p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="font-medium">Security Features</h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span>PCI DSS Level 1 compliant hosting</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span>SSL encrypted payment processing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span>CVV and address verification</span>
                  </div>
                </div>
              </div>

              <Separator />

              <Button type="submit" className="w-full" disabled={isProcessing} onClick={handleSubmit}>
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
                    {processingStep || "Processing..."}
                  </div>
                ) : (
                  <>
                    {displayMode === 'redirect' && <Globe className="h-4 w-4 mr-2" />}
                    {displayMode === 'lightbox' && <ExternalLink className="h-4 w-4 mr-2" />}
                    {displayMode === 'iframe' && <Code className="h-4 w-4 mr-2" />}
                    {displayMode === 'redirect' && "Proceed to Hosted Payment"}
                    {displayMode === 'lightbox' && "Open Payment Lightbox"}
                    {displayMode === 'iframe' && "Show Payment Form"}
                  </>
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                {displayMode === 'redirect' && "You will be redirected to Authorize.Net's secure payment page"}
                {displayMode === 'lightbox' && "Payment form will open in a modal overlay on this page"}
                {displayMode === 'iframe' && "Payment form will be displayed below"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Testing Information */}
        <Card className="shadow-card bg-gradient-card border-primary/20">
          <CardHeader>
            <CardTitle className="text-primary">Testing Information</CardTitle>
            <CardDescription>Use these test credentials for sandbox testing</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Test Credit Cards</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Visa:</span>
                  <code className="bg-muted px-1 py-0.5 rounded">4111111111111111</code>
                </div>
                <div className="flex justify-between">
                  <span>Mastercard:</span>
                  <code className="bg-muted px-1 py-0.5 rounded">5424000000000015</code>
                </div>
                <div className="flex justify-between">
                  <span>Amex:</span>
                  <code className="bg-muted px-1 py-0.5 rounded">370000000000002</code>
                </div>
                <div className="flex justify-between">
                  <span>Discover:</span>
                  <code className="bg-muted px-1 py-0.5 rounded">6011000000000012</code>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Test Bank Account (eCheck)</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Routing:</span>
                  <code className="bg-muted px-1 py-0.5 rounded">111000025</code>
                </div>
                <div className="flex justify-between">
                  <span>Account:</span>
                  <code className="bg-muted px-1 py-0.5 rounded">123456789</code>
                </div>
                <div className="flex justify-between">
                  <span>Type:</span>
                  <code className="bg-muted px-1 py-0.5 rounded">Checking</code>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Card Details</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div>Expiry: Any future date (e.g., 12/2025)</div>
                <div>CVV: Any 3-4 digits (e.g., 123)</div>
                <div>ZIP: Any 5 digits (e.g., 12345)</div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Accept Hosted Integration</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div>Display Modes: Redirect, Lightbox, iFrame</div>
                <div>PCI Scope: SAQ A</div>
                <div>Profile Support: New & Returning</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Embedded iFrame Display */}
        {showIframe && generatedToken && (
          <Card className="shadow-card border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5 text-primary" />
                  Embedded Payment Form
                </CardTitle>
                <CardDescription>Complete your payment below</CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setShowIframe(false);
                  setGeneratedToken(null);
                }}
              >
                <X className="h-4 w-4 mr-1" />
                Close
              </Button>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden bg-background">
                <iframe
                  ref={iframeRef}
                  name="embedded_payment_iframe"
                  className="w-full min-h-[600px] border-0"
                  src="about:blank"
                />
                {/* Hidden form to POST token to iframe */}
                <form
                  id="embeddedPaymentForm"
                  method="POST"
                  action="https://test.authorize.net/payment/payment"
                  target="embedded_payment_iframe"
                  ref={(form) => {
                    if (form && generatedToken && showIframe) {
                      // Clear any existing inputs
                      form.innerHTML = '';
                      const input = document.createElement('input');
                      input.type = 'hidden';
                      input.name = 'token';
                      input.value = generatedToken;
                      form.appendChild(input);
                      // Submit on mount
                      setTimeout(() => form.submit(), 100);
                    }
                  }}
                />
              </div>
              <Alert className="mt-4">
                <Shield className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Payment form is loaded in a secure iFrame from Authorize.Net. Your card data never touches this site.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Lightbox Modal */}
      <Dialog open={showLightbox} onOpenChange={(open) => {
        if (!open) {
          setShowLightbox(false);
          setGeneratedToken(null);
        }
      }}>
        <DialogContent className="max-w-3xl h-[80vh] p-0 gap-0">
          <DialogHeader className="p-4 border-b">
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Secure Payment
            </DialogTitle>
            <DialogDescription>
              Complete your payment on Authorize.Net's secure form
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <iframe
              ref={lightboxIframeRef}
              name="lightbox_payment_iframe"
              className="w-full h-full border-0"
              style={{ minHeight: 'calc(80vh - 80px)' }}
              src="about:blank"
            />
            {/* Hidden form to POST token to lightbox iframe */}
            <form
              id="lightboxPaymentForm"
              method="POST"
              action="https://test.authorize.net/payment/payment"
              target="lightbox_payment_iframe"
              ref={(form) => {
                if (form && generatedToken && showLightbox) {
                  // Clear any existing inputs
                  form.innerHTML = '';
                  const input = document.createElement('input');
                  input.type = 'hidden';
                  input.name = 'token';
                  input.value = generatedToken;
                  form.appendChild(input);
                  // Submit on mount
                  setTimeout(() => form.submit(), 100);
                }
              }}
              style={{ display: 'none' }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AcceptHostedForm;
