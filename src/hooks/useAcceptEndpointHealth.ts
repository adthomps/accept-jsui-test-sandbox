import { useEffect, useState } from 'react';

interface EndpointHealth {
  ok: boolean;
  host: string | null;
  version: string | null;
}

export function useAcceptEndpointHealth() {
  const [health, setHealth] = useState<EndpointHealth>({
    ok: true,
    host: null,
    version: null
  });

  useEffect(() => {
    // Check for Accept library endpoint after script loads
    const checkEndpoint = () => {
      const ep = (window as any)?.encryptEndPoint as string | undefined;
      const acceptVersion = (window as any)?.Accept ? 'Accept.js' : 
                           (window as any)?.acceptUIV2ResponseHandler ? 'AcceptUI v2' :
                           (window as any)?.acceptUIResponseHandler ? 'AcceptUI v3' : null;
      
      if (!ep) return;
      
      console.info('[Accept] encryptEndPoint:', ep, 'version:', acceptVersion);
      
      setHealth({
        host: ep,
        version: acceptVersion,
        ok: true // We'll assume it's ok for now, could add actual ping test
      });
    };

    // Check immediately and after a delay for script loading
    checkEndpoint();
    const timeout = setTimeout(checkEndpoint, 2000);
    
    return () => clearTimeout(timeout);
  }, []);

  return health;
}

export function logAcceptEndpoint() {
  if (typeof window !== 'undefined' && 'encryptEndPoint' in window) {
    console.info('[Accept] encryptEndPoint:', (window as any).encryptEndPoint);
  }
}