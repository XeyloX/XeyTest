import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { socket } from '../services/socket';

export default function StreamList({ onSelect }) {
  const [streams, setStreams] = useState([]);
  const [category, setCategory] = useState('');

  async function load() {
    const data = await api(`/api/streams/live?category=${encodeURIComponent(category)}`);
    setStreams(data.streams);
  }

  useEffect(() => { load(); }, [category]);

  useEffect(() => {
    const onUpdate = ({ streamId, viewerCount }) => setStreams((prev) => prev.map((s) => s.id === streamId ? { ...s, viewer_count: viewerCount } : s));
    const onStart = ({ stream }) => setStreams((prev) => [stream, ...prev]);
    const onEnd = ({ streamId }) => setStreams((prev) => prev.filter((s) => s.id !== streamId));
    socket.on('streams:update', onUpdate);
    socket.on('streams:liveStarted', onStart);
    socket.on('streams:ended', onEnd);
    return () => {
      socket.off('streams:update', onUpdate);
      socket.off('streams:liveStarted', onStart);
      socket.off('streams:ended', onEnd);
    };
  }, []);

  return <div><h3>Live Streams</h3><input placeholder="filter category" onChange={(e)=>setCategory(e.target.value)} />
    {streams.sort((a,b)=>b.viewer_count-a.viewer_count).map((s) => <div key={s.id}><button onClick={() => onSelect(s)}>{s.title} - {s.streamer_username} ({s.viewer_count})</button></div>)}
  </div>;
}
