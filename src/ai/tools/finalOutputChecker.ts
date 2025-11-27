import { FinalOutputCheckerInput, FinalOutputCheckerOutput } from './toolSchemas';

export async function finalOutputCheckerTool(input: FinalOutputCheckerInput): Promise<FinalOutputCheckerOutput> {
  const failures: string[] = [];
  const msg = input.candidateMessage || '';
  // Check basic forbidden tokens (adjust to your exact policy)
  const forbidden = ['\\', '*', '`', '{', '}', '[', ']'];
  for (const ch of forbidden) {
    if (msg.includes(ch)) failures.push(`Contains forbidden character: ${ch}`);
  }
  // Single question mark at end
  const qmCount = (msg.match(/\?/g) || []).length;
  if (qmCount !== 1 || !msg.trim().endsWith('?')) {
    failures.push('Must have exactly one question mark at the very end.');
  }
  // Shortness check: max 3 sentences
  const sentences = msg.split(/[.?!]+/).filter(s => s.trim().length > 0);
  if (sentences.length > 3) failures.push('Too many sentences for copilot window.');
  // Language mode checks could be added here
  return { passed: failures.length === 0, failures };
}
