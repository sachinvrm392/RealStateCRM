import { useState, useEffect } from 'react';
import api from '../lib/api';
import { useAuth } from './useAuth';

export const useNotifications = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    const fetchCount = async () => {
      try {
        const res = await api.get('/api/notifications/unread-count/');
        setUnreadCount(res.data.count);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  return { unreadCount, setUnreadCount };
};
