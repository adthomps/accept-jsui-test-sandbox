import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, User, CreditCard, Shield, AlertCircle, CheckCircle, Loader2, Copy, Eye, RefreshCw, Code, ChevronDown, ShieldCheck } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AcceptCustomerFormProps {
  onBack: () => void;
}

interface CustomerProfile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  authorize_net_customer_profile_id: string;
  created_at: string;
  last_used_at?: string;
}

interface PaymentProfile {
  customerPaymentProfileId: string;
  cardNumber: string;
  cardType: string;
  expirationDate: string;
  billTo: any;
}

interface ShippingAddress {
  customerAddressId: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phoneNumber?: string;
}

interface FetchedProfile {
  customerProfileId: string;
  merchantCustomerId: string;
  description: string;
  email: string;
  paymentProfiles: PaymentProfile[];
  shippingAddresses: ShippingAddress[];
}

const AcceptCustomerForm: React.FC<AcceptCustomerFormProps> = ({ onBack }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [customerProfiles, setCustomerProfiles] = useState<CustomerProfile[]>([]);
  const [selectedTab, setSelectedTab] = useState('create');
  const [displayMode, setDisplayMode] = useState<'redirect' | 'lightbox' | 'iframe'>('redirect');
  
  // Get Profile states
  const [fetchedProfile, setFetchedProfile] = useState<FetchedProfile | null>(null);
  const [fetchProfileId, setFetchProfileId] = useState('');
  
  // Hosted Profile Page states (editPayment/editShipping map to 'manage' internally)
  const [pageType, setPageType] = useState<'manage' | 'addPayment' | 'addShipping' | 'editPayment' | 'editShipping'>('manage');
  const [paymentProfileId, setPaymentProfileId] = useState('');
  const [shippingAddressId, setShippingAddressId] = useState('');
  const [chargePaymentProfileId, setChargePaymentProfileId] = useState('');

  // Form states
  const [customerInfo, setCustomerInfo] = useState({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '555-123-4567',
    address: '123 Main Street',
    city: 'Bellevue',
    state: 'WA',
    zipCode: '98004',
    country: 'US'
  });

  const [paymentAmount, setPaymentAmount] = useState('29.99');
  const [selectedCustomerId, setSelectedCustomerId] = useState('524732491');

  useEffect(() => {
    loadCustomerProfiles();
    // Load saved profile from localStorage
    const savedProfileId = localStorage.getItem('selectedCustomerProfileId');
    if (savedProfileId) {
      setSelectedCustomerId(savedProfileId);
    }
  }, []);

  const loadCustomerProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomerProfiles(data || []);
    } catch (error) {
      console.error('Error loading customer profiles:', error);
    }
  };

  const handleCreateProfile = async () => {
    setLoading(true);
    setDebugInfo(null);

    try {
      const { data, error } = await supabase.functions.invoke('create-customer-profile', {
        body: {
          customerInfo,
          debug: debugMode
        }
      });

      if (error) throw error;

      if (debugMode && data.debug) {
        setDebugInfo(data.debug);
      }

      if (data.success) {
        const newProfileId = data.customerProfileId;
        toast({
          title: "Customer Profile Created",
          description: `Profile ID: ${newProfileId}`,
        });
        await loadCustomerProfiles();
        // Auto-select and persist the new profile
        setSelectedCustomerId(newProfileId);
        localStorage.setItem('selectedCustomerProfileId', newProfileId);
        setSelectedTab('manage');
        setPageType('addPayment');
      } else {
        throw new Error(data.error || 'Failed to create customer profile');
      }
    } catch (error: any) {
      console.error('Error creating customer profile:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to create customer profile',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Removed handleAddPaymentMethod - now using handleManageProfile with pageType='addPayment'

  const handleGetProfile = async () => {
    const profileId = fetchProfileId || selectedCustomerId;
    
    if (!profileId) {
      toast({
        title: "Error",
        description: "Please enter or select a customer profile ID",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setDebugInfo(null);

    try {
      const { data, error } = await supabase.functions.invoke('get-customer-profile', {
        body: {
          customerProfileId: profileId,
          debug: debugMode
        }
      });

      if (error) throw error;

      if (debugMode && data.debug) {
        setDebugInfo(data.debug);
      }

      if (data.success && data.profile) {
        setFetchedProfile(data.profile);
        toast({
          title: "Profile Fetched",
          description: `Found ${data.profile.paymentProfiles.length} payment(s) and ${data.profile.shippingAddresses.length} shipping address(es)`,
        });
      } else {
        throw new Error(data.error || 'Failed to fetch profile');
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      const msg = (error?.name === 'FunctionsHttpError')
        ? `Profile not found in Authorize.Net. Verify the ID${profileId ? ` (${profileId})` : ''} or create a new profile.`
        : (error.message || 'Failed to fetch profile');
      toast({
        title: "Error",
        description: msg,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManageProfile = async () => {
    // For editPayment/editShipping, we need the payment/shipping ID and customer profile ID
    if (pageType === 'editPayment') {
      if (!paymentProfileId) {
        toast({ title: "Missing Payment Profile ID", description: "Enter the Payment Profile ID to edit.", variant: "destructive" });
        return;
      }
      if (!selectedCustomerId) {
        toast({ title: "Missing Customer Profile ID", description: "Enter the Customer Profile ID that owns this payment method.", variant: "destructive" });
        return;
      }
    } else if (pageType === 'editShipping') {
      if (!shippingAddressId) {
        toast({ title: "Missing Shipping Address ID", description: "Enter the Shipping Address ID to edit.", variant: "destructive" });
        return;
      }
      if (!selectedCustomerId) {
        toast({ title: "Missing Customer Profile ID", description: "Enter the Customer Profile ID that owns this shipping address.", variant: "destructive" });
        return;
      }
    } else {
      // For all other page types, just need customer profile ID
      if (!selectedCustomerId) {
        toast({ title: "Error", description: "Please select a customer profile", variant: "destructive" });
        return;
      }
    }

    // Note: editPayment and editShipping redirect to 'manage' page
    // where users can select which payment/shipping to edit

    setLoading(true);
    setDebugInfo(null);

    try {
      const { data, error } = await supabase.functions.invoke('get-hosted-profile-token', {
        body: {
          customerProfileId: selectedCustomerId,
          pageType: pageType,
          paymentProfileId: paymentProfileId || undefined,
          shippingAddressId: shippingAddressId || undefined,
          returnUrl: window.location.href,
          debug: debugMode
        }
      });

      if (error) throw error;

      if (debugMode && data.debug) {
        setDebugInfo(data.debug);
      }

      if (data.success && data.token) {
        // Redirect to Authorize.Net hosted form
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = data.gatewayUrl;
        
        const tokenInput = document.createElement('input');
        tokenInput.type = 'hidden';
        tokenInput.name = 'token';
        tokenInput.value = data.token;
        form.appendChild(tokenInput);
        
        document.body.appendChild(form);
        form.submit();
      } else {
        throw new Error(data.error || 'Failed to get hosted page token');
      }
    } catch (error: any) {
      console.error('Error opening hosted page:', error);
      const msg = (error?.name === 'FunctionsHttpError')
        ? `Profile not found in Authorize.Net. Verify the ID${selectedCustomerId ? ` (${selectedCustomerId})` : ''} or create a new profile.`
        : (error.message || 'Failed to open hosted page');
      toast({
        title: "Error",
        description: msg,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChargeProfile = async () => {
    if (!selectedCustomerId) {
      toast({
        title: "Error",
        description: "Please select a customer profile",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setDebugInfo(null);

    try {
      const { data, error } = await supabase.functions.invoke('charge-customer-profile', {
        body: {
          customerProfileId: selectedCustomerId,
          customerPaymentProfileId: chargePaymentProfileId || undefined,
          amount: parseFloat(paymentAmount),
          debug: debugMode
        }
      });

      if (error) throw error;

      if (debugMode && data.debug) {
        setDebugInfo(data.debug);
      }

      if (data.success) {
        toast({
          title: "Payment Successful",
          description: `Transaction ID: ${data.transactionId}`,
        });
      } else {
        throw new Error(data.error || 'Payment failed');
      }
    } catch (error: any) {
      console.error('Error charging customer profile:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to charge customer profile',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Text copied to clipboard",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/5 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Accept Customer (CIM)
            </h1>
            <p className="text-muted-foreground">
              Hybrid integration using CIM API + Accept Customer Hosted Forms for SAQ-A compliance
            </p>
          </div>
          <div className="ml-auto flex gap-2">
            <Badge variant="secondary" className="gap-2">
              <Shield className="h-4 w-4" />
              Tokenized Storage
            </Badge>
            <Badge variant="outline" className="gap-2">
              <User className="h-4 w-4" />
              Customer Profiles
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
                When enabled, API requests and responses will be displayed for troubleshooting and development.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Integration Architecture Info */}
        <Card className="border-blue-500/50 bg-blue-500/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Integration Architecture
              </CardTitle>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 gap-1">
                <ShieldCheck className="h-3 w-3" />
                SAQ-A
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <p className="text-sm text-emerald-700 dark:text-emerald-400">
                <strong>Lowest PCI Scope:</strong> Card data collection uses hosted forms. 
                Direct API calls use only tokenized profile references.
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="default" className="text-xs">Accept Customer Hosted Forms</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Payment collection happens on Authorize.Net's secure hosted pages. 
                Your server never touches sensitive card data.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                <strong>Used for:</strong> Add Payment, Manage Profile (view/edit methods)
              </p>
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs">Direct CIM API</Badge>
                <span className="text-xs text-muted-foreground">Server-to-Server</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Direct API calls using tokenized references only. No sensitive card data in requests.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                <strong>Used for:</strong> Create Profile, Charge Profile (using saved tokens)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Debug Info Panel */}
        {debugMode && debugInfo && (
          <Collapsible defaultOpen>
            <Card className="border-yellow-500/50 bg-yellow-500/5">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-accent/5 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Code className="h-4 w-4" />
                      Debug Information
                    </CardTitle>
                    <ChevronDown className="h-4 w-4" />
                  </div>
                  <CardDescription>API request and response details for troubleshooting</CardDescription>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  {debugInfo.request && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold">API Request</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(JSON.stringify(debugInfo.request, null, 2))}
                        >
                          Copy
                        </Button>
                      </div>
                      <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto border max-h-48">
                        {JSON.stringify(debugInfo.request, null, 2)}
                      </pre>
                    </div>
                  )}
                  {debugInfo.response && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold">API Response</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(JSON.stringify(debugInfo.response, null, 2))}
                        >
                          Copy
                        </Button>
                      </div>
                      <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto border max-h-48">
                        {JSON.stringify(debugInfo.response, null, 2)}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}

        {/* Main Content Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="create" className="flex flex-col gap-1 py-3">
              <span>Create Profile</span>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">Direct API</Badge>
            </TabsTrigger>
            <TabsTrigger value="get-profile" className="flex flex-col gap-1 py-3">
              <span>Get Profile</span>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">Direct API</Badge>
            </TabsTrigger>
            <TabsTrigger value="manage" className="flex flex-col gap-1 py-3">
              <span>Hosted Page</span>
              <Badge variant="default" className="text-[10px] px-1.5 py-0">Hosted Form</Badge>
            </TabsTrigger>
            <TabsTrigger value="charge" className="flex flex-col gap-1 py-3">
              <span>Charge Profile</span>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">Direct API</Badge>
            </TabsTrigger>
          </TabsList>

          {/* Create Profile Tab */}
          <TabsContent value="create" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Create Customer Profile
                  <Badge variant="outline">Direct CIM API</Badge>
                </CardTitle>
                <CardDescription>
                  Uses <code className="bg-muted px-1 py-0.5 rounded text-xs">createCustomerProfileRequest</code> to create a customer profile via direct API call. 
                  No payment information is collected at this stage.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={customerInfo.firstName}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, firstName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={customerInfo.lastName}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, lastName: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={customerInfo.address}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={customerInfo.city}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, city: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={customerInfo.state}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, state: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">ZIP Code</Label>
                    <Input
                      id="zipCode"
                      value={customerInfo.zipCode}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, zipCode: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleCreateProfile}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Profile...
                    </>
                  ) : (
                    <>
                      <User className="mr-2 h-4 w-4" />
                      Create Customer Profile
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Get Profile Tab */}
          <TabsContent value="get-profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Get Customer Profile Details
                  <Badge variant="outline">Direct CIM API</Badge>
                </CardTitle>
                <CardDescription>
                  Uses <code className="bg-muted px-1 py-0.5 rounded text-xs">getCustomerProfileRequest</code> to fetch profile details including payment methods and shipping addresses. 
                  This retrieves the IDs needed to edit specific payment or shipping profiles.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Eye className="h-4 w-4" />
                  <AlertDescription>
                    Fetch profile details to see payment and shipping profile IDs. You can then use these IDs to edit specific payment methods or shipping addresses.
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-2">
                  <Label htmlFor="fetchProfileId">Customer Profile ID</Label>
                  <div className="flex gap-2">
                    <Input
                      id="fetchProfileId"
                      placeholder="Enter profile ID or select from list below"
                      value={fetchProfileId}
                      onChange={(e) => setFetchProfileId(e.target.value)}
                    />
                    <Button
                      onClick={handleGetProfile}
                      disabled={loading || (!fetchProfileId && !selectedCustomerId)}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Fetching...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Fetch
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  {customerProfiles.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      No customer profiles found. Create one first.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Or select from existing profiles:</Label>
                      {customerProfiles.map((profile) => (
                        <Card
                          key={profile.id}
                          className={`cursor-pointer transition-colors ${
                            fetchProfileId === profile.authorize_net_customer_profile_id
                              ? 'border-primary'
                              : 'hover:border-primary/50'
                          }`}
                          onClick={() => setFetchProfileId(profile.authorize_net_customer_profile_id)}
                        >
                          <CardContent className="pt-4 pb-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-sm">
                                  {profile.first_name} {profile.last_name}
                                </p>
                                <p className="text-xs text-muted-foreground">{profile.email}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  ID: {profile.authorize_net_customer_profile_id}
                                </p>
                              </div>
                              {fetchProfileId === profile.authorize_net_customer_profile_id && (
                                <CheckCircle className="h-4 w-4 text-primary" />
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                {/* Display fetched profile details */}
                {fetchedProfile && (
                  <Card className="border-primary/50 bg-primary/5">
                    <CardHeader>
                      <CardTitle className="text-base">Profile Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Customer Information
                        </h4>
                        <div className="text-sm space-y-1">
                          <p><strong>Email:</strong> {fetchedProfile.email}</p>
                          <p><strong>Profile ID:</strong> {fetchedProfile.customerProfileId}</p>
                          {fetchedProfile.merchantCustomerId && (
                            <p><strong>Merchant Customer ID:</strong> {fetchedProfile.merchantCustomerId}</p>
                          )}
                        </div>
                      </div>

                      {fetchedProfile.paymentProfiles.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            Payment Methods ({fetchedProfile.paymentProfiles.length})
                          </h4>
                          <div className="space-y-2">
                            {fetchedProfile.paymentProfiles.map((pp) => (
                              <Card key={pp.customerPaymentProfileId}>
                                <CardContent className="pt-3 pb-3">
                                  <div className="flex items-center justify-between">
                                    <div className="text-sm">
                                      <p className="font-medium">{pp.cardType} {pp.cardNumber}</p>
                                      <p className="text-xs text-muted-foreground">
                                        Payment Profile ID: {pp.customerPaymentProfileId}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        Expires: {pp.expirationDate}
                                      </p>
                                    </div>
                                     <Button
                                       size="sm"
                                       variant="outline"
                                       onClick={() => {
                                         setSelectedCustomerId(fetchedProfile.customerProfileId);
                                         setPaymentProfileId(pp.customerPaymentProfileId);
                                         setPageType('editPayment');
                                         setSelectedTab('manage');
                                         toast({
                                           title: "Ready to Edit",
                                           description: "Switched to Hosted Page (editPayment) with IDs filled",
                                         });
                                       }}
                                     >
                                       Edit
                                     </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}

                      {fetchedProfile.shippingAddresses.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Shipping Addresses ({fetchedProfile.shippingAddresses.length})
                          </h4>
                          <div className="space-y-2">
                            {fetchedProfile.shippingAddresses.map((addr) => (
                              <Card key={addr.customerAddressId}>
                                <CardContent className="pt-3 pb-3">
                                  <div className="flex items-center justify-between">
                                    <div className="text-sm">
                                      <p className="font-medium">
                                        {addr.firstName} {addr.lastName}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {addr.address}, {addr.city}, {addr.state} {addr.zip}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        Shipping ID: {addr.customerAddressId}
                                      </p>
                                    </div>
                                     <Button
                                       size="sm"
                                       variant="outline"
                                       onClick={() => {
                                         setSelectedCustomerId(fetchedProfile.customerProfileId);
                                         setShippingAddressId(addr.customerAddressId);
                                         setPageType('editShipping');
                                         setSelectedTab('manage');
                                         toast({
                                           title: "Ready to Edit",
                                           description: "Switched to Hosted Page (editShipping) with IDs filled",
                                         });
                                       }}
                                     >
                                       Edit
                                     </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}

                      {fetchedProfile.paymentProfiles.length === 0 && fetchedProfile.shippingAddresses.length === 0 && (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            This profile has no payment methods or shipping addresses yet.
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>


          {/* Manage Profile Tab / Hosted Profile Page */}
          <TabsContent value="manage" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Hosted Profile Page
                  <Badge variant="default">Accept Customer Hosted Form</Badge>
                </CardTitle>
                <CardDescription>
                  Uses <code className="bg-muted px-1 py-0.5 rounded text-xs">getHostedProfilePageRequest</code> to open Authorize.Net's hosted page for various actions: 
                  manage all payment methods, add a new payment, edit a specific payment, add shipping, or edit shipping.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {pageType === 'editPayment' && 'Enter the Payment Profile ID you want to edit, plus the Customer Profile ID that owns it.'}
                    {pageType === 'editShipping' && 'Enter the Shipping Address ID you want to edit, plus the Customer Profile ID that owns it.'}
                    {!['editPayment', 'editShipping'].includes(pageType) && 'Select a customer profile to manage, add payment methods, or add shipping addresses.'}
                  </AlertDescription>
                </Alert>
                
                {/* Page Type Selector */}
                <div className="space-y-2">
                  <Label htmlFor="pageType">Page Type</Label>
                  <Select value={pageType} onValueChange={(value: any) => setPageType(value)}>
                    <SelectTrigger id="pageType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manage">
                        <div className="flex items-center gap-2">
                          <span>Manage</span>
                          <span className="text-xs text-muted-foreground">- View/Edit All</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="addPayment">
                        <div className="flex items-center gap-2">
                          <span>Add Payment</span>
                          <span className="text-xs text-muted-foreground">- New Payment Method</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="addShipping">
                        <div className="flex items-center gap-2">
                          <span>Add Shipping</span>
                          <span className="text-xs text-muted-foreground">- New Shipping Address</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="editPayment">
                        <div className="flex items-center gap-2">
                          <span>Edit Payment</span>
                          <span className="text-xs text-muted-foreground">- Opens Manage to edit</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="editShipping">
                        <div className="flex items-center gap-2">
                          <span>Edit Shipping</span>
                          <span className="text-xs text-muted-foreground">- Opens Manage to edit</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Note: To edit payment methods or shipping addresses, use "Manage" which allows editing any saved item.
                  </p>
                </div>

                {/* For editPayment/editShipping: show payment/shipping ID first */}
                {pageType === 'editPayment' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="paymentProfileIdEdit" className="text-base font-semibold">Payment Profile ID</Label>
                      <Input
                        id="paymentProfileIdEdit"
                        placeholder="e.g., 536896667"
                        value={paymentProfileId}
                        onChange={(e) => setPaymentProfileId(e.target.value)}
                        className="text-base"
                      />
                      <p className="text-xs text-muted-foreground">
                        Enter the Payment Profile ID you want to edit (from Get Profile tab)
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ownerProfileIdEdit" className="text-sm">Customer Profile ID (Owner)</Label>
                      <Input
                        id="ownerProfileIdEdit"
                        placeholder="e.g., 524732491"
                        value={selectedCustomerId || ''}
                        onChange={(e) => setSelectedCustomerId(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        The customer profile that owns this payment method
                      </p>
                    </div>
                  </div>
                )}

                {pageType === 'editShipping' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="shippingAddressIdEdit" className="text-base font-semibold">Shipping Address ID</Label>
                      <Input
                        id="shippingAddressIdEdit"
                        placeholder="e.g., 524355496"
                        value={shippingAddressId}
                        onChange={(e) => setShippingAddressId(e.target.value)}
                        className="text-base"
                      />
                      <p className="text-xs text-muted-foreground">
                        Enter the Shipping Address ID you want to edit (from Get Profile tab)
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ownerProfileIdShipEdit" className="text-sm">Customer Profile ID (Owner)</Label>
                      <Input
                        id="ownerProfileIdShipEdit"
                        placeholder="e.g., 524732491"
                        value={selectedCustomerId || ''}
                        onChange={(e) => setSelectedCustomerId(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        The customer profile that owns this shipping address
                      </p>
                    </div>
                  </div>
                )}

                {/* For other page types: show customer profile selection as before */}
                {!['editPayment', 'editShipping'].includes(pageType) && (
                  <div className="space-y-4">
                    <Label>Select or Enter Customer Profile</Label>
                    
                    {/* Manual Profile ID Input */}
                    <div className="space-y-2">
                      <Label htmlFor="manualProfileId">Customer Profile ID</Label>
                      <Input
                        id="manualProfileId"
                        placeholder="Enter profile ID manually..."
                        value={selectedCustomerId || ''}
                        onChange={(e) => {
                          setSelectedCustomerId(e.target.value);
                          if (e.target.value) {
                            localStorage.setItem('selectedCustomerProfileId', e.target.value);
                          }
                        }}
                      />
                      <p className="text-xs text-muted-foreground">
                        You can type a profile ID directly or select from the list below
                      </p>
                    </div>

                    {/* Existing Profile List */}
                    {customerProfiles.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No customer profiles found. Create one first or enter a profile ID above.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Or select from existing profiles:</Label>
                        {customerProfiles.map((profile) => (
                          <Card
                            key={profile.id}
                            className={`cursor-pointer transition-colors ${
                              selectedCustomerId === profile.authorize_net_customer_profile_id
                                ? 'border-primary'
                                : 'hover:border-primary/50'
                            }`}
                            onClick={() => {
                              setSelectedCustomerId(profile.authorize_net_customer_profile_id);
                              localStorage.setItem('selectedCustomerProfileId', profile.authorize_net_customer_profile_id);
                            }}
                          >
                            <CardContent className="pt-6">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium">
                                    {profile.first_name} {profile.last_name}
                                  </p>
                                  <p className="text-sm text-muted-foreground">{profile.email}</p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Profile ID: {profile.authorize_net_customer_profile_id}
                                  </p>
                                </div>
                                {selectedCustomerId === profile.authorize_net_customer_profile_id && (
                                  <CheckCircle className="h-5 w-5 text-primary" />
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleManageProfile}
                  disabled={loading || !selectedCustomerId}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Opening Hosted Page...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Open Hosted Page
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Charge Profile Tab */}
          <TabsContent value="charge" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Charge Customer Profile
                  <Badge variant="outline">Direct CIM API</Badge>
                </CardTitle>
                <CardDescription>
                  Uses <code className="bg-muted px-1 py-0.5 rounded text-xs">createTransactionRequest</code> with <code className="bg-muted px-1 py-0.5 rounded text-xs">profileTransAuthOnly</code> transaction type. 
                  Processes charges against saved payment methods via direct API call (not part of Accept Customer hosted solution).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Enter a customer profile ID and optionally a specific payment profile ID to charge
                  </AlertDescription>
                </Alert>
                
                {/* Customer Profile ID */}
                <div className="space-y-2">
                  <Label htmlFor="chargeCustomerProfileId">Customer Profile ID</Label>
                  <Input
                    id="chargeCustomerProfileId"
                    placeholder="e.g., 524732491"
                    value={selectedCustomerId || ''}
                    onChange={(e) => {
                      setSelectedCustomerId(e.target.value);
                      if (e.target.value) {
                        localStorage.setItem('selectedCustomerProfileId', e.target.value);
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    The customer profile to charge (required)
                  </p>
                </div>

                {/* Payment Profile ID */}
                <div className="space-y-2">
                  <Label htmlFor="chargePaymentProfileId">Payment Profile ID</Label>
                  <Input
                    id="chargePaymentProfileId"
                    placeholder="e.g., 536896667 (optional - uses first if blank)"
                    value={chargePaymentProfileId}
                    onChange={(e) => setChargePaymentProfileId(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Specific payment method to charge (optional - if blank, charges the first/default payment profile)
                  </p>
                </div>

                {/* Existing Profile List */}
                {customerProfiles.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Or select from existing profiles:</Label>
                    {customerProfiles.map((profile) => (
                      <Card
                        key={profile.id}
                        className={`cursor-pointer transition-colors ${
                          selectedCustomerId === profile.authorize_net_customer_profile_id
                            ? 'border-primary'
                            : 'hover:border-primary/50'
                        }`}
                        onClick={() => {
                          setSelectedCustomerId(profile.authorize_net_customer_profile_id);
                          localStorage.setItem('selectedCustomerProfileId', profile.authorize_net_customer_profile_id);
                        }}
                      >
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">
                                {profile.first_name} {profile.last_name}
                              </p>
                              <p className="text-sm text-muted-foreground">{profile.email}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Profile ID: {profile.authorize_net_customer_profile_id}
                              </p>
                            </div>
                            {selectedCustomerId === profile.authorize_net_customer_profile_id && (
                              <CheckCircle className="h-5 w-5 text-primary" />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleChargeProfile}
                  disabled={loading || !selectedCustomerId}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing Payment...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Charge ${paymentAmount}
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Testing Information */}
        <Card>
          <CardHeader>
            <CardTitle>Testing Information</CardTitle>
            <CardDescription>Use these test cards and credentials in sandbox mode</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-4 gap-6">
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
              <h4 className="font-medium mb-2">Accept Customer Integration</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div>Methods: CIM API + Hosted Forms</div>
                <div>PCI Scope: SAQ A</div>
                <div>Profile Support: Create, Manage, Charge</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AcceptCustomerForm;
