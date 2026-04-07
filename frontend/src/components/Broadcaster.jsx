import { useEffect, useRef, useState } from 'react';
import { api } from '../services/api';
import { socket } from '../services/socket';

export default function Broadcaster({ token, user }) {
  const [title, setTitle] = useState('My Stream');
  const [category, setCategory] = useState('General');
  const [stream, setStream] = useState(null);
  const mediaRef = useRef(null);
  const peersRef = useRef(new Map());

  useEffect(() => {
    const onNewViewer = async ({ streamId, viewerSocketId }) => {
      if (!stream || Number(stream.id) !== Number(streamId) || !mediaRef.current) return;
      if (peersRef.current.has(viewerSocketId)) return;

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });

      mediaRef.current.getTracks().forEach((track) => pc.addTrack(track, mediaRef.current));

      pc.onicecandidate = (event) => {
        if (!event.candidate) return;
        socket.emit('webrtc:signal', {
          targetSocketId: viewerSocketId,
          payload: { type: 'candidate', candidate: event.candidate }
        });
      };

      pc.onconnectionstatechange = () => {
        if (['failed', 'closed', 'disconnected'].includes(pc.connectionState)) {
          pc.close();
          peersRef.current.delete(viewerSocketId);
        }
      };

      peersRef.current.set(viewerSocketId, pc);

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit('webrtc:signal', {
        targetSocketId: viewerSocketId,
        payload: { type: 'offer', sdp: offer.sdp }
      });
    };

    const onSignal = async ({ fromSocketId, payload }) => {
      const pc = peersRef.current.get(fromSocketId);
      if (!pc || !payload?.type) return;

      if (payload.type === 'answer' && payload.sdp) {
        await pc.setRemoteDescription({ type: 'answer', sdp: payload.sdp });
      }

      if (payload.type === 'candidate' && payload.candidate) {
        try {
          await pc.addIceCandidate(payload.candidate);
        } catch {
          // ignore candidate race conditions
        }
      }
    };

    const onLeft = ({ viewerSocketId }) => {
      const pc = peersRef.current.get(viewerSocketId);
      if (pc) pc.close();
      peersRef.current.delete(viewerSocketId);
    };

    socket.on('webrtc:newViewer', onNewViewer);
    socket.on('webrtc:signal', onSignal);
    socket.on('webrtc:viewerLeft', onLeft);

    return () => {
      socket.off('webrtc:newViewer', onNewViewer);
      socket.off('webrtc:signal', onSignal);
      socket.off('webrtc:viewerLeft', onLeft);
    };
  }, [stream]);

  async function start() {
    const media = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    mediaRef.current = media;
    const data = await api('/api/streams/start', { method: 'POST', token, body: { title, category } });
    setStream(data.stream);
    socket.emit('stream:registerStreamer', { streamId: data.stream.id });
  }

  async function stop() {
    if (!stream) return;
    await api(`/api/streams/stop/${stream.id}`, { method: 'POST', token });
    mediaRef.current?.getTracks().forEach((t) => t.stop());
    mediaRef.current = null;

    for (const pc of peersRef.current.values()) pc.close();
    peersRef.current.clear();

    setStream(null);
  }

  if (!user || !['streamer', 'admin'].includes(user.role)) return null;

  return (
    <div>
      <h3>Broadcast</h3>
      <input value={title} onChange={(e) => setTitle(e.target.value)} />
      <input value={category} onChange={(e) => setCategory(e.target.value)} />
      {!stream ? <button onClick={start}>Start stream</button> : <button onClick={stop}>Stop stream #{stream.id}</button>}
    </div>
  );
}
