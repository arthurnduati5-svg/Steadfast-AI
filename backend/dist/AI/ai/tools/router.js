import { emotional_decoder, tone_generator, math_validate_answer, math_generate_question, formatting_polisher, emoji_policy_check, arabic_mode_formatter, memory_manager, } from "./handlers";
export async function toolRouter(toolName, args) {
    switch (toolName) {
        case "emotional_decoder":
            return emotional_decoder(args);
        case "tone_generator":
            return tone_generator(args);
        // case "teaching_micro_step":
        //   return teaching_micro_step(args);
        case "math_validate_answer":
            return math_validate_answer(args);
        case "math_generate_question":
            return math_generate_question(args);
        case "formatting_polisher":
            return formatting_polisher(args);
        case "emoji_policy_check":
            return emoji_policy_check(args);
        case "arabic_mode_formatter":
            return arabic_mode_formatter(args);
        // case "quran_pedagogy":
        //   return quran_pedagogy(args);
        case "memory_manager":
            return memory_manager(args);
        default:
            return { error: "Unknown tool: " + toolName };
    }
}
//# sourceMappingURL=router.js.map