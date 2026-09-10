'use client';
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Box,
  Typography,
  Stack,
  Alert,
  CircularProgress,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import api from '../../lib/api';

interface CallLogFormProps {
  open: boolean;
  leadId: string | number;
  leadName: string;
  onClose: () => void;
  onSuccess: () => void;
}

const OUTCOMES = [
  { value: 'connected', label: 'Connected' },
  { value: 'callback_scheduled', label: 'Callback Scheduled' },
  { value: 'no_answer', label: 'No Answer' },
  { value: 'busy', label: 'Busy' },
  { value: 'switched_off', label: 'Switched Off' },
  { value: 'wrong_number', label: 'Wrong Number' },
  { value: 'not_interested', label: 'Not Interested' },
];

export default function CallLogForm({
  open,
  leadId,
  leadName,
  onClose,
  onSuccess,
}: CallLogFormProps) {
  const [outcome, setOutcome] = useState('connected');
  const [notes, setNotes] = useState('');
  const [callbackTime, setCallbackTime] = useState('');
  const [recordingFile, setRecordingFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('outcome', outcome);
      formData.append('notes', notes);
      if (outcome === 'callback_scheduled' && callbackTime) {
        formData.append('callback_scheduled_at', callbackTime);
      }
      if (recordingFile) {
        formData.append('recording_file', recordingFile);
      }

      await api.post(`/api/leads/${leadId}/calls/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.response?.data?.detail || 'Failed to log call attempt');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Log Call Attempt: {leadName}</DialogTitle>
        <DialogContent dividers>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <FormControl component="fieldset" fullWidth sx={{ mb: 2 }}>
            <FormLabel component="legend" sx={{ fontWeight: 'bold', mb: 1 }}>Call Outcome</FormLabel>
            <RadioGroup
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              row
            >
              {OUTCOMES.map((opt) => (
                <FormControlLabel
                  key={opt.value}
                  value={opt.value}
                  control={<Radio size="small" />}
                  label={opt.label}
                  sx={{ width: '48%', m: 0 }}
                />
              ))}
            </RadioGroup>
          </FormControl>

          {outcome === 'callback_scheduled' && (
            <TextField
              type="datetime-local"
              label="Next Callback Date & Time"
              value={callbackTime}
              onChange={(e) => setCallbackTime(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2 }}
              required
            />
          )}

          <TextField
            label="Call Notes / Summary"
            multiline
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            fullWidth
            placeholder="Key discussion points, objections, plot interest..."
            sx={{ mb: 2 }}
          />

          <Box sx={{ border: '1px dashed #ccc', p: 2, borderRadius: 1, textAlign: 'center' }}>
            <input
              type="file"
              accept="audio/*,.mp3,.wav,.m4a"
              style={{ display: 'none' }}
              id="call-recording-upload"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setRecordingFile(e.target.files[0]);
                }
              }}
            />
            <label htmlFor="call-recording-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<CloudUploadIcon />}
                size="small"
              >
                {recordingFile ? 'Change Recording Audio' : 'Upload Call Recording (Optional)'}
              </Button>
            </label>
            {recordingFile && (
              <Typography variant="caption" display="block" mt={1} color="primary">
                Selected: {recordingFile.name} ({(recordingFile.size / 1024 / 1024).toFixed(2)} MB)
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" color="primary" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Save Call Log'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
