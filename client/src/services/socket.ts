import { io } from 'socket.io-client';

const socket = io(import.meta.env.PROD ? '/' : 'http://localhost:5000', {
  withCredentials: true,
  autoConnect: false
});

export const registerUser = (userId: string) => {
  if (!socket.connected) socket.connect();
  socket.emit('register_user', userId);
};

export default socket;
