'use client';
import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  CircularProgress,
  Stack,
  IconButton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import api from '../../../lib/api';
import { useRouter } from 'next/navigation';
import { useSnackbar } from 'notistack';

export default function NewProjectPage() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: '',
    location: '',
    description: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name?.trim()) {
      enqueueSnackbar('Project / Society Name is required', { variant: 'error' });
      return;
    }
    if (!form.location?.trim()) {
      enqueueSnackbar('Location / Landmark / City is required', { variant: 'error' });
      return;
    }
    if (!form.description?.trim()) {
      enqueueSnackbar('Project Description is required', { variant: 'error' });
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/projects/', form);
      enqueueSnackbar('Project added successfully', { variant: 'success' });
      router.push('/projects');
    } catch (err: any) {
      const errorMsg = err.response?.data?.name?.[0] || err.response?.data?.detail || 'Failed to create project';
      enqueueSnackbar(errorMsg, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ pb: 5 }}>
      <Stack direction="row" alignItems="center" spacing={2} mb={3}>
        <IconButton onClick={() => router.push('/projects')}>
          <ArrowBackIcon />
        </IconButton>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Add New Real Estate Project
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Register a new township, society, layout, or residential development.
          </Typography>
        </Box>
      </Stack>

      <Card elevation={2} sx={{ maxWidth: 800 }}>
        <CardContent sx={{ p: 4 }}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Project / Society Name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Green Valley Enclave, Palm Meadows"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Location / Landmark / City"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Sector 82, Airport Road, Bangalore"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Project Description / Amenities"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  required
                  placeholder="Total 150 plots, gated community with 40ft wide roads, underground electricity, clubhouse, 24/7 security..."
                  helperText="Detailed project overview, master plan, and key amenities (Mandatory)"
                />
              </Grid>
            </Grid>

            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button variant="outlined" onClick={() => router.push('/projects')} disabled={loading}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                startIcon={<SaveIcon />}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Save Project'}
              </Button>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
