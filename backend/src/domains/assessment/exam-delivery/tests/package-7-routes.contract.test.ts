import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Package 7 - Route Contracts', () => {
  const routePath = path.resolve(__dirname, '../../../../routes/examDelivery.ts');

  it('route file exists', () => {
    expect(fs.existsSync(routePath)).toBe(true);
  });

  it('route file contains expected route patterns', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain('/sessions');
    expect(content.toLowerCase()).toContain('router.post(');
    expect(content.toLowerCase()).toContain('router.get(');
  });

  it('route is exported as default', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain('export default router');
  });

  it('route file does not import OpenAI', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content.toLowerCase()).not.toContain('openai');
  });

  it('route file does not import Genkit', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content.toLowerCase()).not.toContain('genkit');
  });

  it('route file does not import Pinecone', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content.toLowerCase()).not.toContain('pinecone');
  });

  it('route file does not import Ollama', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content.toLowerCase()).not.toContain('ollama');
  });

  it('route file does not import Anthropic', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content.toLowerCase()).not.toContain('anthropic');
  });

  it('route file does not import Gemini', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content.toLowerCase()).not.toContain('gemini');
  });

  it('route file does not import React', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content.toLowerCase()).not.toContain('react');
  });

  it('route file does not import Next', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content.toLowerCase()).not.toContain("from 'next'");
    expect(content.toLowerCase()).not.toContain('require("next"');
  });

  it('route file does not import OCR libraries', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content.toLowerCase()).not.toContain('tesseract');
    expect(content.toLowerCase()).not.toContain('ocr');
  });

  it('route file does not import frontend modules', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).not.toContain('frontend/');
  });

  it('mutating routes require idempotency key (check header references)', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain('x-idempotency-key');
    expect(content).toContain('requireIdempotencyKey');
  });

  it('heartbeat does not require idempotency key', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain('/timing/heartbeat');
  });
});
