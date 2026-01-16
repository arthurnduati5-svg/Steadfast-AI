import { getMode } from './research-state';

export function personaAllowed(): boolean {
  const mode = getMode();
  return mode === 'teaching' || mode === 'chat';
}

export function enforceNoPersona(prompt: string): string {
  if (!personaAllowed()) {
    return `
SYSTEM RULE:
- teaching tone
- No metaphors
- No examples
- No opinions
- No emotions

${prompt}
`;
  }

  return prompt;
}
