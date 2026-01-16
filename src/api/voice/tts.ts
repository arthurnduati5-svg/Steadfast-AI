// 'use server';
// import OpenAI from 'openai';
// import { applyVoiceRules } from './voiceRules';
// import { guardQuranVoice } from './quranGuard';

// const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// export async function POST(req: Request) {
//   try {
//     const { text } = await req.json();
//     if (!text) return Response.json({ error: 'No text' }, { status: 400 });

//     const quranCheck = guardQuranVoice(text);
//     const finalInput = quranCheck.allowTTS ? text : quranCheck.fallbackText;
//     const { cleanedText, speed, voiceProfile } = applyVoiceRules(finalInput);

//     const speech = await openai.audio.speech.create({
//       model: 'tts-1',
//       voice: voiceProfile as any,
//       input: cleanedText,
//       speed,
//     });

//     return new Response(speech.body, {
//       headers: { 'Content-Type': 'audio/mpeg' }
//     });
//   } catch (err) {
//     return Response.json({ error: 'TTS Failed' }, { status: 500 });
//   }
// }

// export async function streamTTS(text: string): Promise<Response> {
//   // Check Quran safety before streaming
//   const quranCheck = guardQuranVoice(text);
//   const safeText = quranCheck.allowTTS ? text : quranCheck.fallbackText;
//   const { cleanedText, speed, voiceProfile } = applyVoiceRules(safeText);

//   const response = await openai.audio.speech.create({
//     model: 'tts-1',
//     voice: voiceProfile as any,
//     input: cleanedText,
//     speed,
//   });

//   return new Response(response.body, {
//     headers: {
//       'Content-Type': 'audio/mpeg',
//       'Transfer-Encoding': 'chunked',
//     },
//   });
// }

// import OpenAI from 'openai';
// import { Readable } from 'stream';
// import { getCachedVoice, setCachedVoice } from './voiceCache';
// import { VOICE_CONFIG } from './voiceConfig';

// const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// export async function streamTTS(
//   cleanedText: string,
//   speed: number
// ): Promise<Readable> {

//   const cacheKey = cleanedText.slice(0, 200);
//   const cached = getCachedVoice(cacheKey);
//   if (cached) {
//     return Readable.from(cached);
//   }

//   try {
//     const response = await openai.audio.speech.create({
//       model: 'gpt-4o-mini-tts',
//       voice: 'alloy',
//       input: cleanedText,
//       speed,
//       format: 'mp3',
//     });

//     const stream = new Readable({ read() {} });
//     const chunks: Buffer[] = [];

//     for await (const chunk of response.body as any) {
//       const buf = Buffer.from(chunk);
//       chunks.push(buf);
//       stream.push(buf);
//     }

//     stream.push(null);

//     if (VOICE_CONFIG.CACHE_ENABLED && chunks.length) {
//       setCachedVoice(cacheKey, Buffer.concat(chunks));
//     }

//     return stream;
//   } catch (err) {
//     throw new Error('TTS_FAILED');
//   }
// }
