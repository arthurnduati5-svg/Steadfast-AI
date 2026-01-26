"use strict";
// export function detectLanguage(text: string): 'arabic' | 'english' {
//     const arabicRegex = /[\u0600-\u06FF]/;
//     return arabicRegex.test(text) ? 'arabic' : 'english';
//   }
//   export function applyVoiceRules(text: string): {
//     cleanedText: string;
//     speed: number;
//     voiceProfile: string;
//   } {
//     const language = detectLanguage(text);
//     if (language === 'arabic') {
//       const cleaned = text
//         .replace(/[😊😂🤣😅😄😃😁😉😍🥰😘😜😎]/g, '')
//         .replace(/\?/g, '؟')
//         .replace(/,/g, '،')
//         .replace(/;/g, '؛')
//         .trim();
//       return {
//         cleanedText: cleaned,
//         speed: 0.85,
//         voiceProfile: 'arabic_teacher',
//       };
//     }
//     return {
//       cleanedText: text.trim(),
//       speed: 1.0,
//       voiceProfile: 'warm_teacher',
//     };
//   }
//# sourceMappingURL=voiceRules.js.map