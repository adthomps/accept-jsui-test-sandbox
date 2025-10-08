import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, User, CreditCard, Shield, AlertCircle, CheckCircle, Loader2, Copy } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';

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

const AcceptCustomerForm: React.FC<AcceptCustomerFormProps> = ({ onBack }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [customerProfiles, setCustomerProfiles] = useState<CustomerProfile[]>([]);
  const [selectedTab, setSelectedTab] = useState('create');

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
        toast({
          title: "Customer Profile Created",
          description: `Profile ID: ${data.customerProfileId}`,
        });
        await loadCustomerProfiles();
        setSelectedTab('add-payment');
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

  const handleAddPaymentMethod = async () => {
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
      const { data, error } = await supabase.functions.invoke('add-payment-profile', {
        body: {
          customerProfileId: selectedCustomerId,
          returnUrl: window.location.href,
          cancelUrl: window.location.href,
          debug: debugMode
        }
      });

      if (error) throw error;

      if (debugMode && data.debug) {
        setDebugInfo(data.debug);
      }

      if (data.success && data.token) {
        // Redirect to Authorize.Net hosted form to add payment method
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = 'https://test.authorize.net/payment/payment';
        
        const tokenInput = document.createElement('input');
        tokenInput.type = 'hidden';
        tokenInput.name = 'token';
        tokenInput.value = data.token;
        form.appendChild(tokenInput);
        
        document.body.appendChild(form);
        form.submit();
      } else {
        throw new Error(data.error || 'Failed to get payment token');
      }
    } catch (error: any) {
      console.error('Error adding payment method:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to add payment method',
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
            <p className="text-muted-foreground">Customer Information Manager - Store and manage payment methods</p>
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="create">Create Profile</TabsTrigger>
            <TabsTrigger value="add-payment">Add Payment Method</TabsTrigger>
            <TabsTrigger value="charge">Charge Profile</TabsTrigger>
          </TabsList>

          {/* Create Profile Tab */}
          <TabsContent value="create" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Create Customer Profile</CardTitle>
                <CardDescription>
                  Create a new customer profile in the Customer Information Manager
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

          {/* Add Payment Method Tab */}
          <TabsContent value="add-payment" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Add Payment Method</CardTitle>
                <CardDescription>
                  Add a payment method to an existing customer profile
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Select a customer profile and click to add a payment method via hosted form
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
                        onClick={() => setSelectedCustomerId(profile.authorize_net_customer_profile_id)}
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
                    ))
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleAddPaymentMethod}
                  disabled={loading || !selectedCustomerId}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Token...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Add Payment Method
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
                <CardTitle>Charge Customer Profile</CardTitle>
                <CardDescription>
                  Charge a saved payment method for a customer
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
                        onClick={() => setSelectedCustomerId(profile.authorize_net_customer_profile_id)}
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
            <CardDescription>Test customer profile and payment methods</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Test Credit Cards:</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• Visa: 4111 1111 1111 1111</p>
                <p>• Mastercard: 5424 0000 0000 0015</p>
                <p>• CVV: Any 3 digits</p>
                <p>• Expiration: Any future date</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AcceptCustomerForm;
