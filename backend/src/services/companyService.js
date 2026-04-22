const prisma = require('../config/db');

const createCompany = async (platformId, name) => {
  return await prisma.company.create({
    data: {
      name,
      platformId,
    },
  });
};

const getCompaniesByPlatform = async (platformId) => {
  return await prisma.company.findMany({
    where: { platformId },
    include: {
      _count: {
        select: { users: true },
      },
    },
  });
};

module.exports = {
  createCompany,
  getCompaniesByPlatform,
};
