import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';

const SESSION_JWT_SECRET = process.env.JWT_SECRET;
const COPILOT_JWT_SECRET = process.env.COPILOT_JWT_SECRET;
const COPILOT_PRIVATE_KEY = process.env.COPILOT_PRIVATE_KEY;
const COPILOT_JWT_ISS = process.env.COPILOT_JWT_ISS || 'steadfast-portal';
const COPILOT_SCHOOL_ID = process.env.COPILOT_SCHOOL_ID || process.env.SCHOOL_ID || '';

const getSessionToken = (req: NextRequest) => {
  const authHeader = req.headers.get('authorization') || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  const cookieToken =
    req.cookies.get('token')?.value ||
    req.cookies.get('auth_token')?.value ||
    req.cookies.get('access_token')?.value;
  return cookieToken || '';
};

const getSigningKey = () => {
  if (COPILOT_PRIVATE_KEY) {
    return COPILOT_PRIVATE_KEY.replace(/\\n/g, '\n');
  }
  return COPILOT_JWT_SECRET || '';
};

export async function GET(req: NextRequest) {
  if (!SESSION_JWT_SECRET) {
    return NextResponse.json({ message: 'JWT_SECRET not configured.' }, { status: 500 });
  }

  const sessionToken = getSessionToken(req);
  if (!sessionToken) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  let sessionPayload: any;
  try {
    sessionPayload = jwt.verify(sessionToken, SESSION_JWT_SECRET);
  } catch {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const studentId =
    sessionPayload?.userId ||
    sessionPayload?.studentId ||
    sessionPayload?.id ||
    sessionPayload?.sub;

  if (!studentId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  let name = sessionPayload?.name || sessionPayload?.fullName || '';
  let grade = sessionPayload?.grade || sessionPayload?.gradeLevel || '';
  const schoolId = sessionPayload?.schoolId || COPILOT_SCHOOL_ID;

  if ((!name || !grade) && prisma) {
    try {
      const profile = await prisma.studentProfile.findUnique({
        where: { userId: String(studentId) },
        select: { name: true, gradeLevel: true },
      });
      if (!name) name = profile?.name || '';
      if (!grade) grade = profile?.gradeLevel || '';
    } catch {
      // If DB read fails, fall back to safe defaults.
    }
  }

  if (!schoolId) {
    return NextResponse.json({ message: 'COPILOT_SCHOOL_ID not configured.' }, { status: 500 });
  }

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    schoolId: String(schoolId),
    studentId: String(studentId),
    name: name || 'Student',
    grade: grade || 'Unknown',
    role: 'student',
    iat: now,
    exp: now + 60 * 4,
    iss: COPILOT_JWT_ISS,
    aud: 'copilot',
  };

  const signingKey = getSigningKey();
  if (!signingKey) {
    return NextResponse.json({ message: 'COPILOT signing secret not configured.' }, { status: 500 });
  }

  const token = jwt.sign(payload, signingKey, {
    algorithm: COPILOT_PRIVATE_KEY ? 'RS256' : 'HS256',
  });

  return NextResponse.json(
    { token },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
