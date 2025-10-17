import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, User, CreditCard, Shield, AlertCircle, CheckCircle, Loader2, Copy, Eye, RefreshCw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  
  // Hosted Profile Page states (editPayment/editShipping removed - use 'manage' instead)
  const [pageType, setPageType] = useState<'manage' | 'addPayment' | 'addShipping'>('manage');
  const [paymentProfileId, setPaymentProfileId] = useState('');
  const [shippingAddressId, setShippingAddressId] = useState('');

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
  const [selectedCustomerId, setSelectedCustomerId] = useState('');

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
      toast({
        title: "Error",
        description: error.message || 'Failed to fetch profile',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManageProfile = async () => {
    if (!selectedCustomerId) {
      toast({
        title: "Error",
        description: "Please select a customer profile",
        variant: "destructive"
      });
      return;
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
      toast({
        title: "Error",
        description: error.message || 'Failed to open hosted page',
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
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Debug Mode</span>
              </div>
              <Button
                variant={debugMode ? "default" : "outline"}
                size="sm"
                onClick={() => setDebugMode(!debugMode)}
              >
                {debugMode ? 'Enabled' : 'Disabled'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Integration Architecture Info */}
        <Card className="border-blue-500/50 bg-blue-500/5">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Integration Architecture
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="default" className="text-xs">Accept Customer Hosted Forms</Badge>
                <span className="text-xs text-muted-foreground">SAQ-A Compliant</span>
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
          <Card className="border-yellow-500/50 bg-yellow-500/5">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Debug Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">API Request</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(JSON.stringify(debugInfo.request, null, 2))}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-48">
                  {JSON.stringify(debugInfo.request, null, 2)}
                </pre>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">API Response</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(JSON.stringify(debugInfo.response, null, 2))}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-48">
                  {JSON.stringify(debugInfo.response, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
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
                                        setPageType('manage');
                                        setSelectedTab('manage');
                                        toast({
                                          title: "Ready to Manage",
                                          description: "Switched to Hosted Page tab (manage) to edit payment methods",
                                        });
                                      }}
                                    >
                                      Manage
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
                                        setPageType('manage');
                                        setSelectedTab('manage');
                                        toast({
                                          title: "Ready to Manage",
                                          description: "Switched to Hosted Page tab (manage) to edit shipping addresses",
                                        });
                                      }}
                                    >
                                      Manage
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
                    Select the page type below. For addPayment/addShipping, you can specify the customer profile ID to add to.
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
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Note: To edit payment methods or shipping addresses, use "Manage" which allows editing any saved item.
                  </p>
                </div>

                {/* Customer Profile Selection */}
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
                    Select a customer profile with saved payment methods to charge
                  </AlertDescription>
                </Alert>
                <div className="space-y-4">
                  {customerProfiles.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No customer profiles found. Create one first.
                    </div>
                  ) : (
                    customerProfiles.map((profile) => (
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
                            </div>
                            {selectedCustomerId === profile.authorize_net_customer_profile_id && (
                              <CheckCircle className="h-5 w-5 text-primary" />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
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
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Test Credit Cards:</h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>• Visa: <code className="bg-muted px-1 py-0.5 rounded">4111 1111 1111 1111</code></p>
                  <p>• Mastercard: <code className="bg-muted px-1 py-0.5 rounded">5424 0000 0000 0015</code></p>
                  <p>• Amex: <code className="bg-muted px-1 py-0.5 rounded">3782 822463 10005</code></p>
                  <p>• Discover: <code className="bg-muted px-1 py-0.5 rounded">6011 0000 0000 0012</code></p>
                  <p>• CVV: Any 3-4 digits</p>
                  <p>• Expiration: Any future date</p>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Validation Mode:</h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p><strong>testMode</strong> - Field validation only (Luhn check)</p>
                  <p className="text-xs">• No processor interaction</p>
                  <p className="text-xs">• No authorization required</p>
                  <p className="text-xs">• No billing address needed</p>
                  <p className="text-xs mt-2"><strong>liveMode</strong> - $0.00/$0.01 auth</p>
                  <p className="text-xs">• Requires billing address</p>
                  <p className="text-xs">• Creates temp transaction</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AcceptCustomerForm;
