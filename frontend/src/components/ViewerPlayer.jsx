import { useEffect, useRef, useState } from 'react';
import Peer from 'simple-peer';
import { socket } from '../services/socket';

export default function ViewerPlayer({ stream }) {
  const videoRef = useRef(null);
  const [status, setStatus] = useState('idle');
  const pcRef = useRef(null);
  const streamerSocketIdRef = useRef(null);
  const reconnectTimerRef = useRef(null);

  useEffect(() => {
    if (!stream) return;

    const cleanupPeer = () => {
      if (pcRef.current) {
        pcRef.current.ontrack = null;
        pcRef.current.onicecandidate = null;
        pcRef.current.onconnectionstatechange = null;
        pcRef.current.close();
        pcRef.current = null;
      }
      streamerSocketIdRef.current = null;
    };

    const ensurePeer = () => {
      if (pcRef.current) return pcRef.current;
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });

      pc.ontrack = (event) => {
        const [remoteStream] = event.streams;
        if (videoRef.current) {
          videoRef.current.srcObject = remoteStream;
        }
        setStatus('playing');
      };

      pc.onicecandidate = (event) => {
        if (!event.candidate || !streamerSocketIdRef.current) return;
        socket.emit('webrtc:signal', {
          targetSocketId: streamerSocketIdRef.current,
          payload: { type: 'candidate', candidate: event.candidate }
        });
      };

      pc.onconnectionstatechange = () => {
        if (['failed', 'disconnected'].includes(pc.connectionState)) {
          setStatus('reconnecting');
          cleanupPeer();
          reconnectTimerRef.current = setTimeout(() => {
            setStatus('connecting');
            socket.emit('stream:joinViewer', { streamId: stream.id });
          }, 1500);
        }
      };

      pcRef.current = pc;
      return pc;
    };

    const onSignal = async ({ fromSocketId, payload }) => {
      if (!payload?.type) return;
      streamerSocketIdRef.current = fromSocketId;
      const pc = ensurePeer();

      if (payload.type === 'offer' && payload.sdp) {
        await pc.setRemoteDescription({ type: 'offer', sdp: payload.sdp });
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('webrtc:signal', {
          targetSocketId: fromSocketId,
          payload: { type: 'answer', sdp: answer.sdp }
        });
      }

      if (payload.type === 'candidate' && payload.candidate) {
        try {
          await pc.addIceCandidate(payload.candidate);
        } catch {
          // ignore out-of-order candidate edge cases
        }
      }
    };

    const onEnded = ({ streamId }) => {
      if (Number(streamId) !== Number(stream.id)) return;
      setStatus('ended');
      cleanupPeer();
      if (videoRef.current) videoRef.current.srcObject = null;
    };

    socket.on('webrtc:signal', onSignal);
    socket.on('stream:ended', onEnded);

    setStatus('connecting');
    socket.emit('stream:joinViewer', { streamId: stream.id });

    return () => {
      socket.off('webrtc:signal', onSignal);
      socket.off('stream:ended', onEnded);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      cleanupPeer();
      if (videoRef.current) videoRef.current.srcObject = null;
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

  return (
    <div>
      <h3>Watching: {stream.title}</h3>
      <video ref={videoRef} autoPlay playsInline controls muted={false} style={{ width: 480 }} />
      <div>{status}</div>
    </div>
  );
  return <div><h3>Watching: {stream.title}</h3><video ref={videoRef} autoPlay playsInline controls muted={false} style={{ width: 480 }} /><div>{status}</div></div>;
}
