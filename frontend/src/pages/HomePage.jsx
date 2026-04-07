import { useEffect, useState } from 'react';
import AuthPanel from '../components/AuthPanel';
import StreamList from '../components/StreamList';
import Broadcaster from '../components/Broadcaster';
import ViewerPlayer from '../components/ViewerPlayer';
import ChatRoom from '../components/ChatRoom';
import FollowButton from '../components/FollowButton';
import { useAuth } from '../context/AuthContext';
import { useSocketAuth } from '../hooks/useSocketAuth';
import { socket } from '../services/socket';

export default function HomePage() {
  const { user, accessToken } = useAuth();
  const [selected, setSelected] = useState(null);
  const [notifications, setNotifications] = useState([]);
  useSocketAuth(user);

  useEffect(() => {
    const onNotify = (payload) => setNotifications((p) => [payload, ...p].slice(0, 6));
    socket.on('notify:followedLive', onNotify);
    return () => socket.off('notify:followedLive', onNotify);
  }, []);

  return (
    <div className="app-shell">
      <h1>XeyStream Live Studio</h1>

      <div>
        <AuthPanel />
        <Broadcaster token={accessToken} user={user} />
      </div>

      <div>
        <ViewerPlayer stream={selected} />
        {selected && user && <div className="panel"><FollowButton token={accessToken} streamerId={selected.streamer_id} /></div>}
        <div className="panel">
          <h4>Live Notifications</h4>
          {notifications.length === 0 && <p>No live alerts yet.</p>}
          {notifications.map((n, i) => <div key={i} className="list-item">{n.stream.streamer_id} is live: {n.stream.title}</div>)}
        </div>
      </div>

      <div>
        <StreamList onSelect={setSelected} />
        <ChatRoom stream={selected} user={user} />
      </div>
    </div>
  );
}
