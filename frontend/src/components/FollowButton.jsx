import { useState } from 'react';
import { api } from '../services/api';

export default function FollowButton({ token, streamerId }) {
  const [count, setCount] = useState(null);
  return <div>
    <button onClick={async()=>{const d=await api(`/api/follows/${streamerId}`,{method:'POST',token});setCount(d.followerCount);}}>Follow</button>
    <button onClick={async()=>{const d=await api(`/api/follows/${streamerId}`,{method:'DELETE',token});setCount(d.followerCount);}}>Unfollow</button>
    {count !== null && <span> followers: {count}</span>}
  </div>;
}
