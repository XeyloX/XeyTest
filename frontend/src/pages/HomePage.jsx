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
    const onNotify = (payload) => setNotifications((p) => [payload, ...p].slice(0, 5));
    socket.on('notify:followedLive', onNotify);
    return () => socket.off('notify:followedLive', onNotify);
  }, []);

  return <div>
    <h1>XeyStream</h1>
    <AuthPanel />
    <Broadcaster token={accessToken} user={user} />
    <StreamList onSelect={setSelected} />
    <ViewerPlayer stream={selected} />
    {selected && user && <FollowButton token={accessToken} streamerId={selected.streamer_id} />}
    <ChatRoom stream={selected} user={user} />
    <h4>Notifications</h4>
    {notifications.map((n,i)=><div key={i}>{n.stream.streamer_id} is live: {n.stream.title}</div>)}
  </div>;
}
