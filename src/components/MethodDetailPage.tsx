import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ShieldCheck, ShieldAlert, ArrowRight, Ban, Code, Copy, Check, Sparkles, FileText, Clipboard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { methodData, apiExamples, aiStarterContent } from '@/data';

// Props for MethodDetailPage component
interface MethodDetailPageProps {
  method: string;
  onBack: () => void;
  onDemo: () => void;
  initialTab?: 'overview' | 'api';
}

type TabType = 'overview' | 'api' | 'ai' | 'demo';

const CodeBlock: React.FC<{ code: string }> = ({ code }) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast({ title: 'Copied to clipboard' });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 h-8 gap-1 text-xs"
        onClick={handleCopy}
      >
        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        {copied ? 'Copied' : 'Copy'}
      </Button>
      <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
        <code>{code}</code>
      </pre>
    </div>
  );
};

// AI Starter Content Component
const AIStarterContent: React.FC<{ method: string }> = ({ method }) => {
  const { toast } = useToast();
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedSpecs, setCopiedSpecs] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  
  const aiData = aiStarterContent[method];
  
  if (!aiData) return null;

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(aiData.prompt);
    setCopiedPrompt(true);
    toast({ title: 'Prompt copied to clipboard' });
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleCopySpecs = () => {
    navigator.clipboard.writeText(aiData.specs);
    setCopiedSpecs(true);
    toast({ title: 'Specs copied to clipboard' });
    setTimeout(() => setCopiedSpecs(false), 2000);
  };

  const handleCopyAll = () => {
    const combined = `${aiData.prompt}\n\n---\n\n${aiData.specs}`;
    navigator.clipboard.writeText(combined);
    setCopiedAll(true);
    toast({ title: 'All content copied to clipboard' });
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <>
      {/* Intro Banner */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium">AI-Ready Implementation Guide</p>
              <p className="text-sm text-muted-foreground">
                Copy the prompt template and technical specs below to use with your favorite AI assistant (ChatGPT, Claude, Copilot, etc.) to jumpstart your integration.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Copy All Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleCopyAll}
          className="gap-2"
        >
          {copiedAll ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
          {copiedAll ? 'Copied!' : 'Copy All to Clipboard'}
        </Button>
      </div>

      {/* Prompt Template */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Prompt Template
              </CardTitle>
              <CardDescription className="mt-1">
                Describe your requirements to an AI assistant
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleCopyPrompt}
              className="gap-1 shrink-0"
            >
              {copiedPrompt ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copiedPrompt ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm whitespace-pre-wrap">
            <code>{aiData.prompt}</code>
          </pre>
        </CardContent>
      </Card>

      {/* Technical Specifications */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Code className="h-4 w-4 text-primary" />
                Technical Specifications
              </CardTitle>
              <CardDescription className="mt-1">
                API details, types, and request/response structures
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleCopySpecs}
              className="gap-1 shrink-0"
            >
              {copiedSpecs ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copiedSpecs ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm whitespace-pre-wrap">
            <code>{aiData.specs}</code>
          </pre>
        </CardContent>
      </Card>

      {/* Tips Card */}
      <Card className="bg-muted/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Tips for Best Results</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Modify the prompt to match your specific tech stack (e.g., replace "Supabase" with your backend)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Add any additional requirements or constraints specific to your project</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Use "Copy All" to give the AI both context and specs in one go</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Always test in sandbox environment before switching to production URLs</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </>
  );
};

const MethodDetailPage: React.FC<MethodDetailPageProps> = ({ method, onBack, onDemo, initialTab = 'overview' }) => {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const data = methodData[method];
  const apiData = apiExamples[method];

  if (!data) return null;

  const isSaqA = data.badge.type === 'saq-a';

  const handleTabChange = (tab: TabType) => {
    if (tab === 'demo') {
      onDemo();
    } else {
      setActiveTab(tab);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/5 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-4">
          {/* Top row: Back button and Tab Navigation */}
          <div className="flex items-center justify-between gap-4">
            <Button variant="ghost" size="sm" onClick={onBack} className="gap-1 -ml-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            
            {/* Tab Navigation - Top Right */}
            <div className="flex bg-muted rounded-lg p-1 shrink-0">
              <Button
                variant={activeTab === 'overview' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => handleTabChange('overview')}
                className="rounded-md"
              >
                Overview
              </Button>
              <Button
                variant={activeTab === 'api' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => handleTabChange('api')}
                className="rounded-md"
              >
                API Examples
              </Button>
              <Button
                variant={activeTab === 'ai' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => handleTabChange('ai')}
                className="rounded-md gap-1"
              >
                <Sparkles className="h-3 w-3" />
                AI Starter
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleTabChange('demo')}
                className="rounded-md"
              >
                Demo
              </Button>
            </div>
          </div>

          {/* Title and Description */}
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold">
                {data.name}
                {activeTab === 'api' && ' – API Examples'}
              </h1>
              <Badge 
                variant="outline" 
                className={`gap-1 ${isSaqA ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' : 'bg-amber-500/10 text-amber-600 border-amber-500/30'}`}
              >
                {isSaqA ? <ShieldCheck className="h-3 w-3" /> : <ShieldAlert className="h-3 w-3" />}
                {data.badge.text}
              </Badge>
            </div>
            <p className="text-muted-foreground max-w-2xl">
              {activeTab === 'api' 
                ? `Practical request/response examples for ${data.name} integration.`
                : activeTab === 'ai'
                  ? `AI-ready prompts and specs to jumpstart your ${data.name} implementation.`
                  : data.description
              }
            </p>
            {activeTab === 'overview' && (
              <div className="flex gap-2 pt-2">
                {data.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {activeTab === 'overview' && (
          <>
            {/* How It Works Banner */}
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">How It Works</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 flex-wrap">
                  {data.howItWorks.steps.map((step, index) => (
                    <React.Fragment key={index}>
                      {step.label ? (
                        <div className="flex items-center gap-2 text-sm">
                          <step.icon className="h-4 w-4 text-primary" />
                          <span>{step.label}</span>
                        </div>
                      ) : (
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Integration Architecture (Combined) */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Integration Architecture</CardTitle>
                <CardDescription>{data.integrationArchitecture.dataFlow}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Flow Diagram */}
                <div className="bg-muted/50 rounded-lg p-4">
                  <code className="text-sm text-primary font-medium">
                    {data.integrationArchitecture.flow}
                  </code>
                </div>
                
                {/* Components & Steps Grid */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Architecture Components */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-foreground">Components</h4>
                    <div className="grid gap-2">
                      {data.integrationArchitecture.components.map((component, index) => (
                        <div key={index} className="bg-background border rounded-lg p-3 flex items-start gap-3">
                          <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                            <component.icon className="h-4 w-4 text-primary" />
                          </div>
                          <div className="space-y-0.5">
                            <div className="font-medium text-sm">{component.name}</div>
                            <div className="text-xs text-muted-foreground">{component.description}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Implementation Steps */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-foreground">Implementation Steps</h4>
                    <ol className="space-y-2 text-sm text-muted-foreground">
                      {data.integrationDetails.map((step, index) => (
                        <li key={index} className="flex gap-2">
                          <span className="text-primary font-medium shrink-0">{index + 1}.</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
                
                {/* Supported Payment Types */}
                <div className="flex items-center gap-3 pt-2 border-t">
                  <span className="text-sm font-medium text-muted-foreground">Supports:</span>
                  <div className="flex gap-2 flex-wrap">
                    {data.integrationArchitecture.supports.map(item => (
                      <Badge key={item} variant="outline" className={`text-xs ${isSaqA ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' : 'bg-amber-500/10 text-amber-600 border-amber-500/30'}`}>
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Content Grid */}
            <div className="grid md:grid-cols-2 gap-6">

              {/* Available Options */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Available Options</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {data.availableOptions.map((option, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>{option}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Best Use Cases */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Best Use Cases</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {data.bestUseCases.map((useCase, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>{useCase}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Security & Compliance */}
            <Card className={data.warnings.length > 0 ? 'border-amber-500/20' : ''}>
              <CardHeader>
                <CardTitle className="text-base">Security & Compliance</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {data.securityCompliance.map((item, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Warnings (if any) */}
            {data.warnings.length > 0 && (
              <Card className="bg-amber-500/5 border-amber-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2 text-amber-600">
                    <Ban className="h-4 w-4" />
                    Do Not Do This
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {data.warnings.map((warning, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-amber-600">•</span>
                        <span>{warning}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {activeTab === 'api' && (
          <>
            {/* Flow Banner */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="py-4">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-primary">Flow:</span>
                  <span className="text-muted-foreground">{apiData?.flow}</span>
                </div>
              </CardContent>
            </Card>

            {/* API Examples with Step Indicators */}
            <div className="relative">
              {apiData?.examples.map((example, index) => (
                <div key={index} className="relative flex gap-4 pb-6 last:pb-0">
                  {/* Step Number with Connector */}
                  <div className="flex flex-col items-center shrink-0">
                    <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                    {index < (apiData?.examples.length ?? 0) - 1 && (
                      <div className="w-0.5 flex-1 bg-border mt-2" />
                    )}
                  </div>
                  
                  {/* Card Content */}
                  <Card className="flex-1">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <CardTitle className="text-base flex items-center gap-2">
                            <Code className="h-4 w-4 text-primary" />
                            {example.title}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {example.description}
                          </CardDescription>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={`text-xs shrink-0 ${
                            example.language === 'javascript' 
                              ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30' 
                              : example.language === 'html' 
                                ? 'bg-orange-500/10 text-orange-600 border-orange-500/30' 
                                : 'bg-blue-500/10 text-blue-600 border-blue-500/30'
                          }`}
                        >
                          {example.language.toUpperCase()}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CodeBlock code={example.code} />
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'ai' && (
          <AIStarterContent method={method} />
        )}
      </div>
    </div>
  );
};

export default MethodDetailPage;
