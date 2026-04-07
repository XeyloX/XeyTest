import { useEffect } from 'react';
import { socket } from '../services/socket';

export function useSocketAuth(user) {
  useEffect(() => {
    if (!user) return;
    socket.emit('auth:identify', { userId: user.id, username: user.username, role: user.role });
  }, [user]);
}
