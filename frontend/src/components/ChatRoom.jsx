import { useEffect, useState } from 'react';
import { socket } from '../services/socket';

export default function ChatRoom({ stream, user }) {
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');

  useEffect(() => {
    if (!stream) return;
    const onHistory = ({ streamId, messages }) => streamId === stream.id && setMessages(messages);
    const onMessage = (msg) => msg.stream_id === stream.id && setMessages((p) => [...p, msg]);
    const onDeleted = ({ messageId }) => setMessages((p) => p.map((m) => m.id === messageId ? { ...m, content: '[deleted]' } : m));
    socket.on('chat:history', onHistory);
    socket.on('chat:message', onMessage);
    socket.on('chat:deleted', onDeleted);
    return () => {
      socket.off('chat:history', onHistory);
      socket.off('chat:message', onMessage);
      socket.off('chat:deleted', onDeleted);
    };
  }, [stream?.id]);

  if (!stream) return null;
  return <div><h4>Chat</h4>
    <div>{messages.map((m)=><div key={m.id}><b>{m.username || m.user_id}</b> [{new Date(m.created_at).toLocaleTimeString()}]: {m.content}</div>)}</div>
    <input value={content} onChange={(e)=>setContent(e.target.value)} />
    <button onClick={() => { socket.emit('chat:send', { streamId: stream.id, content }); setContent(''); }}>Send</button>
    {user && ['admin','streamer'].includes(user.role) && <button onClick={() => messages[0] && socket.emit('chat:delete', { streamId: stream.id, messageId: messages[0].id })}>Delete latest</button>}
  </div>;
}
