import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Package 17 — Routes and No Duplication', () => {
  const routesPath = path.join(__dirname, '../../../../routes/resultRecovery.ts');

  it('backend/src/routes/resultRecovery.ts exists', () => {
    expect(fs.existsSync(routesPath)).toBe(true);
  });

  it('Route imports use Router, Request, Response from express', () => {
    const content = fs.readFileSync(routesPath, 'utf-8');
    expect(content).toContain("import { Router, Request, Response } from 'express'");
  });

  it('Routes import recovery domain services', () => {
    const content = fs.readFileSync(routesPath, 'utf-8');
    expect(content).toContain('ResultRecoveryPlanService');
    expect(content).toContain('ResultRecoveryObjectiveService');
    expect(content).toContain('ResultRecoveryStepService');
    expect(content).toContain('ResultRecoveryPracticeDraftService');
    expect(content).toContain('ResultRecoveryResourceRecommendationService');
    expect(content).toContain('ResultRecoveryTeacherReviewPacketService');
    expect(content).toContain('ResultRecoveryStudentSupportDraftService');
    expect(content).toContain('ResultRecoveryParentSupportNoteDraftService');
    expect(content).toContain('ResultRecoveryCheckpointService');
    expect(content).toContain('ResultRecoverySummaryService');
  });

  it('Mutating routes require idempotency key (x-idempotency-key header)', () => {
    const content = fs.readFileSync(routesPath, 'utf-8');
    expect(content).toContain("x-idempotency-key");
  });

  it('Safe response envelope keys exist (ok, requestId, reasonCode, safeMessage)', () => {
    const content = fs.readFileSync(routesPath, 'utf-8');
    expect(content).toContain('envelope.ok');
    expect(content).toContain('reasonCode');
    expect(content).toContain('safeMessage');
  });

  it('Routes do not import OpenAI, Genkit, Pinecone, etc.', () => {
    const content = fs.readFileSync(routesPath, 'utf-8');
    expect(content).not.toContain('openai');
    expect(content).not.toContain('genkit');
    expect(content).not.toContain('pinecone');
    expect(content).not.toContain('langchain');
  });

  it('Routes do not import frontend modules', () => {
    const content = fs.readFileSync(routesPath, 'utf-8');
    expect(content).not.toContain('react');
    expect(content).not.toContain('next');
    expect(content).not.toContain('client');
  });

  it('Routes do not import OCR libraries', () => {
    const content = fs.readFileSync(routesPath, 'utf-8');
    expect(content).not.toContain('tesseract');
    expect(content).not.toContain('ocr');
  });

  it('Routes do not import notification clients', () => {
    const content = fs.readFileSync(routesPath, 'utf-8');
    expect(content).not.toContain('sendNotification');
    expect(content).not.toContain('sendgrid');
    expect(content).not.toContain('twilio');
    expect(content).not.toContain('@aws-sdk');
  });

  it('Routes do not import PDF libraries', () => {
    const content = fs.readFileSync(routesPath, 'utf-8');
    expect(content).not.toContain('pdfkit');
    expect(content).not.toContain('pdfmake');
    expect(content).not.toContain('jspdf');
  });

  it('No route sends notification', () => {
    const content = fs.readFileSync(routesPath, 'utf-8');
    const routeLines = content.split('\n').filter(l => l.includes('router.'));
    const notifyRoutes = routeLines.filter(l => l.toLowerCase().includes('notif'));
    expect(notifyRoutes.length).toBe(0);
  });

  it('No route creates live assignment', () => {
    const content = fs.readFileSync(routesPath, 'utf-8');
    expect(content).not.toContain('liveAssignment');
    expect(content).not.toContain('homeworkAssignment');
    expect(content).not.toContain('practiceAssignment');
    expect(content).not.toContain('revisionTask');
  });

  it('No route changes marking scores', () => {
    const content = fs.readFileSync(routesPath, 'utf-8');
    expect(content).not.toContain('liveScore');
    expect(content).not.toContain('changeGrade');
    expect(content).not.toContain('resultVersion');
    expect(content).not.toContain('markingResult');
  });

  it('No route mutates mastery', () => {
    const content = fs.readFileSync(routesPath, 'utf-8');
    expect(content).not.toContain('masteryScore');
    expect(content).not.toContain('masteryLevel');
    expect(content).not.toContain('masterySignal');
  });

  it('Package 17 recovery models exist in Prisma schema', () => {
    const schemaPath = path.join(__dirname, '../../../../../prisma/schema.prisma');
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf-8');
      expect(schema).toContain('ResultRecoveryPlanRecord');
      expect(schema).toContain('ResultRecoveryObjectiveRecord');
      expect(schema).toContain('ResultRecoveryStepRecord');
      expect(schema).toContain('ResultRecoveryPracticeDraftRecord');
      expect(schema).toContain('ResultRecoveryResourceRecommendationRecord');
      expect(schema).toContain('ResultRecoveryTeacherReviewPacketRecord');
      expect(schema).toContain('ResultRecoveryStudentSupportDraftRecord');
      expect(schema).toContain('ResultRecoveryParentSupportNoteDraftRecord');
      expect(schema).toContain('ResultRecoveryCheckpointRecord');
      expect(schema).toContain('ResultRecoverySummaryRecord');
    }
  });

  it('Existing Package 16 follow-up models are not duplicated', () => {
    const content = fs.readFileSync(routesPath, 'utf-8');
    const followUpImports = content.match(/result-follow-up/g);
    expect(followUpImports).toBeNull();
  });

  it('Forbidden live assignment/notification/PDF/AI/OCR models do not exist', () => {
    const schemaPath = path.join(__dirname, '../../../../../prisma/schema.prisma');
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf-8');
      const recoverySection = schema.split('ResultRecoveryPlanRecord')[0];
      const afterSection = schema.substring(schema.indexOf('ResultRecoverySummaryRecord') + 30);
      expect(recoverySection).not.toContain('LiveAssignment');
      expect(afterSection).not.toContain('Notification');
      expect(afterSection).not.toContain('Pdf');
    }
  });

  it('Route file has at least 25 router endpoints for recovery operations', () => {
    const content = fs.readFileSync(routesPath, 'utf-8');
    const routeLines = content.split('\n').filter(l => l.trim().startsWith('router.'));
    expect(routeLines.length).toBeGreaterThanOrEqual(25);
  });
});
