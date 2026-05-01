import { NextRequest } from 'next/server';
import { proxyVoiceRequest } from '../proxy';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  return proxyVoiceRequest(req, 'stt');
}
