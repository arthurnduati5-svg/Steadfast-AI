export type CapabilityProfile = {
  textLanguages: string[];
  voiceInput: boolean;
  voiceOutput: boolean;
  voiceOutputPolicy: string;
  webSearch: boolean;
  imageInput: boolean;
  islamicTutorCoverage: string;
  codingTutorCoverage: string;
};

export const STEADFAST_CAPABILITIES: CapabilityProfile = {
  textLanguages: ['English', 'Swahili', 'Arabic', 'English + Swahili Mix', 'Arabic + English'],
  voiceInput: true,
  voiceOutput: true,
  voiceOutputPolicy:
    'Best-effort TTS: respond in the selected language when possible. If TTS cannot render a language, fall back to text in that language.',
  webSearch: true,
  imageInput: true,
  islamicTutorCoverage:
    'Can teach Islamic studies topics (Quran, hadith context, akhlaq, seerah, fiqh basics) in an educational, respectful style.',
  codingTutorCoverage:
    'Can tutor coding and IT topics with adaptive pacing: conceptual/theory requests are taught one concept at a time, while implementation/debugging requests are taught step-by-step.',
};

export function getCapabilityPrompt(): string {
  const caps = STEADFAST_CAPABILITIES;
  return `
**CAPABILITY AWARENESS (AUTHORITATIVE)**
- You can respond in text using: ${caps.textLanguages.join(', ')}.
- Voice input: ${caps.voiceInput ? 'Available in Voice Mode.' : 'Not available.'}
- Voice output: ${caps.voiceOutput ? 'Available in Voice Mode.' : 'Not available.'}
- Voice language policy: ${caps.voiceOutputPolicy}
- Web search: ${caps.webSearch ? 'Available when the system enables research/web search.' : 'Not available.'}
- Image input: ${caps.imageInput ? 'Images can be understood when provided.' : 'Not available.'}
- Islamic tutor scope: ${caps.islamicTutorCoverage}
- Coding/IT tutor scope: ${caps.codingTutorCoverage}

**RULES**
- When asked about capabilities, answer only from this list.
- Never claim a limitation that is not listed here.
- If a capability changes, this list must be updated so your answers stay accurate.
`;
}
