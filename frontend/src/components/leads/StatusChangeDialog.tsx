'use client';
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
  Typography,
  Box,
  CircularProgress,
  Chip,
  Alert,
} from '@mui/material';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import CommentIcon from '@mui/icons-material/Comment';
import EventIcon from '@mui/icons-material/Event';
import StatusBadge from '../common/StatusBadge';
import { STATUS_LABELS } from '../../lib/constants';

interface StatusChangeDialogProps {
  open: boolean;
  leadName: string;
  currentStatus: string;
  newStatus: string;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (data: { status: string; comments: string; callbackDate?: string }) => void;
}

export default function StatusChangeDialog({
  open,
  leadName,
  currentStatus,
  newStatus,
  loading = false,
  onClose,
  onConfirm,
}: StatusChangeDialogProps) {
  const [comments, setComments] = useState('');
  const [callbackDate, setCallbackDate] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setComments('');
      setCallbackDate('');
      setError('');
    }
  }, [open, newStatus]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comments.trim()) {
      setError('Please provide comments / reason for changing the lead status.');
      return;
    }
    setError('');
    onConfirm({
      status: newStatus,
      comments: comments.trim(),
      callbackDate: callbackDate || undefined,
    });
  };

  const newStatusLabel = STATUS_LABELS[newStatus] || newStatus.replace(/_/g, ' ');

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
          <SwapHorizIcon color="primary" /> Update Stage & Add Communication Log
        </DialogTitle>

        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ p: 2, mb: 2.5, bgcolor: 'grey.50', borderRadius: 2, border: '1px solid #e2e8f0' }}>
            <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
              LEAD / CUSTOMER
            </Typography>
            <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
              {leadName}
            </Typography>

            <Stack direction="row" spacing={1.5} alignItems="center" mt={1.5}>
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">
                  Current Stage:
                </Typography>
                <StatusBadge status={currentStatus} type="lead" />
              </Box>

              <Typography variant="body1" color="text.secondary" fontWeight="bold">
                ➔
              </Typography>

              <Box>
                <Typography variant="caption" color="text.secondary" display="block">
                  Moving To:
                </Typography>
                <StatusBadge status={newStatus} type="lead" />
              </Box>
            </Stack>
          </Box>

          <Stack spacing={2.5}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Comments / Description for Communication Log *"
              placeholder="e.g. Spoke with customer regarding plot visit, client confirmed meeting on Sunday at 11 AM..."
              value={comments}
              onChange={(e) => {
                setComments(e.target.value);
                if (error) setError('');
              }}
              required
              helperText="This comment will be permanently recorded in the lead's Communication Log."
              InputProps={{
                startAdornment: (
                  <CommentIcon color="action" fontSize="small" sx={{ mr: 1, mt: 1, alignSelf: 'flex-start' }} />
                ),
              }}
            />

            <TextField
              fullWidth
              type="datetime-local"
              label="Next Follow-up / Callback Reminder (Optional)"
              value={callbackDate}
              onChange={(e) => setCallbackDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              helperText="Set an automated reminder for your next follow-up with this lead"
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color={newStatus === 'lost' ? 'error' : newStatus === 'deal_confirmed' ? 'success' : 'primary'}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : `Confirm & Move to ${newStatusLabel}`}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
