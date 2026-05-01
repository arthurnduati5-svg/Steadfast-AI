import { PrismaClient } from '@prisma/client';

type PrismaGlobal = typeof globalThis & {
  __steadfastFrontendPrisma?: PrismaClient;
};

const prismaGlobal = globalThis as PrismaGlobal;

const prisma =
  prismaGlobal.__steadfastFrontendPrisma ||
  new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  prismaGlobal.__steadfastFrontendPrisma = prisma;
}

export default prisma;
