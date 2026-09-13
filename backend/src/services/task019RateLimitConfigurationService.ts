import type { RouteRateLimitRule, RateLimitConfig, RateLimitRole } from '../contracts/task019Contracts';

const DEFAULT_STUDENT_CONFIG: Partial<RateLimitConfig> = {
  maxTokens: 30,
  refillRate: 0.5,
  refillIntervalMs: 1000,
  burstCapacity: 40,
  strategy: 'token_bucket',
  tier: 'student'
};

const DEFAULT_SCHOOL_CONFIG: Partial<RateLimitConfig> = {
  maxTokens: 500,
  refillRate: 8,
  refillIntervalMs: 1000,
  burstCapacity: 600,
  strategy: 'token_bucket',
  tier: 'school'
};

const DEFAULT_ROLE_OVERRIDES: Partial<Record<RateLimitRole, Partial<RateLimitConfig>>> = {
  admin: { maxTokens: 200, refillRate: 5, burstCapacity: 250, tier: 'role' },
  counselor: { maxTokens: 100, refillRate: 3, burstCapacity: 130, tier: 'role' },
  system: { maxTokens: 500, refillRate: 10, burstCapacity: 600, tier: 'role' },
  service: { maxTokens: 1000, refillRate: 20, burstCapacity: 1200, tier: 'role' },
  anonymous: { maxTokens: 10, refillRate: 0.17, burstCapacity: 15, tier: 'role' }
};

const ROUTE_RULES: RouteRateLimitRule[] = [
  {
    route: '/api/copilot/chat/message',
    methods: ['POST'],
    student: { maxTokens: 20, refillRate: 0.33, burstCapacity: 25 },
    school: { maxTokens: 300, refillRate: 5, burstCapacity: 400 },
    roleOverrides: {
      admin: { maxTokens: 100, refillRate: 2, burstCapacity: 120 }
    },
    enabled: true
  },
  {
    route: '/api/copilot/chat',
    methods: ['POST'],
    student: { maxTokens: 30, refillRate: 0.5, burstCapacity: 40 },
    school: { maxTokens: 400, refillRate: 7, burstCapacity: 500 },
    enabled: true
  },
  {
    route: '/api/voice',
    methods: ['POST'],
    student: { maxTokens: 15, refillRate: 0.25, burstCapacity: 20 },
    school: { maxTokens: 200, refillRate: 3, burstCapacity: 250 },
    enabled: true
  },
  {
    route: '/api/copilot/learner-memory',
    methods: ['POST', 'PUT', 'PATCH'],
    student: { maxTokens: 40, refillRate: 0.67, burstCapacity: 50 },
    school: { maxTokens: 500, refillRate: 8, burstCapacity: 600 },
    enabled: true
  },
  {
    route: '/api/copilot/practice-mastery',
    methods: ['POST', 'PUT'],
    student: { maxTokens: 40, refillRate: 0.67, burstCapacity: 50 },
    school: { maxTokens: 500, refillRate: 8, burstCapacity: 600 },
    enabled: true
  },
  {
    route: '/api/copilot/intent',
    methods: ['POST'],
    student: { maxTokens: 30, refillRate: 0.5, burstCapacity: 40 },
    school: { maxTokens: 400, refillRate: 7, burstCapacity: 500 },
    enabled: true
  },
  {
    route: '/api/copilot/tutor-state',
    methods: ['GET', 'POST'],
    student: { maxTokens: 60, refillRate: 1, burstCapacity: 80 },
    school: { maxTokens: 800, refillRate: 13, burstCapacity: 1000 },
    enabled: true
  },
  {
    route: '/api/learner',
    methods: ['GET'],
    student: { maxTokens: 60, refillRate: 1, burstCapacity: 80 },
    school: { maxTokens: 800, refillRate: 13, burstCapacity: 1000 },
    enabled: true
  },
  {
    route: '/api/copilot/live-chat',
    methods: ['POST'],
    student: { maxTokens: 60, refillRate: 1, burstCapacity: 80 },
    school: { maxTokens: 600, refillRate: 10, burstCapacity: 750 },
    enabled: true
  }
];

export function getRouteRule(method: string, path: string): RouteRateLimitRule | undefined {
  const normalizedPath = path.split('?')[0];
  return ROUTE_RULES.find(
    rule => rule.enabled && rule.methods.includes(method) && normalizedPath.startsWith(rule.route)
  );
}

export function getEffectiveRateLimits(
  method: string,
  path: string,
  role?: string
): { student: Partial<RateLimitConfig>; school: Partial<RateLimitConfig> } {
  const rule = getRouteRule(method, path);

  if (!rule) {
    return { student: DEFAULT_STUDENT_CONFIG, school: DEFAULT_SCHOOL_CONFIG };
  }

  const roleLower = (role || 'student').toLowerCase() as RateLimitRole;
  const roleOverride = rule.roleOverrides?.[roleLower];
  const roleDefault = DEFAULT_ROLE_OVERRIDES[roleLower];

  const student = roleOverride || roleDefault || rule.student || DEFAULT_STUDENT_CONFIG;
  const school = rule.school || DEFAULT_SCHOOL_CONFIG;

  return { student, school };
}

export function getRoleLimits(role?: string): Partial<RateLimitConfig> {
  const roleLower = (role || 'student').toLowerCase() as RateLimitRole;
  return DEFAULT_ROLE_OVERRIDES[roleLower] || DEFAULT_STUDENT_CONFIG;
}

export function getAllRouteRules(): RouteRateLimitRule[] {
  return ROUTE_RULES.map(r => ({ ...r }));
}
