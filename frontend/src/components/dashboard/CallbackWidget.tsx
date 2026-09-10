'use client';
import React from 'react';
import { Card, CardContent, Typography, List, ListItem, ListItemText, ListItemAvatar, Avatar } from '@mui/material';
import PhoneIcon from '@mui/icons-material/Phone';
import { DashboardCallback } from '../../types';
import dayjs from 'dayjs';

const CallbackWidget: React.FC<{ data: DashboardCallback[] }> = ({ data }) => {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>Today's Callbacks</Typography>
        <List>
          {data.length === 0 ? (
            <Typography variant="body2" color="text.secondary">No callbacks scheduled for today.</Typography>
          ) : (
            data.map((cb) => (
              <ListItem key={cb.lead_id} button component="a" href={`/leads/${cb.lead_id}`}>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'secondary.main' }}>
                    <PhoneIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText 
                  primary={cb.name} 
                  secondary={`${cb.phone} - ${dayjs(cb.callback_at).format('hh:mm A')}`} 
                />
              </ListItem>
            ))
          )}
        </List>
      </CardContent>
    </Card>
  );
};

export default CallbackWidget;
