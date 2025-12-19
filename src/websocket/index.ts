import { Server as SocketIOServer } from 'socket.io';

export const setupWebSocket = (io: SocketIOServer) => {
  io.on('connection', socket => {
    console.log('Client connected:', socket.id);

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });

    socket.on('ping', () => {
      socket.emit('pong');
    });
  });
};
