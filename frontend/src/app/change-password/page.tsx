'use client';
import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Stack,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
  Paper,
  Divider,
} from '@mui/material';
import LockResetIcon from '@mui/icons-material/LockReset';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import api from '../../lib/api';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../hooks/useAuth';

export default function ChangePasswordPage() {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('New password and confirm password do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/api/auth/change-password/', {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      setSuccessMsg(res.data?.detail || 'Password changed successfully!');
      enqueueSnackbar('Password changed successfully!', { variant: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to update password. Please check your current password.';
      setErrorMsg(msg);
      enqueueSnackbar(msg, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 650, mx: 'auto', pb: 5, pt: 1 }}>
      <Box mb={3}>
        <Stack direction="row" alignItems="center" spacing={1.5} mb={0.5}>
          <LockResetIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h4" fontWeight="bold">
            Change Password
          </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary">
          Update your account security password for {user?.username} ({user?.role?.toUpperCase()})
        </Typography>
      </Box>

      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
        }}
      >
        <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
          {errorMsg && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setErrorMsg('')}>
              {errorMsg}
            </Alert>
          )}

          {successMsg && (
            <Alert
              severity="success"
              icon={<CheckCircleOutlineIcon fontSize="inherit" />}
              sx={{ mb: 3 }}
              onClose={() => setSuccessMsg('')}
            >
              {successMsg}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={3}>
              <TextField
                fullWidth
                label="Current Password"
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <VpnKeyIcon color="action" fontSize="small" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle current password visibility"
                        onClick={() => setShowCurrent(!showCurrent)}
                        edge="end"
                      >
                        {showCurrent ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Divider sx={{ my: 0.5 }} />

              <TextField
                fullWidth
                label="New Password"
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                helperText="Must be at least 6 characters long"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <VpnKeyIcon color="action" fontSize="small" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle new password visibility"
                        onClick={() => setShowNew(!showNew)}
                        edge="end"
                      >
                        {showNew ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Confirm New Password"
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                error={Boolean(confirmPassword && newPassword !== confirmPassword)}
                helperText={
                  confirmPassword && newPassword !== confirmPassword ? 'Passwords do not match' : ''
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <VpnKeyIcon color="action" fontSize="small" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle confirm password visibility"
                        onClick={() => setShowConfirm(!showConfirm)}
                        edge="end"
                      >
                        {showConfirm ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                disabled={loading || !currentPassword || !newPassword || !confirmPassword}
                sx={{
                  py: 1.5,
                  fontWeight: 'bold',
                  textTransform: 'none',
                  fontSize: '1rem',
                  borderRadius: 2,
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Update Password'}
              </Button>
            </Stack>
          </Box>
        </CardContent>
      </Paper>
    </Box>
  );
}
