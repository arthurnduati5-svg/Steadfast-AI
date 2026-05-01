"use strict";
'use server';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.personalizedObjectives = personalizedObjectives;
/**
 * @fileOverview Generates personalized daily objectives for students based on performance signals.
 */
const genkit_1 = require("genkit");
const openai_1 = __importDefault(require("openai"));
const tutor_style_1 = require("./tutor-style");
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 30000,
});
const PersonalizedObjectivesInputSchema = genkit_1.z.object({
    studentPerformance: genkit_1.z.string().describe('The student\'s recent academic performance data.'),
    curriculum: genkit_1.z.string().describe('The curriculum for the current lesson or day.'),
    loggedMisconceptions: genkit_1.z.string().describe('Any misconceptions the student has demonstrated.'),
});
const PersonalizedObjectivesOutputSchema = genkit_1.z.object({
    dailyObjectives: genkit_1.z
        .array(genkit_1.z.string().describe('A list of 2-5 personalized daily objectives for the student.'))
        .describe('An array of personalized daily objectives'),
});
const ObjectivesPayloadSchema = genkit_1.z.object({
    objectives: genkit_1.z.array(genkit_1.z.string().min(4)).min(2).max(5),
});
function fallbackObjectives(input) {
    const curriculumTopic = (0, tutor_style_1.normalizeTutorText)(input.curriculum || 'today\'s topic');
    return {
        dailyObjectives: [
            `Review the key concept from ${curriculumTopic} in your own words.`,
            `Practice one targeted question and explain each step clearly.`,
            `Correct one misconception from yesterday and state the right rule.`,
        ],
    };
}
function sanitizeObjectives(values) {
    const cleaned = values
        .map((value) => (0, tutor_style_1.normalizeTutorText)(value))
        .filter(Boolean)
        .map((value) => (/[.!?]$/.test(value) ? value : `${value}.`));
    const deduped = Array.from(new Set(cleaned));
    return deduped.slice(0, 5);
}
async function personalizedObjectives(input) {
    return personalizedObjectivesFlow(input);
}
const personalizedObjectivesFlow = async (input) => {
    const basePrompt = (0, tutor_style_1.buildUnifiedTutorPrompt)({ mode: 'objectives', language: 'english' });
    const systemMessage = `
${basePrompt}

Create personalized daily learning objectives.
Return strict JSON only:
{"objectives":["...","..."]}

Rules:
- 2 to 4 objectives.
- Each objective starts with a verb.
- Be specific to curriculum and misconceptions.
- Keep each objective short, clear, and encouraging.

Student signals:
- Performance: ${input.studentPerformance}
- Curriculum: ${input.curriculum}
- Misconceptions: ${input.loggedMisconceptions}
`;
    try {
        const completion = await openai.chat.completions.create({
            messages: [{ role: 'system', content: systemMessage }],
            model: 'gpt-4o-mini',
            response_format: { type: 'json_object' },
        });
        const raw = completion.choices[0].message.content || '';
        if (!raw)
            return fallbackObjectives(input);
        const parsed = ObjectivesPayloadSchema.safeParse(JSON.parse(raw));
        if (!parsed.success) {
            return fallbackObjectives(input);
        }
        const objectives = sanitizeObjectives(parsed.data.objectives);
        if (objectives.length < 2) {
            return fallbackObjectives(input);
        }
        return { dailyObjectives: objectives };
    }
    catch {
        return fallbackObjectives(input);
    }
};
//# sourceMappingURL=personalize-daily-objectives.js.map