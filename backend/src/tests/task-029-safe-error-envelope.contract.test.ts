import { describe, it, expect } from 'vitest';

describe('Task 029 - Safe Error Envelope', () => {
  it('should use safeErrorEnvelope function in routes', () => {
    const fs = require('fs');
    const routesPath = require('path').resolve(__dirname, '../routes/task029ExpansionOperationsRoutes.ts');
    const content = fs.readFileSync(routesPath, 'utf8');
    expect(content).toContain('function safeErrorEnvelope');
    const calls = (content.match(/safeErrorEnvelope\(/g) || []).length;
    expect(calls).toBeGreaterThan(10);
  });

  it('should use safeDeniedResponse function in routes', () => {
    const fs = require('fs');
    const routesPath = require('path').resolve(__dirname, '../routes/task029ExpansionOperationsRoutes.ts');
    const content = fs.readFileSync(routesPath, 'utf8');
    expect(content).toContain('function safeDeniedResponse');
  });

  it('error envelopes should include safeMessage not raw error', () => {
    const fs = require('fs');
    const routesPath = require('path').resolve(__dirname, '../routes/task029ExpansionOperationsRoutes.ts');
    const content = fs.readFileSync(routesPath, 'utf8');
    expect(content).toContain('safeMessage');
    expect(content).toContain('reasonCodes');
  });

  it('error envelopes should not expose stack traces', () => {
    const fs = require('fs');
    const routesPath = require('path').resolve(__dirname, '../routes/task029ExpansionOperationsRoutes.ts');
    const content = fs.readFileSync(routesPath, 'utf8');
    expect(content).not.toContain('stack');
    expect(content).not.toContain('.stack');
  });

  it('error envelopes should not expose internal paths', () => {
    const fs = require('fs');
    const routesPath = require('path').resolve(__dirname, '../routes/task029ExpansionOperationsRoutes.ts');
    const content = fs.readFileSync(routesPath, 'utf8');
    expect(content).not.toContain('postgres://');
    expect(content).not.toContain('postgresql://');
    expect(content).not.toContain('mysql://');
  });
});
