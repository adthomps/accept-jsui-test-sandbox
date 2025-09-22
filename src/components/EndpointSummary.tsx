import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Globe, Shield, Info } from 'lucide-react';

const EndpointSummary = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Accept.js Library Endpoints & CSP Configuration
          </CardTitle>
          <CardDescription>
            Understanding tokenization hosts and security policies for each Accept.js version
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Library Endpoint Mapping */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold">Library URLs (Sandbox)</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between p-2 rounded bg-muted/20">
                  <span className="font-medium">Accept.js v1:</span>
                  <code className="text-xs bg-muted px-2 py-1 rounded">v1/Accept.js</code>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-muted/20">
                  <span className="font-medium">AcceptUI v2:</span>
                  <code className="text-xs bg-muted px-2 py-1 rounded">v2/AcceptUI.js</code>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-muted/20">
                  <span className="font-medium">AcceptUI v3:</span>
                  <code className="text-xs bg-muted px-2 py-1 rounded">v3/AcceptUI.js</code>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold">Tokenization Hosts</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">v1</Badge>
                  <span>api2.authorize.net</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">v2/v3</Badge>
                  <span>api.authorize.net</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">Sandbox</Badge>
                  <span>jstest.authorize.net</span>
                </div>
              </div>
            </div>
          </div>

          {/* CSP Configuration */}
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">Required CSP Configuration:</p>
                <div className="bg-muted/40 p-3 rounded text-xs font-mono overflow-x-auto">
                  <div>connect-src 'self' https://api.authorize.net https://api2.authorize.net https://jstest.authorize.net;</div>
                  <div>script-src 'self' 'unsafe-inline' https://js.authorize.net https://jstest.authorize.net;</div>
                  <div>frame-src 'self' https://js.authorize.net https://jstest.authorize.net;</div>
                </div>
              </div>
            </AlertDescription>
          </Alert>

          {/* PCI Compliance Information */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary">SAQ A-EP</Badge>
              </div>
              <h4 className="font-medium">Accept.js v1</h4>
              <p className="text-sm text-muted-foreground">You handle card inputs, full UX control</p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">SAQ A Legacy</Badge>
              </div>
              <h4 className="font-medium">AcceptUI v2</h4>
              <p className="text-sm text-muted-foreground">Legacy popup, maintain for migration</p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="default">SAQ A Modern</Badge>
              </div>
              <h4 className="font-medium">AcceptUI v3</h4>
              <p className="text-sm text-muted-foreground">Modern iframe overlay, recommended</p>
            </div>
          </div>

          {/* Implementation Notes */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">Implementation Notes:</p>
                <ul className="text-sm space-y-1">
                  <li>• AcceptUI v3 is recommended for new implementations</li>
                  <li>• Accept.js v1 provides maximum UX customization</li>
                  <li>• AcceptUI v2 should only be used for legacy maintenance</li>
                  <li>• All tokenization happens in the browser to these specific hosts</li>
                  <li>• CSP policies must allow both api.authorize.net and api2.authorize.net</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default EndpointSummary;