import { existsSync } from 'fs';
import { resolve } from 'path';
import prisma from '../lib/prisma';
import { DeploymentReadinessStatus, ReadinessSeverity, PrismaReadinessResult, ReadinessCheckResult } from '../contracts/task023DeploymentReadinessContracts';
import { REQUIRED_MODELS } from './task023DatabaseReadinessService';

export function getPrismaReadinessResult(): PrismaReadinessResult {
  const schemaPath = resolve(__dirname, '../../prisma/schema.prisma');
  const schemaExists = existsSync(schemaPath);
  const clientAvailable = typeof prisma !== 'undefined' && prisma !== null;

  const availableModels: string[] = [];
  const missingModels: string[] = [];

  const prismaAny = prisma as unknown as Record<string, unknown>;
  for (const modelName of REQUIRED_MODELS) {
    const modelAccessor = prismaAny[modelName];
    if (modelAccessor !== undefined) {
      availableModels.push(modelName);
    } else {
      missingModels.push(modelName);
    }
  }

  const allModelsAvailable = missingModels.length === 0;
  const ready = schemaExists && clientAvailable && allModelsAvailable;

  return {
    status: ready ? 'ready' : allModelsAvailable ? 'degraded' : 'not_ready',
    severity: !schemaExists ? 'error' : !allModelsAvailable ? 'warning' : 'info',
    schemaExists,
    clientAvailable,
    requiredModelsAvailable: availableModels,
    requiredModelsMissing: missingModels,
    message: !schemaExists
      ? 'Prisma schema file not found at expected path'
      : !clientAvailable
        ? 'Prisma client is not available'
        : !allModelsAvailable
          ? `Prisma client loaded. ${missingModels.length} required model(s) not found in client: ${missingModels.join(', ')}`
          : `Prisma client ready. All ${REQUIRED_MODELS.length} required models available.`,
  };
}

export function getPrismaReadinessCheck(): ReadinessCheckResult {
  const result = getPrismaReadinessResult();
  return {
    name: 'prisma-readiness',
    status: result.status,
    severity: result.severity,
    required: true,
    message: result.message,
    details: {
      schemaExists: result.schemaExists,
      clientAvailable: result.clientAvailable,
      modelsAvailable: result.requiredModelsAvailable.length,
      modelsMissing: result.requiredModelsMissing.length,
    },
  };
}
