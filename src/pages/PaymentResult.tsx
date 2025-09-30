import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, XCircle, AlertCircle, ArrowLeft } from 'lucide-react';

const PaymentResult = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<string>('');
  const [transactionDetails, setTransactionDetails] = useState<any>({});

  useEffect(() => {
    const statusParam = searchParams.get('status') || '';
    setStatus(statusParam);

    // Extract all transaction details from URL params
    const details = {
      transactionId: searchParams.get('transactionId'),
      responseCode: searchParams.get('responseCode'),
      authCode: searchParams.get('authCode'),
      amount: searchParams.get('amount'),
      accountNumber: searchParams.get('accountNumber'),
      accountType: searchParams.get('accountType'),
      customerProfileId: searchParams.get('customerProfileId'),
      customerPaymentProfileId: searchParams.get('customerPaymentProfileId'),
      responseText: searchParams.get('responseText'),
    };

    setTransactionDetails(details);
  }, [searchParams]);

  const getStatusIcon = () => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-16 w-16 text-green-500" />;
      case 'declined':
        return <XCircle className="h-16 w-16 text-destructive" />;
      case 'cancelled':
        return <AlertCircle className="h-16 w-16 text-yellow-500" />;
      default:
        return <AlertCircle className="h-16 w-16 text-destructive" />;
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500">Payment Successful</Badge>;
      case 'declined':
        return <Badge variant="destructive">Payment Declined</Badge>;
      case 'cancelled':
        return <Badge variant="secondary">Payment Cancelled</Badge>;
      default:
        return <Badge variant="destructive">Payment Error</Badge>;
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'approved':
        return 'Your payment has been processed successfully.';
      case 'declined':
        return 'Your payment was declined. Please try again with a different payment method.';
      case 'cancelled':
        return 'You cancelled the payment process.';
      default:
        return 'An error occurred while processing your payment.';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            {getStatusIcon()}
          </div>
          <div className="space-y-2">
            {getStatusBadge()}
            <CardTitle className="text-3xl">Payment Result</CardTitle>
            <CardDescription className="text-lg">
              {getStatusMessage()}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {status === 'approved' && transactionDetails.transactionId && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Transaction Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Transaction ID</p>
                    <p className="font-mono">{transactionDetails.transactionId}</p>
                  </div>
                  {transactionDetails.authCode && (
                    <div>
                      <p className="text-muted-foreground">Authorization Code</p>
                      <p className="font-mono">{transactionDetails.authCode}</p>
                    </div>
                  )}
                  {transactionDetails.amount && (
                    <div>
                      <p className="text-muted-foreground">Amount</p>
                      <p className="font-semibold">${transactionDetails.amount}</p>
                    </div>
                  )}
                  {transactionDetails.accountNumber && (
                    <div>
                      <p className="text-muted-foreground">Payment Method</p>
                      <p>{transactionDetails.accountType} ending in {transactionDetails.accountNumber}</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {status === 'declined' && transactionDetails.responseText && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="font-semibold">Decline Reason</h3>
                <p className="text-sm text-muted-foreground">{transactionDetails.responseText}</p>
              </div>
            </>
          )}

          <Separator />

          <div className="flex justify-center gap-4">
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
            {status === 'declined' && (
              <Button onClick={() => navigate('/')}>
                Try Again
              </Button>
            )}
          </div>

          {status === 'approved' && (
            <div className="text-center text-sm text-muted-foreground">
              <p>A confirmation email has been sent to your email address.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentResult;
