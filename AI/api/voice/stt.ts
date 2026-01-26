// 'use server';
// import OpenAI from 'openai';

// const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// // Named export for tool usage
// export async function speechToText(audioBuffer: Buffer): Promise<string> {
//   const transcription = await openai.audio.transcriptions.create({
//     file: new File([audioBuffer], 'audio.webm'),
//     model: 'whisper-1',
//   });
//   return transcription.text.trim();
// }

// // POST handler for direct API calls
// export async function POST(req: Request) {
//   try {
//     const formData = await req.formData();
//     const audio = formData.get('audio') as File;
//     if (!audio) return Response.json({ error: 'Missing audio' }, { status: 400 });

//     const buffer = Buffer.from(await audio.arrayBuffer());
//     const text = await speechToText(buffer);
//     return Response.json({ text });
//   } catch (err) {
//     return Response.json({ error: 'STT Failed' }, { status: 500 });
//   }
// }