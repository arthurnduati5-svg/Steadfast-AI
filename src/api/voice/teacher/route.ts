// export const runtime = 'edge';

// import { NextRequest } from 'next/server';
// import serverTeacher from '@/ai/flows/serverTeacher';
// import { streamTTS } from './tts';
// import { guardVoiceAbuse } from '../voiceGuard';
// import { speechToText } from '../sttAdapter';

// export async function POST(req: NextRequest) {
//   try {
//     const form = await req.formData();
//     const audio = form.get('audio') as Blob;
//     const userId = form.get('userId') as string;

//     const abuseCheck = await guardVoiceAbuse(audio, userId);
//     if (!abuseCheck.ok) {
//       return new Response(abuseCheck.message, { status: 429 });
//     }

//     const transcript = await speechToText(audio);

//     const teacher = await serverTeacher({
//       text: transcript,
//       preferences: {
//         userId,
//         preferredLanguage: 'english',
//         interests: [],
//       },
//     });

//     return streamTTS(teacher.text);

//   } catch (err) {
//     return new Response(
//       JSON.stringify({ text: 'My child, let us try that again. Speak clearly.' }),
//       { status: 200 }
//     );
//   }
// }