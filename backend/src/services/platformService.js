const prisma = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const createPlatform = async (name) => {
  return await prisma.platform.create({
    data: {
      name,
      apiKey: uuidv4(),
    },
  });
};

const getPlatformByApiKey = async (apiKey) => {
  return await prisma.platform.findUnique({
    where: { apiKey },
  });
};

const getAllPlatforms = async () => {
  return await prisma.platform.findMany({
    include: {
      _count: {
        select: { companies: true },
      },
    },
  });
};

module.exports = {
  createPlatform,
  getPlatformByApiKey,
  getAllPlatforms,
};
