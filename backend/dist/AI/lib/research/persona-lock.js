import { getMode } from './research-state';
export function personaAllowed() {
    const mode = getMode();
    return mode === 'teaching' || mode === 'chat';
}
export function enforceNoPersona(prompt) {
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
//# sourceMappingURL=persona-lock.js.map