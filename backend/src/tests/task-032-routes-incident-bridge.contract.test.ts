import { describe, it, expect, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import task032Router from '../routes/task032ControlledCanaryActivationRoutes';
import { task032ControlledCanaryActivationRepository } from '../repositories/task032ControlledCanaryActivationRepository';

function createApp(): express.Express {
  const app = express();
  app.use(express.json());
  app.use('/api/task-032', task032Router);
  return app;
}

describe('Task 032 - Routes / Incident Bridge Contract', () => {
  const app = createApp();

  beforeEach(async () => {
    await task032ControlledCanaryActivationRepository.clearTask032StoresForTests();
  });

  const validIncident = {
    schoolId: 'school_task032_canary_safe',
    actorRole: 'school_admin',
    incidentType: 'privacy_leak_detected',
    incidentSeverity: 'high',
    incidentDetails: 'Simulated privacy leak for test verification'
  };

  it('POST /activations/:activationId/incident-bridge should return 200', async () => {
    const res = await request(app)
      .post('/api/task-032/activations/activation_incident_001/incident-bridge')
      .send(validIncident);
    expect(res.status).toBe(200);
  });

  it('POST /activations/:activationId/incident-bridge should contain incidentId', async () => {
    const res = await request(app)
      .post('/api/task-032/activations/activation_incident_001/incident-bridge')
      .send(validIncident);
    expect(res.body.incidentId).toBeTruthy();
    expect(typeof res.body.incidentId).toBe('string');
  });

  it('POST /activations/:activationId/incident-bridge should contain acknowledged flag', async () => {
    const res = await request(app)
      .post('/api/task-032/activations/activation_incident_001/incident-bridge')
      .send(validIncident);
    expect(res.body.acknowledged).toBeTypeOf('boolean');
  });

  it('POST /activations/:activationId/incident-bridge should include severity', async () => {
    const res = await request(app)
      .post('/api/task-032/activations/activation_incident_001/incident-bridge')
      .send(validIncident);
    expect(res.body.severity).toBe(validIncident.incidentSeverity);
  });

  it('POST /activations/:activationId/incident-bridge should include incidentType', async () => {
    const res = await request(app)
      .post('/api/task-032/activations/activation_incident_001/incident-bridge')
      .send(validIncident);
    expect(res.body.incidentType).toBe(validIncident.incidentType);
  });

  it('POST /activations/:activationId/incident-bridge should not leak raw student data', async () => {
    const res = await request(app)
      .post('/api/task-032/activations/activation_incident_001/incident-bridge')
      .send(validIncident);
    const json = JSON.stringify(res.body);
    expect(json).not.toContain('raw student');
    expect(json).not.toContain('real email');
  });

  it('POST /activations/:activationId/incident-bridge should respond with json', async () => {
    const res = await request(app)
      .post('/api/task-032/activations/activation_incident_001/incident-bridge')
      .send(validIncident);
    expect(res.headers['content-type']).toMatch(/json/);
  });

  it('POST /activations/:activationId/incident-bridge should have timestamp', async () => {
    const res = await request(app)
      .post('/api/task-032/activations/activation_incident_001/incident-bridge')
      .send(validIncident);
    expect(res.body.timestamp).toBeTruthy();
    expect(() => new Date(res.body.timestamp)).not.toThrow();
  });

  it('POST /activations/:activationId/incident-bridge should include resolution path', async () => {
    const res = await request(app)
      .post('/api/task-032/activations/activation_incident_001/incident-bridge')
      .send(validIncident);
    expect(res.body.resolutionPath).toBeTruthy();
    expect(typeof res.body.resolutionPath).toBe('string');
  });

  it('POST /activations/:activationId/incident-bridge should include activationId in response', async () => {
    const res = await request(app)
      .post('/api/task-032/activations/activation_incident_001/incident-bridge')
      .send(validIncident);
    expect(res.body.activationId).toBe('activation_incident_001');
  });

  it('POST /activations/:activationId/incident-bridge should not contain secrets', async () => {
    const res = await request(app)
      .post('/api/task-032/activations/activation_incident_001/incident-bridge')
      .send(validIncident);
    const json = JSON.stringify(res.body);
    expect(json).not.toContain('Bearer');
    expect(json).not.toContain('secret');
    expect(json).not.toContain('password');
  });

  it('POST /activations/:activationId/incident-bridge should reject missing incidentType', async () => {
    const res = await request(app)
      .post('/api/task-032/activations/activation_incident_001/incident-bridge')
      .send({ ...validIncident, incidentType: undefined });
    expect(res.body.acknowledged).toBe(false);
    expect(res.body.blockingIssues).toBeTruthy();
  });
});
