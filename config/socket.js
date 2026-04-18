const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const env = require('./env');

module.exports = function (httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    socket.join('staff-room');

    socket.on('disconnect', () => {
      // Client disconnected
    });
  });

  return io;
};
