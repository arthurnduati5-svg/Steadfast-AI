import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const DEFAULT_MOCK_USER_ID = 'test-student-1';

async function resolveMockUserId(req: NextRequest): Promise<string> {
  const queryUserId = String(req.nextUrl.searchParams.get('userId') || '').trim();
  if (queryUserId) return queryUserId;

  const configuredUserId = String(process.env.DEV_MOCK_USER_ID || process.env.COPILOT_DEV_USER_ID || '').trim();
  if (configuredUserId) return configuredUserId;

  try {
    const latestSession = await prisma.chatSession.findFirst({
      where: { messages: { some: {} } },
      orderBy: { updatedAt: 'desc' },
      select: { studentId: true },
    });
    if (latestSession?.studentId) return latestSession.studentId;

    const firstStudent = await prisma.studentProfile.findFirst({
      orderBy: { createdAt: 'asc' },
      select: { userId: true },
    });
    if (firstStudent?.userId) return firstStudent.userId;
  } catch {
    // Fall back to the seeded dev user when DB lookup is unavailable.
  }

  return DEFAULT_MOCK_USER_ID;
}

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is for development only.' },
      { status: 404 }
    );
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('[Auth API] JWT_SECRET is not defined in the environment.');
    return NextResponse.json(
      { error: 'JWT secret is not configured on the server.' },
      { status: 500 }
    );
  }

  const userId = await resolveMockUserId(req);
  const token = jwt.sign({ userId }, secret, { expiresIn: '24h' });

  return NextResponse.json(
    { token, userId },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}

