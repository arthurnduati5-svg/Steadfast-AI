"use strict";
// // src/api/voice/voiceController.ts
// 'use server';
// import { speechToText } from './stt'; // Fixed Error: Named import
// import { streamTTS } from './tts';
// import { guardVoiceAbuse } from './voiceGuard';
// import serverTeacher from '../../ai/flows/serverTeacher';
// import { VOICE_CONFIG } from './voiceConfig';
// /**
//  * handleVoiceRequest
//  * 
//  * THE TRUE BRIDGE:
//  * 1. Guards against abuse (Stoic Teacher).
//  * 2. Transcribes Speech (Hands).
//  * 3. Calls the Teacher Engine (Brain).
//  * 4. Returns a Voice Stream (Voice).
//  */
// export async function handleVoiceRequest({
//   audio,
//   userId,
// }: {
//   audio: Buffer;
//   userId: string;
// }) {
//   // 1. Check for abuse - Use Buffer length to estimate time
//   // (Assuming 16kHz 16-bit mono: 32000 bytes per second)
//   const audioSeconds = audio.length / 32000;
//   // guardVoiceAbuse returns { ok: boolean, message: string }
//   const abuse = await guardVoiceAbuse(audio, userId);
//   if (!abuse.ok) {
//     const calmText = abuse.message || 'Ai! My child, let us slow down. Deep breaths.';
//     return {
//       mode: 'voice',
//       stream: await streamTTS(calmText), // Fixed Error: Only 1 argument needed
//     };
//   }
//   // 2. Transcribe the student's voice
//   let studentText: string;
//   try {
//     studentText = await speechToText(audio);
//   } catch (error) {
//     console.error('[VOICE-CONTROLLER] STT Error:', error);
//     return {
//       mode: 'text',
//       text: 'Ai! I could not hear you well. Please try again slowly, my child.',
//     };
//   }
//   // 3. Call the Logic Engine (serverTeacher)
//   // Fixes Error: Correctly nesting preferences according to TeacherInputSchema
//   const teacherResponse = await serverTeacher({
//     text: studentText,
//     preferences: {
//       userId: userId,
//       preferredLanguage: 'english', // Default, logic in copilot adapts later
//       interests: [], // Will be populated by logic or state
//     },
//     // If you have state saved in Redis, you would fetch and pass it here
//   });
//   // 4. Return Voice or Fallback to Text
//   try {
//     // Fixed Error: teacherResponse uses .text, not .finalText
//     return {
//       mode: 'voice',
//       stream: await streamTTS(teacherResponse.text), // Fixed Error: Only 1 argument
//     };
//   } catch (voiceError) {
//     console.error('[VOICE-CONTROLLER] TTS Error:', voiceError);
//     // If the voice generator fails, we must still give the student the text
//     return {
//       mode: 'text',
//       text: teacherResponse.text,
//     };
//   }
// }
//# sourceMappingURL=voiceController.js.map