'use server';

/**
 * @fileOverview Generates adaptive hints for students based on their current problem and progress.
 *
 * - generateAdaptiveHint - A function that generates adaptive hints.
 * - GenerateAdaptiveHintInput - The input type for the generateAdaptiveHint function.
 * - GenerateAdaptiveHintOutput - The return type for the generateAdaptiveHint function.
 */

import {z} from 'genkit';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const GenerateAdaptiveHintInputSchema = z.object({
  problemDescription: z.string().describe('The description of the problem the student is working on.'),
  studentProgress: z.string().describe('The current progress of the student in solving the problem.'),
  hintLadder: z.array(z.string()).describe('An array of hints, ordered from least to most helpful. H0: Reframe, H1: Concept Cue, H2: Strategy Step, H3: Partial Work.'),
  currentHintIndex: z.number().describe('The index of the current hint being given to the student.'),
  hintCount: z.number().describe('The number of hints already given for the current problem.'),
  attemptsCount: z.number().describe('The number of incorrect attempts made by the student.'),
  masteryLevel: z.number().optional().describe("Optional: Student's mastery level for the relevant knowledge component."),
  hintMax: z.number().describe('Maximum hints before considering guided solve.'),
  attemptThreshold: z.number().describe('Maximum attempts before considering guided solve.'),
  masteryThreshold: z.number().describe('Mastery level below which guided solve is considered if student is stuck.'),
  isDailyObjectiveMode: z.boolean().describe('Boolean indicating if the copilot is currently in daily objectives mode.'),
  knowledgeComponentTags: z.array(z.string()).optional().describe('Optional: Pre-identified knowledge component tags for the problem.'),
});
export type GenerateAdaptiveHintInput = z.infer<typeof GenerateAdaptiveHintInputSchema>;

const GenerateAdaptiveHintOutputSchema = z.object({
  hint: z.string().describe('The adaptive hint generated for the student.'),
  nextHintIndex: z.number().describe('The index of the next hint to be given to the student.'),
  hintLevel: z.enum(['H0', 'H1', 'H2', 'H3', 'GUIDED_SOLVE', 'REFUSAL']).describe('The level of the hint provided (H0, H1, H2, H3, GUIDED_SOLVE, or REFUSAL).'),
  mode: z.enum(['daily_objective', 'chat', 'history']).describe('The current operating mode of the copilot.'),
  kcTags: z.array(z.string()).describe('Knowledge component tags relevant to the problem.'),
  actions: z.array(z.string()).describe('Suggested actions for the UI (e.g., request_attempt, offer_guided_solve).'),
  tone: z.enum(['neutral', 'supportive', 'celebratory', 'deescalate']).describe("The detected tone of the student's input and the copilot's response tone."),
});
export type GenerateAdaptiveHintOutput = z.infer<typeof GenerateAdaptiveHintOutputSchema>;

export async function generateAdaptiveHint(input: GenerateAdaptiveHintInput): Promise<GenerateAdaptiveHintOutput> {
  return generateAdaptiveHintFlow(input);
}

// Simplified output for the prompt to make it more reliable for the LLM to generate.
// The flow will then construct the full GenerateAdaptiveHintOutputSchema.
const PromptOutputSchema = z.object({
  generatedHint: z.string().describe('The generated hint text or guided-solve content.'),
  determinedNextHintIndex: z.number().describe('The determined index of the next hint.'),
  determinedHintLevel: z.enum(['H0', 'H1', 'H2', 'H3', 'GUIDED_SOLVE', 'REFUSAL']).describe('The determined hint level.'),
  suggestedActions: z.array(z.string()).describe('Suggested actions for the UI.'),
  responseTone: z.enum(['neutral', 'supportive', 'celebratory', 'deescalate']).describe('The suggested tone of the response.'),
  determinedMode: z.enum(['daily_objective', 'chat', 'history']).describe('The determined operating mode of the copilot.'),
  determinedKcTags: z.array(z.string()).describe('Determined knowledge component tags relevant to the problem.'),
});
type PromptOutput = z.infer<typeof PromptOutputSchema>;

const HINT_MAX = 10; // Max hints before considering guided solve
const ATTEMPT_THRESHOLD = 3; // Max attempts before considering guided solve
const MASTERY_THRESHOLD = 0.25; // Mastery level below which guided solve is considered if student is stuck

const generateAdaptiveHintFlow = async (input: GenerateAdaptiveHintInput): Promise<GenerateAdaptiveHintOutput> => {
  // Construct the hintLadder string for the prompt
  const hintLadderString = input.hintLadder.map((hint, index) => `${index}. ${hint}`).join('\\n');

  const systemMessage = `You are an AI assistant named Steadfast Copilot AI, helping students learn by providing adaptive hints.
  You are a guidance-first teacher assistant for a K–12 school. Your primary role is to coach students toward understanding and independent problem solving.
  Be patient, clear, and flexible. Never provide the final answer.

  The student is working on the following problem:
  ${input.problemDescription}

  The student's current progress is:
  ${input.studentProgress}

  Here is a ladder of hints, from least to most helpful, categorized by level:
  ${hintLadderString}

  The student has received ${input.hintCount} hints and made ${input.attemptsCount} incorrect attempts.
  The current hint index in the provided hintLadder is: ${input.currentHintIndex}
  Student mastery level (if available): ${input.masteryLevel || 'N/A'}
  Is the copilot currently in daily objectives mode: ${input.isDailyObjectiveMode}
  Pre-identified knowledge component tags for the problem (if available): ${input.knowledgeComponentTags?.join(', ') || 'N/A'}

  **Constants for triggering Guided-Solve:**
  - HINT_MAX: ${HINT_MAX}
  - ATTEMPT_THRESHOLD: ${ATTEMPT_THRESHOLD}
  - MASTERY_THRESHOLD: ${MASTERY_THRESHOLD}

  Your task is to provide the next appropriate hint based on the student's progress and the hint ladder. You need to determine the hint level (H0, H1, H2, H3, GUIDED_SOLVE, or REFUSAL) and include appropriate metadata in your response.
  Always end with one actionable instruction for the student (compute X, substitute values, etc.).

  **HINT LADDER BEHAVIOR:**
  -   **H0 (Reframe)**: Restate the problem in one sentence. Ask what’s known/unknown or which method applies. Use hintLadder[${input.currentHintIndex} or 0].
  -   **H1 (Concept Cue)**: Name the concept or formula (<=20 words) without solving. Use hintLadder[${input.currentHintIndex} or 1].
  -   **H2 (Strategy Step)**: Give one concrete step, no full working. Use hintLadder[${input.currentHintIndex} or 2].
  -   **H3 (Partial Work)**: Show exactly one intermediate calculation or representation; stop before final. Use hintLadder[${input.currentHintIndex} or 3 (or higher if available and appropriate)].
  -   When providing H0, H1, H2, or H3, select the hint text from the 'hintLadder' array based on the determined hint level. For H0, use index 0. For H1, use index 1, and so on. If the determined level is H3 and the 'hintLadder' has more than 3 hints, you can choose the most appropriate one from index 3 onwards.

  **GUIDED-SOLVE MODE BEHAVIOR (Trigger if hintCount >= HINT_MAX OR attemptsCount >= ATTEMPT_THRESHOLD OR (masteryLevel is defined AND masteryLevel < MASTERY_THRESHOLD AND studentProgress indicates struggling/stuck) OR explicit student request like "I don't get this", "Show me the steps", or "I have no idea")**:
  -   Your 'generatedHint' response should start clearly: "Guided-Solve Mode: I will walk you step-by-step and give the formula you must use. You will compute the final step."
  -   Then, provide: name of formula/method, the formula itself, a short (<=30 words) explanation of each symbol, a worked intermediate example showing one calculation, then a concrete instruction for the student to apply the formula to finish.
  -   You MUST NOT output the final numeric answer.
  -   Set 'suggestedActions' to '["request_attempt"]' and 'responseTone' to 'supportive'.
  -   Adjust 'determinedNextHintIndex' to reflect progression, e.g., currentHintIndex + 1 (capped at ladder length).

  **REFUSAL BEHAVIOR (If student asks for final answer or you detect the student is trying to get a direct answer):**
  -   Your 'generatedHint' response should be: "I can't provide the final answer here, but I can give a fully guided method you can use to compute it."
  -   Set 'suggestedActions' to '["offer_guided_solve"]' and 'responseTone' to 'supportive'.
  -   Keep 'determinedNextHintIndex' as 'currentHintIndex' or increment by 1 to offer next hint level.

  **General Hint Level Adjustment Logic (if not Guided-Solve or Refusal):**
  -   If the student seems to be doing well (e.g., 'studentProgress' contains "doing well"), adjust 'determinedNextHintIndex' downwards (but not below 0). Set 'responseTone' to 'celebratory'.
  -   If the student is struggling or has made incorrect attempts (e.g., 'studentProgress' contains "struggling" or 'attemptsCount' > 0), adjust 'determinedNextHintIndex' upwards (but not beyond the length of 'hintLadder' - 1). Set 'responseTone' to 'supportive' and 'suggestedActions' to '["request_attempt"]'.
  -   If it's the first interaction (hintCount is 0) and no clear signal, set 'determinedNextHintIndex' to 0 (H0). Set 'responseTone' to 'neutral' and 'suggestedActions' to '["request_attempt"]'.
  -   Otherwise, if no clear signal, keep 'determinedNextHintIndex' as 'currentHintIndex', 'responseTone' to 'neutral' and 'suggestedActions' to '["request_attempt"]'.

  When determining 'determinedHintLevel', map the 'determinedNextHintIndex' to H0, H1, H2, H3. For example, index 0 is H0, index 1 is H1, etc. If 'determinedNextHintIndex' is 3 or greater, it maps to H3. If in Guided-Solve or Refusal mode, set 'determinedHintLevel' accordingly.

  **Determining Mode and KC Tags:**
  -   Set 'determinedMode' to 'daily_objective' if 'isDailyObjectiveMode' is true, otherwise set to 'chat'. 'history' mode is handled by the UI/system and not determined by this flow.
  -   Set 'determinedKcTags' to the provided 'knowledgeComponentTags' if available. If not provided, analyze 'problemDescription' to infer relevant knowledge component tags (e.g., ["ALG_LINEAR", "FRACTIONS_ADD"]) and return them as an array of strings. If no tags can be inferred, return an empty array.

  You *must* respond with a JSON object that adheres to the following TypeScript interface, ensuring all fields are present and correctly formatted.
  \`\`\`typescript
  interface PromptOutput {
    generatedHint: string;
    determinedNextHintIndex: number;
    determinedHintLevel: 'H0' | 'H1' | 'H2' | 'H3' | 'GUIDED_SOLVE' | 'REFUSAL';
    suggestedActions: string[];
    responseTone: 'neutral' | 'supportive' | 'celebratory' | 'deescalate';
    determinedMode: 'daily_objective' | 'chat' | 'history';
    determinedKcTags: string[];
  }
  \`\`\`
  Example Output (JSON):
  {
    "generatedHint": "To find x, what's the very first step you'd take to get rid of the number without x on the left side?",
    "determinedNextHintIndex": 0,
    "determinedHintLevel": "H0",
    "suggestedActions": ["request_attempt"],
    "responseTone": "neutral",
    "determinedMode": "chat",
    "determinedKcTags": ["ALG_LINEAR"]
  }
  `;

  try {
    const modelToUse = 'gpt-4o-mini'; // Default to gpt-4o-mini for cost efficiency

    const completion = await openai.chat.completions.create({
      messages: [
        { role: 'system', content: systemMessage },
      ],
      model: modelToUse,
      response_format: { type: "json_object" },
    });

    const llmOutput = completion.choices[0].message.content;
    if (!llmOutput) {
      throw new Error("OpenAI did not return any content.");
    }

    const output: PromptOutput = JSON.parse(llmOutput);

    const validationResult = PromptOutputSchema.safeParse(output);
    if (!validationResult.success) {
      console.error("LLM output failed schema validation:", validationResult.error);
      // Attempt with gpt-4o as a fallback for complex reasoning if mini fails schema validation
      try {
        console.warn("Retrying with gpt-4o due to schema validation failure with gpt-4o-mini.");
        const fallbackCompletion = await openai.chat.completions.create({
          messages: [
            { role: 'system', content: systemMessage },
          ],
          model: 'gpt-4o', // Fallback to gpt-4o
          response_format: { type: "json_object" },
        });

        const fallbackLlmOutput = fallbackCompletion.choices[0].message.content;
        if (!fallbackLlmOutput) {
          throw new Error("OpenAI (fallback) did not return any content.");
        }
        const fallbackOutput: PromptOutput = JSON.parse(fallbackLlmOutput);
        const fallbackValidationResult = PromptOutputSchema.safeParse(fallbackOutput);
        if (!fallbackValidationResult.success) {
          console.error("LLM (fallback) output failed schema validation:", fallbackValidationResult.error);
          throw new Error("Invalid output format from AI even with fallback.");
        }
        // If fallback is successful, use its output
        return {
          hint: fallbackOutput.generatedHint,
          nextHintIndex: fallbackOutput.determinedNextHintIndex,
          hintLevel: fallbackOutput.determinedHintLevel,
          mode: fallbackOutput.determinedMode,
          kcTags: fallbackOutput.determinedKcTags,
          actions: fallbackOutput.suggestedActions,
          tone: fallbackOutput.responseTone,
        };
      } catch (fallbackError) {
        console.error("Error in generateAdaptiveHintFlow (fallback with gpt-4o):", fallbackError);
        throw new Error("Failed to generate hint even with fallback model.");
      }
    }

    // Map PromptOutput to GenerateAdaptiveHintOutputSchema
    return {
      hint: output.generatedHint,
      nextHintIndex: output.determinedNextHintIndex,
      hintLevel: output.determinedHintLevel,
      mode: output.determinedMode,
      kcTags: output.determinedKcTags,
      actions: output.suggestedActions,
      tone: output.responseTone,
    };
  } catch (error) {
    console.error("Error in generateAdaptiveHintFlow:", error);
    // Fallback in case of any error during OpenAI call or parsing
    return {
      hint: "I couldn't process that – can you re-type or try a clearer photo? (Error: " + (error instanceof Error ? error.message : String(error)) + ")",
      nextHintIndex: input.currentHintIndex,
      hintLevel: 'REFUSAL',
      mode: input.isDailyObjectiveMode ? 'daily_objective' : 'chat', // Reflect input mode on error
      kcTags: input.knowledgeComponentTags || [], // Reflect input tags on error
      actions: [],
      tone: 'deescalate',
    };
  }
};
