// const requestTracker = new Map<string, number[]>();

// export function checkVoiceAbuse(userId: string, audioSeconds: number) {
//   if (audioSeconds > 15) {
//     return { blocked: true, reason: 'AUDIO_TOO_LONG' };
//   }

//   const now = Date.now();
//   const history = requestTracker.get(userId) || [];

//   const recent = history.filter(t => now - t < 60_000);
//   recent.push(now);
//   requestTracker.set(userId, recent);

//   if (recent.length > 10) {
//     return { blocked: true, reason: 'RATE_LIMIT' };
//   }

//   return { blocked: false };
// }
