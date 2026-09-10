'use client';
import React from 'react';
import { Card, CardContent, Typography, List, ListItem, ListItemAvatar, Avatar, ListItemText, Box, Divider } from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import PhoneInTalkIcon from '@mui/icons-material/PhoneInTalk';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export interface ActivityItem {
  action: string;
  entity_type: string;
  description: string;
  created_at: string;
}

const getActionIcon = (action: string) => {
  switch (action) {
    case 'status_change':
      return <HistoryIcon color="info" />;
    case 'assignment':
      return <AssignmentIndIcon color="primary" />;
    case 'create':
    case 'deal_update':
      return <MonetizationOnIcon color="success" />;
    default:
      return <PhoneInTalkIcon color="action" />;
  }
};

export default function ActivityFeed({ data }: { data: ActivityItem[] }) {
  return (
    <Card elevation={2} sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          Recent Activity
        </Typography>
        <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
          {(!data || data.length === 0) ? (
            <Typography color="text.secondary" py={3} textAlign="center">
              No recent activity recorded
            </Typography>
          ) : (
            <List disablePadding>
              {data.map((item, index) => (
                <React.Fragment key={index}>
                  <ListItem alignItems="flex-start" sx={{ px: 1, py: 1 }}>
                    <ListItemAvatar sx={{ minWidth: 40 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: 'action.hover' }}>
                        {getActionIcon(item.action)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={<Typography variant="body2" fontWeight={500}>{item.description}</Typography>}
                      secondary={
                        <Typography variant="caption" color="text.secondary">
                          {item.entity_type} • {dayjs(item.created_at).fromNow()}
                        </Typography>
                      }
                    />
                  </ListItem>
                  {index < data.length - 1 && <Divider variant="inset" component="li" />}
                </React.Fragment>
              ))}
            </List>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
