import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const ROUTES_PATH = path.resolve(__dirname, '../routes/task029ExpansionOperationsRoutes.ts');
const content = fs.readFileSync(ROUTES_PATH, 'utf8');

describe('Peer role denied contract', () => {
  it('no peer guard is defined for ops console', () => {
    expect(content).not.toContain("requireRole('peer')");
  });

  it('no route uses peer role', () => {
    const peerRoleMatch = content.match(/requireRole\('peer'\)/);
    expect(peerRoleMatch).toBeNull();
  });

  it('only admin and student roles are used in requireRole calls', () => {
    const roleMatches = content.matchAll(/requireRole\('(\w+)'\)/g);
    const roles = [...roleMatches].map(m => m[1]);
    for (const role of roles) {
      expect(['admin', 'student']).toContain(role);
    }
  });
});
