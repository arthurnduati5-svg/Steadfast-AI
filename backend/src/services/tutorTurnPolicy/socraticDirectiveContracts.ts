export interface SocraticTutorDirective {
  shouldUseSocraticMethod: boolean;
  maxQuestions: number;
  maxHintsBeforeAttempt: number;
  mustAskOneGuidingQuestion: boolean;
  mustCheckLearnerAttempt: boolean;
  mustAvoidFinalAnswer: boolean;
  explanationDepth:
    | 'very_simple'
    | 'simple'
    | 'moderate'
    | 'deep';
  toneRules: string[];
  teachingMethodRules: string[];
  validationModes: string[];
  adaptivePacing:
    | 'slow_support'
    | 'balanced'
    | 'fast_challenge'
    | 'unknown';
}
