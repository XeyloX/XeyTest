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

  useEffect(() => {
    load();
  }, [category]);

  useEffect(() => {
    const onUpdate = ({ streamId, viewerCount }) => setStreams((prev) => prev.map((s) => (s.id === streamId ? { ...s, viewer_count: viewerCount } : s)));
    const onStart = ({ stream }) => setStreams((prev) => [stream, ...prev.filter((p) => p.id !== stream.id)]);
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

  return (
    <div className="panel">
      <h3>Live Streams</h3>
      <input placeholder="Filter by category" onChange={(e) => setCategory(e.target.value)} />
      {streams
        .slice()
        .sort((a, b) => b.viewer_count - a.viewer_count)
        .map((s) => (
          <div className="list-item" key={s.id}>
            <div><b>{s.title}</b></div>
            <div>{s.streamer_username} · {s.category}</div>
            <div>{s.viewer_count} viewers</div>
            <button onClick={() => onSelect(s)}>Watch</button>
          </div>
        ))}
    </div>
  );
}
