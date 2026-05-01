"use strict";
'use server';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAdaptiveHint = generateAdaptiveHint;
/**
 * @fileOverview Generates adaptive hints for students based on their current problem and progress.
 */
const genkit_1 = require("genkit");
const openai_1 = __importDefault(require("openai"));
const tutor_style_1 = require("./tutor-style");
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY,
});
const GenerateAdaptiveHintInputSchema = genkit_1.z.object({
    problemDescription: genkit_1.z.string().describe('The description of the problem the student is working on.'),
    studentProgress: genkit_1.z.string().describe('The current progress of the student in solving the problem.'),
    hintLadder: genkit_1.z
        .array(genkit_1.z.string())
        .describe('An array of hints, ordered from least to most helpful. H0: Reframe, H1: Concept Cue, H2: Strategy Step, H3: Partial Work.'),
    currentHintIndex: genkit_1.z.number().describe('The index of the current hint being given to the student.'),
    hintCount: genkit_1.z.number().describe('The number of hints already given for the current problem.'),
    attemptsCount: genkit_1.z.number().describe('The number of incorrect attempts made by the student.'),
    masteryLevel: genkit_1.z.number().optional().describe("Optional: Student's mastery level for the relevant knowledge component."),
    hintMax: genkit_1.z.number().describe('Maximum hints before considering guided solve.'),
    attemptThreshold: genkit_1.z.number().describe('Maximum attempts before considering guided solve.'),
    masteryThreshold: genkit_1.z.number().describe('Mastery level below which guided solve is considered if student is stuck.'),
    isDailyObjectiveMode: genkit_1.z.boolean().describe('Boolean indicating if the copilot is currently in daily objectives mode.'),
    knowledgeComponentTags: genkit_1.z.array(genkit_1.z.string()).optional().describe('Optional: Pre-identified knowledge component tags for the problem.'),
});
const GenerateAdaptiveHintOutputSchema = genkit_1.z.object({
    hint: genkit_1.z.string().describe('The adaptive hint generated for the student.'),
    nextHintIndex: genkit_1.z.number().describe('The index of the next hint to be given to the student.'),
    hintLevel: genkit_1.z.enum(['H0', 'H1', 'H2', 'H3', 'GUIDED_SOLVE', 'REFUSAL']).describe('The level of the hint provided.'),
    mode: genkit_1.z.enum(['daily_objective', 'chat', 'history']).describe('The current operating mode of the copilot.'),
    kcTags: genkit_1.z.array(genkit_1.z.string()).describe('Knowledge component tags relevant to the problem.'),
    actions: genkit_1.z.array(genkit_1.z.string()).describe('Suggested actions for the UI (e.g., request_attempt, offer_guided_solve).'),
    tone: genkit_1.z.enum(['neutral', 'supportive', 'celebratory', 'deescalate']).describe("The detected tone of the student's input and the copilot's response tone."),
});
const PromptOutputSchema = genkit_1.z.object({
    generatedHint: genkit_1.z.string(),
    determinedNextHintIndex: genkit_1.z.number(),
    determinedHintLevel: genkit_1.z.enum(['H0', 'H1', 'H2', 'H3', 'GUIDED_SOLVE', 'REFUSAL']),
    suggestedActions: genkit_1.z.array(genkit_1.z.string()),
    responseTone: genkit_1.z.enum(['neutral', 'supportive', 'celebratory', 'deescalate']),
    determinedMode: genkit_1.z.enum(['daily_objective', 'chat', 'history']),
    determinedKcTags: genkit_1.z.array(genkit_1.z.string()),
});
function clampIndex(value, max) {
    if (max <= 0)
        return 0;
    return Math.max(0, Math.min(value, max - 1));
}
function levelFromIndex(index) {
    if (index <= 0)
        return 'H0';
    if (index === 1)
        return 'H1';
    if (index === 2)
        return 'H2';
    return 'H3';
}
function detectRefusal(progress) {
    return /\b(just give.*answer|final answer|solve it for me|just tell me answer)\b/i.test(progress);
}
function detectGuidedSolveTrigger(input) {
    const progress = input.studentProgress || '';
    const explicitStuck = /\b(i don'?t know|i have no idea|i'?m stuck|show me steps|guide me)\b/i.test(progress);
    const masteryLow = typeof input.masteryLevel === 'number' &&
        input.masteryLevel < (input.masteryThreshold || 0.25) &&
        /\b(stuck|confused|lost|struggling)\b/i.test(progress);
    return (explicitStuck ||
        input.hintCount >= input.hintMax ||
        input.attemptsCount >= input.attemptThreshold ||
        masteryLow);
}
function fallbackHint(input) {
    const ladder = input.hintLadder || [];
    const mode = input.isDailyObjectiveMode ? 'daily_objective' : 'chat';
    const kcTags = input.knowledgeComponentTags || [];
    const current = clampIndex(input.currentHintIndex || 0, ladder.length || 1);
    const refusal = detectRefusal(input.studentProgress);
    const guided = !refusal && detectGuidedSolveTrigger(input);
    if (refusal) {
        return {
            hint: (0, tutor_style_1.ensureSingleQuestionAtEnd)("I cannot give the final answer directly, but I can guide you through the method."),
            nextHintIndex: current,
            hintLevel: 'REFUSAL',
            mode,
            kcTags,
            actions: ['offer_guided_solve'],
            tone: 'supportive',
        };
    }
    if (guided) {
        const next = clampIndex(current + 1, ladder.length || 1);
        const guidedText = ladder[next] || 'Use the key formula, compute one intermediate step, then finish the last step yourself.';
        return {
            hint: (0, tutor_style_1.ensureSingleQuestionAtEnd)(`Guided-Solve Mode. ${(0, tutor_style_1.normalizeTutorText)(guidedText)}`),
            nextHintIndex: next,
            hintLevel: 'GUIDED_SOLVE',
            mode,
            kcTags,
            actions: ['request_attempt'],
            tone: 'supportive',
        };
    }
    const nextIndex = clampIndex(current + (input.attemptsCount > 0 ? 1 : 0), ladder.length || 1);
    const hintText = ladder[nextIndex] || 'Start by identifying what is known and what you need to find.';
    return {
        hint: (0, tutor_style_1.ensureSingleQuestionAtEnd)((0, tutor_style_1.normalizeTutorText)(hintText)),
        nextHintIndex: nextIndex,
        hintLevel: levelFromIndex(nextIndex),
        mode,
        kcTags,
        actions: ['request_attempt'],
        tone: input.attemptsCount > 0 ? 'supportive' : 'neutral',
    };
}
function mapPromptOutput(output) {
    return {
        hint: (0, tutor_style_1.ensureSingleQuestionAtEnd)((0, tutor_style_1.normalizeTutorText)(output.generatedHint)),
        nextHintIndex: output.determinedNextHintIndex,
        hintLevel: output.determinedHintLevel,
        mode: output.determinedMode,
        kcTags: output.determinedKcTags,
        actions: output.suggestedActions,
        tone: output.responseTone,
    };
}
async function generateAdaptiveHint(input) {
    return generateAdaptiveHintFlow(input);
}
const generateAdaptiveHintFlow = async (input) => {
    const hintLadderString = input.hintLadder.map((hint, index) => `${index}. ${hint}`).join('\n');
    const mode = input.isDailyObjectiveMode ? 'daily_objective' : 'chat';
    const basePrompt = (0, tutor_style_1.buildUnifiedTutorPrompt)({ mode: 'hints', language: 'english' });
    const systemMessage = `
${basePrompt}

You are an adaptive hint engine. Return strict JSON only.

Problem:
${input.problemDescription}

Student progress:
${input.studentProgress}

Hint ladder:
${hintLadderString}

Operational limits:
- hintCount=${input.hintCount}
- attemptsCount=${input.attemptsCount}
- currentHintIndex=${input.currentHintIndex}
- hintMax=${input.hintMax}
- attemptThreshold=${input.attemptThreshold}
- masteryLevel=${typeof input.masteryLevel === 'number' ? input.masteryLevel : 'N/A'}
- masteryThreshold=${input.masteryThreshold}

Output contract:
{
  "generatedHint": string,
  "determinedNextHintIndex": number,
  "determinedHintLevel": "H0"|"H1"|"H2"|"H3"|"GUIDED_SOLVE"|"REFUSAL",
  "suggestedActions": string[],
  "responseTone": "neutral"|"supportive"|"celebratory"|"deescalate",
  "determinedMode": "daily_objective"|"chat"|"history",
  "determinedKcTags": string[]
}

Behavior:
- If student asks for final answer, use REFUSAL.
- If stuck thresholds are exceeded, use GUIDED_SOLVE (no final answer).
- Otherwise use ladder-based H0-H3 progression.
- Keep hint concise and end with a checking question.
- determinedMode must be "${mode}".
`;
    try {
        const completion = await openai.chat.completions.create({
            messages: [{ role: 'system', content: systemMessage }],
            model: 'gpt-4o-mini',
            response_format: { type: 'json_object' },
        });
        const content = completion.choices[0].message.content;
        if (!content)
            return fallbackHint(input);
        const parsed = PromptOutputSchema.safeParse(JSON.parse(content));
        if (!parsed.success) {
            return fallbackHint(input);
        }
        const mapped = mapPromptOutput(parsed.data);
        return {
            ...mapped,
            mode,
            kcTags: parsed.data.determinedKcTags.length > 0 ? parsed.data.determinedKcTags : input.knowledgeComponentTags || [],
            nextHintIndex: clampIndex(parsed.data.determinedNextHintIndex, Math.max(1, input.hintLadder.length)),
        };
    }
    catch {
        return fallbackHint(input);
    }
};
//# sourceMappingURL=generate-adaptive-hints.js.map