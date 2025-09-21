import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, XCircle, Eye, EyeOff, Copy, Clock, CreditCard, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  authCode?: string;
  responseCode?: string;
  messageCode?: string;
  description?: string;
  avsResultCode?: string;
  cvvResultCode?: string;
  accountNumber?: string;
  accountType?: string;
  error?: string;
  errorCode?: string;
  resultCode?: string;
  gateway?: {
    messages: any[];
    errors: any[];
    responseCode?: string;
  };
  requestId: string;
  processing?: {
    startTime: number;
    endTime: number;
    duration: number;
    timestamp: string;
  };
  rawResponse?: any;
}

interface PaymentResponseDisplayProps {
  response: PaymentResponse;
  onDismiss?: () => void;
}

const PaymentResponseDisplay = ({ response, onDismiss }: PaymentResponseDisplayProps) => {
  const { toast } = useToast();
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const copyToClipboard = (text: string, label: string = 'Response data') => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
        variant: "default"
      });
    }).catch(() => {
      toast({
        title: "Copy failed",
        description: "Unable to copy to clipboard",
        variant: "destructive"
      });
    });
  };

  const copyFullResponse = () => {
    const fullData = JSON.stringify(response, null, 2);
    copyToClipboard(fullData, 'Full response data');
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getAVSDescription = (code: string) => {
    const avsMap: { [key: string]: string } = {
      'A': 'Address matches, ZIP does not',
      'B': 'Address matches, ZIP not verified',
      'E': 'AVS error',
      'G': 'Non-U.S. Card Issuing Bank',
      'N': 'No Match on Address or ZIP',
      'P': 'AVS not applicable for this transaction',
      'R': 'Retry',
      'S': 'Service not supported by issuer',
      'U': 'Address information is unavailable',
      'W': '9 digit ZIP matches, Address does not',
      'X': 'Address and 9 digit ZIP match',
      'Y': 'Address and 5 digit ZIP match',
      'Z': '5 digit ZIP matches, Address does not'
    };
    return avsMap[code] || `Unknown (${code})`;
  };

  const getCVVDescription = (code: string) => {
    const cvvMap: { [key: string]: string } = {
      'M': 'Match',
      'N': 'No Match',
      'P': 'Not Processed',
      'S': 'Should have been present',
      'U': 'Issuer unable to process request'
    };
    return cvvMap[code] || `Unknown (${code})`;
  };

  return (
    <Card className={`shadow-card ${response.success ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50'}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {response.success ? (
              <CheckCircle className="h-6 w-6 text-green-600" />
            ) : (
              <XCircle className="h-6 w-6 text-red-600" />
            )}
            <span className={response.success ? 'text-green-800' : 'text-red-800'}>
              Payment {response.success ? 'Successful' : 'Failed'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={copyFullResponse}>
              <Copy className="h-4 w-4 mr-2" />
              Copy for Support
            </Button>
            {onDismiss && (
              <Button variant="ghost" size="sm" onClick={onDismiss}>
                Dismiss
              </Button>
            )}
          </div>
        </CardTitle>
        <CardDescription>
          {response.success 
            ? 'Transaction completed successfully'
            : 'Transaction could not be processed'
          }
          {response.processing && (
            <span className="ml-2 text-xs">
              • Processed in {formatDuration(response.processing.duration)}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Success Details */}
        {response.success && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">Transaction ID</label>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono">
                    {response.transactionId}
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => copyToClipboard(response.transactionId || '', 'Transaction ID')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              {response.authCode && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Auth Code</label>
                  <Badge variant="secondary" className="font-mono">
                    {response.authCode}
                  </Badge>
                </div>
              )}
              
              {response.accountNumber && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Card</label>
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    <span className="text-sm">{response.accountType} {response.accountNumber}</span>
                  </div>
                </div>
              )}
            </div>

            {(response.avsResultCode || response.cvvResultCode) && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Security Verification
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-muted/50 rounded-lg">
                  {response.avsResultCode && (
                    <div>
                      <span className="text-xs font-medium">AVS Result: </span>
                      <Badge variant="outline" className="ml-1">
                        {response.avsResultCode}
                      </Badge>
                      <div className="text-xs text-muted-foreground mt-1">
                        {getAVSDescription(response.avsResultCode)}
                      </div>
                    </div>
                  )}
                  {response.cvvResultCode && (
                    <div>
                      <span className="text-xs font-medium">CVV Result: </span>
                      <Badge variant="outline" className="ml-1">
                        {response.cvvResultCode}
                      </Badge>
                      <div className="text-xs text-muted-foreground mt-1">
                        {getCVVDescription(response.cvvResultCode)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                {response.description || 'Payment has been successfully processed and authorized.'}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Failure Details */}
        {!response.success && (
          <div className="space-y-4">
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="font-medium">{response.error}</div>
                  {response.errorCode && (
                    <div className="text-sm">Error Code: {response.errorCode}</div>
                  )}
                </div>
              </AlertDescription>
            </Alert>

            {response.gateway?.errors && response.gateway.errors.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Gateway Errors</label>
                <div className="space-y-1">
                  {response.gateway.errors.map((error: any, index: number) => (
                    <div key={index} className="p-2 bg-red-50 border border-red-200 rounded text-sm">
                      <span className="font-medium">Code {error.errorCode}:</span> {error.errorText}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(response.avsResultCode || response.cvvResultCode) && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Security Check Results</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-muted/50 rounded-lg">
                  {response.avsResultCode && (
                    <div>
                      <span className="text-xs font-medium">AVS: </span>
                      <Badge variant={response.avsResultCode === 'Y' ? 'default' : 'destructive'}>
                        {response.avsResultCode}
                      </Badge>
                      <div className="text-xs text-muted-foreground mt-1">
                        {getAVSDescription(response.avsResultCode)}
                      </div>
                    </div>
                  )}
                  {response.cvvResultCode && (
                    <div>
                      <span className="text-xs font-medium">CVV: </span>
                      <Badge variant={response.cvvResultCode === 'M' ? 'default' : 'destructive'}>
                        {response.cvvResultCode}
                      </Badge>
                      <div className="text-xs text-muted-foreground mt-1">
                        {getCVVDescription(response.cvvResultCode)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <Separator />

        {/* Technical Details */}
        <Collapsible open={showTechnicalDetails} onOpenChange={setShowTechnicalDetails}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0">
              <span className="flex items-center gap-2">
                {showTechnicalDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                Technical Details
              </span>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 mt-4">
            {/* Request Information */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Request Information</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-muted/50 rounded-lg font-mono text-xs">
                <div>Request ID: {response.requestId}</div>
                {response.processing && (
                  <>
                    <div>Duration: {formatDuration(response.processing.duration)}</div>
                    <div>Timestamp: {new Date(response.processing.timestamp).toLocaleString()}</div>
                    <div>Response Code: {response.responseCode}</div>
                  </>
                )}
              </div>
            </div>

            {/* Raw Response */}
            {response.rawResponse && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-muted-foreground">Raw Gateway Response</label>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => copyToClipboard(JSON.stringify(response.rawResponse, null, 2), 'Raw response')}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                </div>
                <pre className="p-3 bg-muted/50 rounded-lg text-xs overflow-auto max-h-40 border">
                  {JSON.stringify(response.rawResponse, null, 2)}
                </pre>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Processing Time Info */}
        {response.processing && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>
              Processed at {new Date(response.processing.timestamp).toLocaleString()} 
              in {formatDuration(response.processing.duration)}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentResponseDisplay;