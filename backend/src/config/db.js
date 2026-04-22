const { PrismaClient } = require('@prisma/client');

let prisma;
try {
  prisma = new PrismaClient();
  console.log('📦 Prisma Client cargado');
} catch (e) {
  console.log('⚠️ Error cargando Prisma, usando Mock para desarrollo');
  prisma = {
    $queryRaw: async () => [1],
    appSetting: { findUnique: async () => null }
  };
}

module.exports = prisma;
