import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, Globe } from 'lucide-react';
import { useAcceptEndpointHealth } from '@/hooks/useAcceptEndpointHealth';

interface EndpointHealthDisplayProps {
  libraryLoaded: boolean;
  libraryName: string;
}

const EndpointHealthDisplay: React.FC<EndpointHealthDisplayProps> = ({ 
  libraryLoaded, 
  libraryName 
}) => {
  const endpointHealth = useAcceptEndpointHealth();

  const getStatusIcon = () => {
    if (libraryLoaded && endpointHealth.host) {
      return <CheckCircle className="h-4 w-4 text-success" />;
    }
    if (!libraryLoaded) {
      return <AlertTriangle className="h-4 w-4 text-warning" />;
    }
    return <Globe className="h-4 w-4 text-muted-foreground" />;
  };

  const getStatusVariant = (): "default" | "destructive" => {
    if (libraryLoaded && endpointHealth.host) return "default";
    return "destructive";
  };

  return (
    <Alert variant={getStatusVariant()}>
      {getStatusIcon()}
      <AlertDescription>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <strong>{libraryName} Status:</strong>
            <Badge variant={libraryLoaded ? "secondary" : "destructive"}>
              {libraryLoaded ? '✅ Loaded' : '⏳ Loading...'}
            </Badge>
          </div>
          <div className="text-sm space-y-1">
            <p><strong>Tokenization Host:</strong> {endpointHealth.host || 'Not detected'}</p>
            <p><strong>Library Version:</strong> {endpointHealth.version || 'Unknown'}</p>
            {endpointHealth.host && (
              <p className="text-xs text-muted-foreground">
                ℹ️ Browser will connect to {endpointHealth.host} for tokenization
              </p>
            )}
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default EndpointHealthDisplay;