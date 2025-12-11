import type { MethodData, ApiExamples, AIStarterContent, ComparisonCard } from './types';

// Accept.js
import { acceptjsMethod, acceptjsApiExamples, acceptjsAIStarter, acceptjsComparison } from './methods/acceptjs';

// Accept UI
import { acceptuiMethod, acceptuiApiExamples, acceptuiAIStarter, acceptuiComparison } from './methods/acceptui';

// Accept Hosted
import { accepthostedMethod, accepthostedApiExamples, accepthostedAIStarter, accepthostedComparison } from './methods/accepthosted';

// Accept Customer
import { acceptcustomerMethod, acceptcustomerApiExamples, acceptcustomerAIStarter, acceptcustomerComparison } from './methods/acceptcustomer';

// Method data lookup
export const methodData: Record<string, MethodData> = {
  acceptjs: acceptjsMethod,
  acceptui: acceptuiMethod,
  accepthosted: accepthostedMethod,
  acceptcustomer: acceptcustomerMethod,
};

// API examples lookup
export const apiExamples: Record<string, ApiExamples> = {
  acceptjs: acceptjsApiExamples,
  acceptui: acceptuiApiExamples,
  accepthosted: accepthostedApiExamples,
  acceptcustomer: acceptcustomerApiExamples,
};

// AI starter content lookup
export const aiStarterContent: Record<string, AIStarterContent> = {
  acceptjs: acceptjsAIStarter,
  acceptui: acceptuiAIStarter,
  accepthosted: accepthostedAIStarter,
  acceptcustomer: acceptcustomerAIStarter,
};

// Comparison cards for selector
export const comparisonCards: ComparisonCard[] = [
  acceptjsComparison,
  acceptuiComparison,
  accepthostedComparison,
  acceptcustomerComparison,
];

// Re-export types
export type { MethodData, ApiExamples, AIStarterContent, ComparisonCard } from './types';
