const prisma = require('../config/db');

const trackOpening = async (req, res) => {
  const { trackingId } = req.params;

  try {
    const sentEmail = await prisma.sentEmail.findUnique({
      where: { trackingId }
    });

    if (sentEmail) {
      await prisma.trackingLog.create({
        data: {
          sentEmailId: sentEmail.id,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        }
      });
    }

    // Devolver una imagen de 1x1 transparente
    const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.writeHead(200, {
      'Content-Type': 'image/gif',
      'Content-Length': pixel.length,
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });
    res.end(pixel);
  } catch (error) {
    console.error('Error en tracking pixel:', error);
    res.status(500).end();
  }
};

module.exports = { trackOpening };
