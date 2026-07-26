// Privacy contracts for the Learning Evidence Event Store

export const FORBIDDEN_PAYLOAD_KEYS: string[] = [
  'rawChat',
  'rawConversation',
  'rawStudentAnswer',
  'answerKey',
  'markingScheme',
  'teacherOnlyNotes',
  'hiddenReasoning',
  'chainOfThought',
  'prompt',
  'providerPayload',
  'token',
  'password',
  'secret',
  'safeguardingRaw',
  'privateDeenText',
  'parentContact',
  'peerData',
];

export function hasForbiddenKeys(obj: Record<string, unknown>, path = ''): string[] {
  const found: string[] = [];
  for (const key of Object.keys(obj)) {
    const fullPath = path ? `${path}.${key}` : key;
    if (FORBIDDEN_PAYLOAD_KEYS.includes(key)) {
      found.push(fullPath);
    }
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      found.push(...hasForbiddenKeys(obj[key] as Record<string, unknown>, fullPath));
    }
    if (Array.isArray(obj[key])) {
      for (let i = 0; i < (obj[key] as unknown[]).length; i++) {
        const item = (obj[key] as unknown[])[i];
        if (typeof item === 'object' && item !== null) {
          found.push(...hasForbiddenKeys(item as Record<string, unknown>, `${fullPath}[${i}]`));
        }
      }
    }
  }
  return found;
}
