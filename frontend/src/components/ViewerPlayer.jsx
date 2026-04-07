import { useEffect, useRef, useState } from 'react';
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

      const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });

      pc.ontrack = (event) => {
        const [remoteStream] = event.streams;
        if (videoRef.current) videoRef.current.srcObject = remoteStream;
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
          cleanupPeer();
          setStatus('reconnecting');
          reconnectTimerRef.current = setTimeout(() => {
            setStatus('connecting');
            socket.emit('stream:joinViewer', { streamId: stream.id });
          }, 1200);
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
      } else if (payload.type === 'candidate' && payload.candidate) {
        try {
          await pc.addIceCandidate(payload.candidate);
        } catch {
          // ignored
        }
      }
    };

    const onEnded = ({ streamId }) => {
      if (Number(streamId) !== Number(stream.id)) return;
      setStatus('ended');
      cleanupPeer();
      if (videoRef.current) videoRef.current.srcObject = null;
    };

    setStatus('connecting');
    socket.on('webrtc:signal', onSignal);
    socket.on('stream:ended', onEnded);
    socket.emit('stream:joinViewer', { streamId: stream.id });

    return () => {
      socket.off('webrtc:signal', onSignal);
      socket.off('stream:ended', onEnded);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      cleanupPeer();
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [stream?.id]);

  if (!stream) {
    return <div className="panel"><h3>Viewer</h3><p>Select a live stream to start watching.</p></div>;
  }

  return (
    <div className="panel video-wrap">
      <h3>Watching: {stream.title}</h3>
      <video ref={videoRef} autoPlay playsInline controls muted={false} />
      <div>Status: {status}</div>
    </div>
  );
}
