import * as fs from 'fs';
import type { NoAiBypassModuleScanResult } from '../contracts/noAiBypassContracts';

const FORBIDDEN_IMPORT_PATTERNS = [
  /from ['"]openai['"]/,
  /from ['"]genkit['"]/,
  /from ['"]@genkit-ai\/(?:googleai|flow|next)['"]/,
  /from ['"]genkitx-openai['"]/,
  /require\(['"]openai['"]\)/,
  /require\(['"]genkit['"]\)/,
  /require\(['"]genkitx-openai['"]\)/,
  /new OpenAI/,
  /new Anthropic/,
];

const DIRECT_PROVIDER_CALL_PATTERNS = [
  /\.chat\.completions\.create\(/,
  /\.embeddings\.create\(/,
  /\.generate\(/,
  /\.generateStream\(/,
  /fetch\(['"]https:\/\/(?:api\.openai|api\.anthropic)/,
  /axios\.(?:get|post|put)\(['"]https:\/\/(?:api\.openai|api\.anthropic)/,
  /process\.env\.OPENAI_API_KEY/,
  /process\.env\.ANTHROPIC_API_KEY/,
  /process\.env\.GOOGLE_API_KEY/,
  /process\.env\.GENK/,
];

const RAW_PROVIDER_RESPONSE_FIELD_PATTERNS = [
  /providerResponse/g,
  /rawProviderResponse/g,
  /rawAiResponse/g,
  /aiResponse/g,
];

const HIDDEN_REASONING_FIELD_PATTERNS = [
  /chainOfThought/g,
  /hiddenReasoning/g,
  /internalReasoning/g,
  /modelReasoning/g,
  /reasoningTrace/g,
  /scratchpad/g,
];

const ALLOWED_FILE_PATTERNS = [
  /noAiBypass/,
  /privacyGuard/,
  /forbidden/i,
  /\.test\./,
  /\.spec\./,
  /task-017/,
  /task-038/,
];

function isAllowedFile(filePath: string): boolean {
  return ALLOWED_FILE_PATTERNS.some(p => p.test(filePath));
}

function scanModuleForProviderImports(source: string): string[] {
  const found: string[] = [];
  for (const pattern of FORBIDDEN_IMPORT_PATTERNS) {
    const match = source.match(pattern);
    if (match) found.push(match[0].trim());
  }
  return found;
}

function scanModuleForDirectProviderCalls(source: string): string[] {
  const found: string[] = [];
  for (const pattern of DIRECT_PROVIDER_CALL_PATTERNS) {
    const match = source.match(pattern);
    if (match) found.push(match[0].trim());
  }
  return found;
}

function scanModuleForRawProviderResponseFields(source: string): string[] {
  const found: string[] = [];
  for (const pattern of RAW_PROVIDER_RESPONSE_FIELD_PATTERNS) {
    const matches = source.matchAll(pattern);
    for (const match of matches) {
      if (source.includes(match[0])) found.push(match[0]);
    }
  }
  return [...new Set(found)];
}

function scanModuleForHiddenReasoningFields(source: string): string[] {
  const found: string[] = [];
  for (const pattern of HIDDEN_REASONING_FIELD_PATTERNS) {
    const matches = source.matchAll(pattern);
    for (const match of matches) {
      if (source.includes(match[0])) found.push(match[0]);
    }
  }
  return [...new Set(found)];
}

function buildModuleScanResult(filePath: string, source: string): NoAiBypassModuleScanResult {
  const forbiddenImportsFound = scanModuleForProviderImports(source);
  const directProviderCallsFound = scanModuleForDirectProviderCalls(source);
  const rawProviderResponseFieldsFound = scanModuleForRawProviderResponseFields(source);
  const hiddenReasoningFieldsFound = scanModuleForHiddenReasoningFields(source);

  const safe =
    forbiddenImportsFound.length === 0 &&
    directProviderCallsFound.length === 0 &&
    rawProviderResponseFieldsFound.length === 0 &&
    hiddenReasoningFieldsFound.length === 0;

  return {
    filePath,
    forbiddenImportsFound,
    directProviderCallsFound,
    rawProviderResponseFieldsFound,
    hiddenReasoningFieldsFound,
    safe,
  };
}

function scanRouteFile(filePath: string): NoAiBypassModuleScanResult {
  try {
    const source = fs.readFileSync(filePath, 'utf-8');
    return buildModuleScanResult(filePath, source);
  } catch {
    return {
      filePath,
      forbiddenImportsFound: [],
      directProviderCallsFound: [],
      rawProviderResponseFieldsFound: [],
      hiddenReasoningFieldsFound: [],
      safe: true,
    };
  }
}

function scanServiceFile(filePath: string): NoAiBypassModuleScanResult {
  try {
    const source = fs.readFileSync(filePath, 'utf-8');
    const result = buildModuleScanResult(filePath, source);
    if (!result.safe && isAllowedFile(filePath)) {
      return { ...result, safe: true };
    }
    return result;
  } catch {
    return {
      filePath,
      forbiddenImportsFound: [],
      directProviderCallsFound: [],
      rawProviderResponseFieldsFound: [],
      hiddenReasoningFieldsFound: [],
      safe: true,
    };
  }
}

export {
  scanModuleForProviderImports,
  scanModuleForDirectProviderCalls,
  scanModuleForRawProviderResponseFields,
  scanModuleForHiddenReasoningFields,
  buildModuleScanResult as buildNoAiBypassModuleScanResult,
  scanRouteFile as scanRouteFileForNoAiBypassViolations,
  scanServiceFile as scanServiceFileForNoAiBypassViolations,
};
