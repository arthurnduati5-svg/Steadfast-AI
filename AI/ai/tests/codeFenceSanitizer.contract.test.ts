import { describe, expect, it } from 'vitest';
import { toolRouter } from '../tools/handlers';

describe('Code fence sanitizer contract', () => {
  it('keeps real fenced code and normalizes unknown fence language using content', async () => {
    const r = await toolRouter('formatting_polisher', {
      rawText: '```in\ndef add(a, b):\n  return a + b\n```',
      languageMode: 'english',
    });

    expect(r.cleanedText).toMatch(/```(javascript|python|text)?/);
    expect(r.cleanedText).not.toContain('```in');
    expect(r.cleanedText).toContain('def add(a, b):');
    expect(r.cleanedText).toContain('return a + b');
  });

  it('unwraps prose mistakenly fenced as code even with known code language', async () => {
    const r = await toolRouter('formatting_polisher', {
      rawText:
        '```javascript\nThis function helps students understand loops.\nIt explains one idea at a time.\n```',
      languageMode: 'english',
    });

    expect(r.cleanedText).not.toContain('```');
    expect(r.cleanedText.toLowerCase()).toContain('this function helps students understand loops');
    expect(r.cleanedText.toLowerCase()).toContain('it explains one idea at a time');
  });

  it('handles mixed fenced blocks by preserving code blocks and unwrapping prose blocks', async () => {
    const r = await toolRouter('formatting_polisher', {
      rawText:
        '```javascript\nconst x = 1;\nconsole.log(x);\n```\n\n```in\nStep one: we explain why x exists.\nStep two: we describe meaning.\n```',
      languageMode: 'english',
    });

    const fenceMarkers = (r.cleanedText.match(/```/g) || []).length;
    expect(fenceMarkers).toBe(2); // one preserved code block (open + close)
    expect(r.cleanedText).toContain('```javascript');
    expect(r.cleanedText.toLowerCase()).toContain('step one: we explain why x exists');
    expect(r.cleanedText.toLowerCase()).not.toContain('```in');
  });

  it('normalizes unknown fenced shell-like code to powershell', async () => {
    const r = await toolRouter('formatting_polisher', {
      rawText:
        '```custom\nGet-Process | Where-Object { $_.ProcessName -like "*node*" }\n```',
      languageMode: 'english',
    });

    expect(r.cleanedText).toContain('```powershell');
    expect(r.cleanedText).toContain('Get-Process');
  });

  it('does not wrap explanatory prose into a fenced block from language prefixes', async () => {
    const r = await toolRouter('formatting_polisher', {
      rawText: 'python this is a basic explanation about functions and when to use them.',
      languageMode: 'english',
    });

    expect(r.cleanedText).not.toContain('```');
    expect(r.cleanedText.toLowerCase()).toContain('basic explanation');
  });
});
