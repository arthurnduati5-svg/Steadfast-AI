import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();

function readRepoFile(relativePath: string): string {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function getFunctionBody(source: string, functionName: string): string {
  const candidates = [
    `const ${functionName} =`,
    `async function ${functionName}`,
    `function ${functionName}`,
  ];
  const fnStart = candidates
    .map((token) => source.indexOf(token))
    .find((idx) => idx >= 0) ?? -1;
  if (fnStart < 0) {
    throw new Error(`Could not find function: ${functionName}`);
  }

  const firstBrace = source.indexOf('{', fnStart);
  if (firstBrace < 0) {
    throw new Error(`Could not find function body start for: ${functionName}`);
  }

  let depth = 0;
  for (let i = firstBrace; i < source.length; i += 1) {
    const ch = source[i];
    if (ch === '{') depth += 1;
    if (ch === '}') depth -= 1;
    if (depth === 0) {
      return source.slice(firstBrace, i + 1);
    }
  }

  throw new Error(`Could not find function body end for: ${functionName}`);
}

describe('Copilot draft persistence contract', () => {
  it('keeps textarea draft when starting a new chat', () => {
    const copilotTsx = readRepoFile('frontend/components/steadfast-copilot.tsx');
    const handleNewChatBody = getFunctionBody(copilotTsx, 'handleNewChat');

    expect(handleNewChatBody).not.toContain("setInput('')");
    expect(handleNewChatBody).toContain('setMessages([])');
    expect(handleNewChatBody).toContain('setSelectedFile(null)');
  });

  it('still clears textarea only after sending a message', () => {
    const copilotTsx = readRepoFile('frontend/components/steadfast-copilot.tsx');
    const sendStart = copilotTsx.indexOf('async function handleSendMessage');
    const sendEnd = copilotTsx.indexOf('const handleContinueChat =');
    if (sendStart < 0 || sendEnd < 0 || sendEnd <= sendStart) {
      throw new Error('Could not locate handleSendMessage section.');
    }
    const handleSendMessageSection = copilotTsx.slice(sendStart, sendEnd);

    expect(handleSendMessageSection).toContain("setInput('')");
  });
});
