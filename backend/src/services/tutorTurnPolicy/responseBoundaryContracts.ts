export interface ResponseBoundary {
  allowedBehaviors: string[];
  disallowedBehaviors: string[];
  requiredBehaviors: string[];
  outputValidationRequired: boolean;
  policyTags: string[];
  safeFallbackMessage?: string;
}
