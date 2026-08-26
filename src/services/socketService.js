const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const env = require('../config/env');

let io = null;

// Each authenticated socket joins a room named after their userId, so
// emitToUser() below can reach every open connection for that person
// (a user may have multiple tabs/devices open at once).
function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: env.clientUrl, credentials: true },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('No token provided'));
      const decoded = jwt.verify(token, env.jwtSecret);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.userId}`);

    socket.on('disconnect', () => {
      // socket.io auto-leaves rooms on disconnect; nothing else to clean up.
    });
  });

  return io;
}

function emitToUser(userId, event, payload) {
  if (!io) return; // socket layer not initialized (e.g. in a script/test context)
  io.to(`user:${userId}`).emit(event, payload);
}

module.exports = { initSocket, emitToUser };
