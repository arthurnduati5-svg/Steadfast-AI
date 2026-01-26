"use strict";
// const voiceHits = new Map<string, number[]>();
// export async function guardVoiceAbuse(audio: Blob | Buffer, userId: string) {
//   // 1. Size Check (approx 15s of audio)
//   const size = audio instanceof Blob ? audio.size : audio.length;
//   if (size > 2_000_000) {
//     return { ok: false, message: 'Ai! That is too long. Speak shorter so I can hear you well.' };
//   }
//   // 2. Frequency Check
//   const now = Date.now();
//   const history = voiceHits.get(userId) || [];
//   const recent = history.filter(t => now - t < 60_000);
//   recent.push(now);
//   voiceHits.set(userId, recent);
//   if (recent.length > 12) {
//     return { ok: false, message: 'My child, let us slow down. Deep breaths. We speak one step at a time.' };
//   }
//   return { ok: true };
// }
//# sourceMappingURL=voiceGuard.js.map