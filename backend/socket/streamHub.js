import xss from 'xss';
import { createMessage, deleteMessage, isUserTimedOut, listMessages, setTimeoutForUser } from '../models/messageModel.js';
import { getFollowers } from '../models/followModel.js';
import { updateViewerCount } from '../models/streamModel.js';

export class StreamHub {
  constructor(io) {
    this.io = io;
    this.userSockets = new Map();
    this.socketUsers = new Map();
    this.liveStreams = new Map(); // streamId -> { streamerSocketId, viewers:Set }
    this.chatRate = new Map();
  }

  bind() {
    this.io.on('connection', (socket) => {
      socket.on('auth:identify', ({ userId, username, role }) => {
        if (!userId) return;
        this.socketUsers.set(socket.id, { userId, username, role });
        if (!this.userSockets.has(userId)) this.userSockets.set(userId, new Set());
        this.userSockets.get(userId).add(socket.id);
      });

      socket.on('stream:registerStreamer', ({ streamId }) => {
        this.liveStreams.set(Number(streamId), { streamerSocketId: socket.id, viewers: new Set() });
        socket.join(`stream:${streamId}`);
      });

      socket.on('stream:joinViewer', async ({ streamId }) => {
        const stream = this.liveStreams.get(Number(streamId));
        if (!stream) return socket.emit('stream:error', { error: 'Stream unavailable' });
        stream.viewers.add(socket.id);
        socket.join(`stream:${streamId}`);
        await this.emitViewerCount(streamId);
        this.io.to(stream.streamerSocketId).emit('webrtc:newViewer', { streamId, viewerSocketId: socket.id });
        socket.emit('chat:history', { streamId, messages: await listMessages(streamId) });
      });

      socket.on('webrtc:signal', ({ targetSocketId, payload }) => {
        this.io.to(targetSocketId).emit('webrtc:signal', { fromSocketId: socket.id, payload });
      });

      socket.on('chat:send', async ({ streamId, content }) => {
        const user = this.socketUsers.get(socket.id);
        if (!user || typeof content !== 'string') return;
        const key = `${streamId}:${user.userId}`;
        const now = Date.now();
        const last = this.chatRate.get(key) || 0;
        if (now - last < 1200) return socket.emit('chat:error', { error: 'Slow down' });
        this.chatRate.set(key, now);
        if (await isUserTimedOut(streamId, user.userId)) {
          return socket.emit('chat:error', { error: 'You are timed out' });
        }
        const clean = xss(content.trim().slice(0, 500));
        if (!clean) return;
        const saved = await createMessage({ streamId, userId: user.userId, content: clean });
        this.io.to(`stream:${streamId}`).emit('chat:message', {
          ...saved,
          username: user.username
        });
      });

      socket.on('chat:delete', async ({ streamId, messageId }) => {
        const user = this.socketUsers.get(socket.id);
        if (!user || !['admin', 'streamer'].includes(user.role)) return;
        const msg = await deleteMessage(messageId, streamId);
        if (msg) this.io.to(`stream:${streamId}`).emit('chat:deleted', { messageId });
      });

      socket.on('chat:timeout', async ({ streamId, userId, seconds = 60 }) => {
        const user = this.socketUsers.get(socket.id);
        if (!user || !['admin', 'streamer'].includes(user.role)) return;
        const expiresAt = new Date(Date.now() + Math.max(10, Math.min(seconds, 3600)) * 1000);
        await setTimeoutForUser(streamId, userId, expiresAt);
        this.io.to(`stream:${streamId}`).emit('chat:timeoutSet', { userId, expiresAt });
      });

      socket.on('disconnect', async () => {
        const user = this.socketUsers.get(socket.id);
        this.socketUsers.delete(socket.id);
        if (user && this.userSockets.has(user.userId)) {
          this.userSockets.get(user.userId).delete(socket.id);
          if (this.userSockets.get(user.userId).size === 0) this.userSockets.delete(user.userId);
        }
        for (const [streamId, state] of this.liveStreams.entries()) {
          if (state.streamerSocketId === socket.id) {
            this.io.to(`stream:${streamId}`).emit('stream:ended', { streamId });
            this.liveStreams.delete(streamId);
            await updateViewerCount(streamId, 0);
          } else if (state.viewers.delete(socket.id)) {
            await this.emitViewerCount(streamId);
            this.io.to(state.streamerSocketId).emit('webrtc:viewerLeft', { streamId, viewerSocketId: socket.id });
          }
        }
      });
    });
  }

  async emitViewerCount(streamId) {
    const state = this.liveStreams.get(Number(streamId));
    const count = state ? state.viewers.size : 0;
    await updateViewerCount(Number(streamId), count);
    this.io.emit('streams:update', { streamId: Number(streamId), viewerCount: count });
  }

  async onStreamStarted(stream) {
    this.io.emit('streams:liveStarted', { stream });
    const followerIds = await getFollowers(stream.streamer_id);
    for (const followerId of followerIds) {
      const socketIds = this.userSockets.get(followerId);
      if (!socketIds) continue;
      for (const sid of socketIds) {
        this.io.to(sid).emit('notify:followedLive', { stream });
      }
    }
  }

  onStreamStopped(streamId) {
    this.io.to(`stream:${streamId}`).emit('stream:ended', { streamId });
    this.liveStreams.delete(Number(streamId));
    this.io.emit('streams:ended', { streamId: Number(streamId) });
  }
}
