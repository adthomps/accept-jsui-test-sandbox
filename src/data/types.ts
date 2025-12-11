import { LucideIcon } from 'lucide-react';

export interface ApiExample {
  title: string;
  description: string;
  code: string;
  language: 'html' | 'javascript' | 'json';
}

export interface ApiExamples {
  flow: string;
  examples: ApiExample[];
}

export interface MethodStep {
  icon: LucideIcon;
  label: string;
}

export interface ArchitectureComponent {
  name: string;
  icon: LucideIcon;
  description: string;
}

export interface IntegrationArchitecture {
  flow: string;
  components: ArchitectureComponent[];
  dataFlow: string;
  supports: string[];
}

export interface MethodBadge {
  type: 'saq-a' | 'saq-aep';
  text: string;
}

export interface MethodData {
  name: string;
  badge: MethodBadge;
  description: string;
  tags: string[];
  howItWorks: {
    steps: MethodStep[];
  };
  integrationDetails: string[];
  integrationArchitecture: IntegrationArchitecture;
  availableOptions: string[];
  bestUseCases: string[];
  securityCompliance: string[];
  warnings: string[];
}

export interface AIStarterContent {
  prompt: string;
  specs: string;
}

export interface ComparisonCard {
  id: string;
  name: string;
  badge: MethodBadge;
  pciScope: string;
  description: string;
  displayMethods: string[];
  keyFeatures: string[];
  bestFor: string[];
}
