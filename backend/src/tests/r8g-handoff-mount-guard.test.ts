import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import jwt from 'jsonwebtoken';

vi.mock('jsonwebtoken', () => ({
  default: { verify: vi.fn() },
  verify: vi.fn(),
  JsonWebTokenError: class JsonWebTokenError extends Error {
    constructor(msg: string) {
      super(msg);
      this.name = 'JsonWebTokenError';
    }
  },
  TokenExpiredError: class TokenExpiredError extends Error {
    constructor(msg: string) {
      super(msg);
      this.name = 'TokenExpiredError';
      (this as unknown as Record<string, unknown>)['expiredAt'] = new Date();
    }
  },
}));

const mockPrisma = {
  tutorLearnerIdentityMap: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
  $queryRawUnsafe: vi.fn(),
  $executeRawUnsafe: vi.fn(),
};

vi.mock('../lib/prisma', () => ({ default: mockPrisma }));

vi.mock('../utils/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

process.env.JWT_SECRET = 'test-secret';
process.env.COPILOT_JWT_SECRET = '';
process.env.COPILOT_PUBLIC_KEY = '';

let buildCopilotHandoff: typeof import('../services/copilotHandoffService').buildCopilotHandoff;
beforeAll(async () => {
  ({ buildCopilotHandoff } = await import('../services/copilotHandoffService'));
});

describe('R8-G copilot handoff mount guard', () => {
  it('mount requires verified authentication and verified school context', () => {
    const content = fs.readFileSync(path.resolve(__dirname, '../index.ts'), 'utf-8');
    expect(content).toContain(
      "app.use('/api/copilot', schoolAuthMiddleware, requireVerifiedSchoolContext, copilotHandoffRoutes);",
    );
  });
});

describe('R8-G copilot handoff identity proof', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
    process.env.COPILOT_JWT_SECRET = '';
    process.env.COPILOT_PUBLIC_KEY = '';
  });

  function setupMapping() {
    mockPrisma.tutorLearnerIdentityMap.findUnique.mockResolvedValue(null);
    mockPrisma.tutorLearnerIdentityMap.create.mockResolvedValue({
      id: 'uuid-1',
      tutorLearnerId: 'tl_verified',
      externalStudentId: 'student-verified',
      schoolId: 'school-verified',
      classId: null,
      grade: null,
      status: 'active',
      firstSeenAt: new Date(),
      lastSeenAt: new Date(),
    });
    mockPrisma.$queryRawUnsafe.mockResolvedValue([]);
    mockPrisma.$executeRawUnsafe.mockResolvedValue([1]);
  }

  it('unauthenticated request is denied before any learner mapping', async () => {
    const result = await buildCopilotHandoff({ authorizationHeader: '', requestId: 'r8g-handoff-1' });
    expect(result.ok).toBe(false);
    expect(mockPrisma.tutorLearnerIdentityMap.findUnique).not.toHaveBeenCalled();
    expect(mockPrisma.tutorLearnerIdentityMap.create).not.toHaveBeenCalled();
  });

  it('token without school context is denied before any learner mapping', async () => {
    (jwt.verify as unknown as { mockReturnValue(v: unknown): void }).mockReturnValue({
      userId: 'student-1',
      role: 'student',
    });
    const result = await buildCopilotHandoff({
      authorizationHeader: 'Bearer no-school-token',
      requestId: 'r8g-handoff-2',
    });
    expect(result.ok).toBe(false);
    expect(mockPrisma.tutorLearnerIdentityMap.create).not.toHaveBeenCalled();
  });

  it('verified school context reaches the route and tenant identity comes from the token only', async () => {
    (jwt.verify as unknown as { mockReturnValue(v: unknown): void }).mockReturnValue({
      userId: 'student-verified',
      schoolId: 'school-verified',
      role: 'student',
    });
    setupMapping();
    const result = await buildCopilotHandoff({
      authorizationHeader: 'Bearer valid-token',
      requestId: 'r8g-handoff-3',
      clientContext: { displayMode: 'widget' },
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.schoolId).toBe('school-verified');
      expect(result.tutorLearnerId).toBe('tl_verified');
    }
    // Tenant binding used the verified token school — the create call carries
    // the verified school, and there is no client-controlled school input to
    // the handoff builder at all.
    expect(mockPrisma.tutorLearnerIdentityMap.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ schoolId: 'school-verified' }) }),
    );
  });
});
