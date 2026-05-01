"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toolRouter = toolRouter;
const handlers_1 = require("./handlers");
async function toolRouter(toolName, args, context) {
    switch (toolName) {
        case 'emotional_decoder':
            return (0, handlers_1.emotional_decoder)(args);
        case 'tone_generator':
            return (0, handlers_1.tone_generator)(args);
        case 'teaching_micro_step':
            return (0, handlers_1.teaching_micro_step)(args);
        case 'math_validate_answer':
            return (0, handlers_1.math_validate_answer)(args);
        case 'math_generate_question':
            return (0, handlers_1.math_generate_question)(args);
        case 'formatting_polisher':
            return (0, handlers_1.formatting_polisher)(args);
        case 'emoji_policy_check':
            return (0, handlers_1.emoji_policy_check)(args);
        case 'arabic_mode_formatter':
            return (0, handlers_1.arabic_mode_formatter)(args);
        case 'quran_pedagogy':
            return (0, handlers_1.quran_pedagogy)(args);
        case 'memory_manager':
            return (0, handlers_1.memory_manager)(args, context);
        default:
            return { error: 'Unknown tool: ' + toolName };
    }
}
//# sourceMappingURL=router.js.map