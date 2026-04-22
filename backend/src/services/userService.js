const prisma = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const createUser = async (companyId, email) => {
  return await prisma.user.create({
    data: {
      email,
      companyId,
      portalAccessKey: uuidv4().substring(0, 8), // Clave corta y aleatoria como pediste
    },
  });
};

const getUserByEmailAndKey = async (email, portalAccessKey) => {
  return await prisma.user.findFirst({
    where: {
      email,
      portalAccessKey,
    },
    include: {
      company: {
        include: {
          platform: true,
        },
      },
    },
  });
};

module.exports = {
  createUser,
  getUserByEmailAndKey,
};
