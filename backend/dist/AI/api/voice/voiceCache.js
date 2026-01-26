"use strict";
// type CacheEntry = {
//   audio: Buffer;
//   createdAt: number;
// };
// const cache = new Map<string, CacheEntry>();
// export function getCachedVoice(key: string): Buffer | null {
//   const entry = cache.get(key);
//   if (!entry) return null;
//   return entry.audio;
// }
// export function setCachedVoice(key: string, audio: Buffer) {
//   if (cache.size > 500) cache.clear(); // Simple eviction
//   cache.set(key, { audio, createdAt: Date.now() });
// }
//# sourceMappingURL=voiceCache.js.map