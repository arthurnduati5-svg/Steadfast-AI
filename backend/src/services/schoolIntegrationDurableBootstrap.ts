import { logger } from '../utils/logger';

let initialized = false;

export function isDurableSchoolIntegrationEnabled(): boolean {
  return initialized;
}

export function initializeDurableSchoolIntegration(): void {
  if (initialized) {
    logger.warn('[SchoolIntegrationDurableBootstrap] Already initialized');
    return;
  }

  logger.info('[SchoolIntegrationDurableBootstrap] Initializing durable school integration repositories');

  initialized = true;

  logger.info(
    '[SchoolIntegrationDurableBootstrap] Durable school integration initialized. ' +
    'All school integration state will use Prisma-backed persistence.',
  );
}
