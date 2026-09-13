export type CanonicalGradeBand =
  | 'kindergarten'
  | 'lower_primary'
  | 'upper_primary'
  | 'lower_secondary'
  | 'upper_secondary'
  | 'deen_all'
  | 'general_all'
  | 'unknown';

const KINDERGARTEN_MATCHERS = [
  'kg', 'kindergarten', 'nursery', 'reception', 'pp1', 'pp2',
  'pre-primary', 'pre primary', 'early years', 'foundation',
];

const LOWER_PRIMARY_MATCHERS = [
  'grade 1', 'grade 2', 'grade 3',
  'year 1', 'year 2', 'year 3',
  'class 1', 'class 2', 'class 3',
  'standard 1', 'standard 2', 'standard 3',
];

const UPPER_PRIMARY_MATCHERS = [
  'grade 4', 'grade 5', 'grade 6',
  'year 4', 'year 5', 'year 6',
  'class 4', 'class 5', 'class 6',
  'standard 4', 'standard 5', 'standard 6',
];

const LOWER_SECONDARY_MATCHERS = [
  'grade 7', 'grade 8', 'grade 9',
  'year 7', 'year 8', 'year 9',
  'class 7', 'class 8', 'class 9',
  'standard 7', 'standard 8', 'standard 9',
  'form 1', 'form 2',
];

const UPPER_SECONDARY_MATCHERS = [
  'grade 10', 'grade 11', 'grade 12', 'grade 13',
  'year 10', 'year 11', 'year 12', 'year 13',
  'igcse', 'as level', 'a level',
  'form 3', 'form 4', 'form 5', 'form 6',
  'key stage 4', 'key stage 5',
];

function wordBoundaryMatch(text: string, matcher: string): boolean {
  const escaped = matcher.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`).test(text);
}

export function resolveGradeBand(learnerGrade?: string): CanonicalGradeBand {
  if (!learnerGrade) return 'unknown';

  const normalized = learnerGrade.toLowerCase().trim();

  if (KINDERGARTEN_MATCHERS.some(m => normalized.includes(m) || m.includes(normalized))) {
    return 'kindergarten';
  }
  if (LOWER_PRIMARY_MATCHERS.some(m => wordBoundaryMatch(normalized, m))) {
    return 'lower_primary';
  }
  if (UPPER_PRIMARY_MATCHERS.some(m => wordBoundaryMatch(normalized, m))) {
    return 'upper_primary';
  }
  if (LOWER_SECONDARY_MATCHERS.some(m => wordBoundaryMatch(normalized, m))) {
    return 'lower_secondary';
  }
  if (UPPER_SECONDARY_MATCHERS.some(m => wordBoundaryMatch(normalized, m))) {
    return 'upper_secondary';
  }

  if (normalized.includes('deen') || normalized.includes('islamic')) {
    return 'deen_all';
  }
  if (normalized.includes('enrich') || normalized.includes('general')) {
    return 'general_all';
  }

  return 'unknown';
}

export function isKindergartenAge(age?: number): boolean {
  if (age === undefined || age === null) return false;
  return age >= 3 && age <= 6;
}
