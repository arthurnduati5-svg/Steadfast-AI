"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.personaAllowed = personaAllowed;
exports.enforceNoPersona = enforceNoPersona;
const research_state_1 = require("./research-state");
function personaAllowed() {
    const mode = (0, research_state_1.getMode)();
    return mode === 'teaching' || mode === 'chat';
}
function enforceNoPersona(prompt) {
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