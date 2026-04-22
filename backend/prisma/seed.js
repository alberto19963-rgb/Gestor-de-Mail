const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seeding...');

  // Crear Plataforma de prueba
  const platform = await prisma.platform.upsert({
    where: { apiKey: 'test-api-key' },
    update: {},
    create: {
      name: 'Plataforma de Prueba',
      apiKey: 'test-api-key',
    },
  });

  // Crear Empresa de prueba
  const company = await prisma.company.create({
    data: {
      name: 'Empresa Demo S.A.',
      platformId: platform.id,
    },
  });

  console.log({ platform, company });
  console.log('Seeding completado con éxito.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
