/**
 * Prisma Client كـ singleton.
 * مهم في بيئة Serverless (Vercel) لتفادي فتح اتصالات جديدة مع كل
 * hot-reload أو استدعاء دالة. نخزّن النسخة على globalThis.
 */
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
