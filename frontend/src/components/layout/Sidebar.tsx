'use client';
import React from 'react';
import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Box, Typography, Divider } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import BusinessIcon from '@mui/icons-material/Business';
import MapIcon from '@mui/icons-material/Map';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import HistoryIcon from '@mui/icons-material/History';
import LockResetIcon from '@mui/icons-material/LockReset';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../lib/constants';

const drawerWidth = 240;

const Sidebar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, hasRole } = useAuth();

  if (!user) return null;

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard', roles: ['super_admin', 'manager', 'agent'] },
    { text: 'Leads', icon: <PeopleIcon />, path: '/leads', roles: ['super_admin', 'manager', 'agent'] },
    { text: 'Projects', icon: <BusinessIcon />, path: '/projects', roles: ['super_admin', 'manager'] },
    { text: 'Plots', icon: <MapIcon />, path: '/plots', roles: ['super_admin', 'manager'] },
    { text: 'Deals', icon: <AttachMoneyIcon />, path: '/deals', roles: ['super_admin', 'manager'] },
    { text: 'Reports', icon: <AssessmentIcon />, path: '/reports', roles: ['super_admin', 'manager'] },
    { text: 'Change Password', icon: <LockResetIcon />, path: '/change-password', roles: ['super_admin', 'manager', 'agent'] },
    { text: 'Users', icon: <SupervisorAccountIcon />, path: '/users', roles: ['super_admin'] },
    { text: 'Audit Log', icon: <HistoryIcon />, path: '/audit', roles: ['super_admin'] },
  ];

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' },
      }}
    >
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
          RealEstate CRM
        </Typography>
      </Box>
      <Divider />
      <List sx={{ flexGrow: 1 }}>
        {menuItems.filter(item => hasRole(item.roles)).map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={pathname.startsWith(item.path)}
              onClick={() => router.push(item.path)}
            >
              <ListItemIcon sx={{ color: pathname.startsWith(item.path) ? 'primary.main' : 'inherit' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                primaryTypographyProps={{ 
                  color: pathname.startsWith(item.path) ? 'primary.main' : 'inherit',
                  fontWeight: pathname.startsWith(item.path) ? 'bold' : 'normal'
                }} 
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{user.username}</Typography>
        <Typography variant="caption" color="text.secondary">{ROLES[user.role] || user.role}</Typography>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
