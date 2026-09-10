'use client';
import React, { useState } from 'react';
import { Badge, IconButton, Popover, List, ListItem, ListItemText, Typography, Box, Button } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useNotifications } from '../../hooks/useNotifications';
import api from '../../lib/api';
import { Notification } from '../../types';

const NotificationBell = () => {
  const { unreadCount, setUnreadCount } = useNotifications();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/api/notifications/');
      setNotifications(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
    fetchNotifications();
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMarkAsRead = async (id: string | number) => {
    try {
      await api.patch(`/api/notifications/${id}/read/`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleReadAll = async () => {
    try {
      await api.post('/api/notifications/read-all/');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <IconButton color="inherit" onClick={handleClick}>
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ sx: { width: 350, maxHeight: 400 } }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6">Notifications</Typography>
          <Button size="small" onClick={handleReadAll}>Mark all as read</Button>
        </Box>
        <List sx={{ p: 0 }}>
          {notifications.length === 0 ? (
            <ListItem><ListItemText primary="No notifications" /></ListItem>
          ) : (
            notifications.map(notification => (
              <ListItem 
                key={notification.id} 
                button 
                onClick={() => handleMarkAsRead(notification.id)}
                sx={{ bgcolor: notification.is_read ? 'transparent' : 'action.hover' }}
              >
                <ListItemText 
                  primary={notification.message} 
                  secondary={new Date(notification.created_at).toLocaleString()}
                  primaryTypographyProps={{ variant: 'body2', fontWeight: notification.is_read ? 'normal' : 'bold' }}
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
              </ListItem>
            ))
          )}
        </List>
      </Popover>
    </>
  );
};

export default NotificationBell;
