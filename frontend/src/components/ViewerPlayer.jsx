import { useEffect, useRef, useState } from 'react';
import Peer from 'simple-peer';
import { socket } from '../services/socket';

export default function ViewerPlayer({ stream }) {
  const videoRef = useRef(null);
  const [status, setStatus] = useState('idle');
  const peerRef = useRef(null);

  useEffect(() => {
    if (!stream) return;
    let reconnectTimer;
    const connect = () => {
      setStatus('connecting');
      socket.emit('stream:joinViewer', { streamId: stream.id });
      const peer = new Peer({ initiator: false, trickle: true });
      peerRef.current = peer;
      peer.on('signal', (payload) => {
        if (stream.streamerSocketId) socket.emit('webrtc:signal', { targetSocketId: stream.streamerSocketId, payload });
      });
      peer.on('stream', (media) => {
        videoRef.current.srcObject = media;
        setStatus('playing');
      });
      peer.on('error', () => {
        setStatus('reconnecting');
        reconnectTimer = setTimeout(connect, 2000);
      });
    };

    const onSignal = ({ fromSocketId, payload }) => {
      stream.streamerSocketId = fromSocketId;
      peerRef.current?.signal(payload);
    };
    const onEnded = () => setStatus('ended');
    socket.on('webrtc:signal', onSignal);
    socket.on('stream:ended', onEnded);
    connect();
    return () => {
      clearTimeout(reconnectTimer);
      socket.off('webrtc:signal', onSignal);
      socket.off('stream:ended', onEnded);
      peerRef.current?.destroy();
    };
  }, [stream?.id]);

  if (!stream) return null;
  return <div><h3>Watching: {stream.title}</h3><video ref={videoRef} autoPlay playsInline controls muted={false} style={{ width: 480 }} /><div>{status}</div></div>;
}
