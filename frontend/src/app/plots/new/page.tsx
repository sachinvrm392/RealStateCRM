'use client';
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  Stack,
  IconButton,
  CircularProgress,
  Divider,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import api from '../../../lib/api';
import { useRouter } from 'next/navigation';
import { useSnackbar } from 'notistack';
import { Project } from '../../../types';

export default function NewPlotPage() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    project: '',
    plot_number: '',
    block_sector: '',
    area_sqft: '',
    plot_type: 'residential',
    facing: 'east',
    price_per_sqft: '',
    total_price: '',
    status: 'available',
    dimensions: '',
    floor_level: '',
    amenities: '',
  });

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await api.get('/api/projects/');
        setProjects(res.data);
      } catch (err) {
        console.error('Failed to load projects', err);
      }
    };
    fetchProjects();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const nextForm = { ...formData, [name]: value };

    // Auto calculate total price if area and price_per_sqft are entered
    if (name === 'area_sqft' || name === 'price_per_sqft') {
      const area = Number(name === 'area_sqft' ? value : formData.area_sqft);
      const rate = Number(name === 'price_per_sqft' ? value : formData.price_per_sqft);
      if (area > 0 && rate > 0) {
        nextForm.total_price = (area * rate).toString();
      }
    }

    setFormData(nextForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.project) {
      enqueueSnackbar('Please select a Project / Society', { variant: 'error' });
      return;
    }
    if (!formData.plot_number?.trim()) {
      enqueueSnackbar('Plot / Unit Number is required', { variant: 'error' });
      return;
    }
    if (!formData.block_sector?.trim()) {
      enqueueSnackbar('Block / Sector / Phase is required', { variant: 'error' });
      return;
    }
    if (!formData.plot_type) {
      enqueueSnackbar('Plot Type is required', { variant: 'error' });
      return;
    }
    if (!formData.area_sqft || Number(formData.area_sqft) <= 0) {
      enqueueSnackbar('Valid Area (Sq. Ft.) is required', { variant: 'error' });
      return;
    }
    if (!formData.price_per_sqft || Number(formData.price_per_sqft) <= 0) {
      enqueueSnackbar('Valid Rate (₹ / Sq. Ft.) is required', { variant: 'error' });
      return;
    }
    if (!formData.total_price || Number(formData.total_price) <= 0) {
      enqueueSnackbar('Valid Total Price (₹) is required', { variant: 'error' });
      return;
    }
    if (!formData.facing) {
      enqueueSnackbar('Facing Direction is required', { variant: 'error' });
      return;
    }
    if (!formData.dimensions?.trim()) {
      enqueueSnackbar('Dimensions (L x W) are required', { variant: 'error' });
      return;
    }
    if (!formData.status) {
      enqueueSnackbar('Inventory Status is required', { variant: 'error' });
      return;
    }
    if (!formData.amenities?.trim()) {
      enqueueSnackbar('Nearby Amenities / Highlights are required', { variant: 'error' });
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/plots/', formData);
      enqueueSnackbar('Plot added to inventory successfully', { variant: 'success' });
      router.push('/plots');
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.non_field_errors?.[0] ||
        err?.response?.data?.plot_number?.[0] ||
        err?.response?.data?.detail ||
        'Failed to create plot';
      enqueueSnackbar(errorMsg, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ pb: 5 }}>
      <Stack direction="row" alignItems="center" spacing={2} mb={3}>
        <IconButton onClick={() => router.push('/plots')}>
          <ArrowBackIcon />
        </IconButton>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Add Plot to Inventory
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Register new plot, land unit, or commercial space (All fields mandatory)
          </Typography>
        </Box>
      </Stack>

      <Card elevation={2} sx={{ maxWidth: 850, mx: 'auto' }}>
        <CardContent sx={{ p: 4 }}>
          <form onSubmit={handleSubmit}>
            <Typography variant="h6" fontWeight="bold" gutterBottom color="primary">
              1. Location & Identity
            </Typography>
            <Grid container spacing={2.5} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Project / Society"
                  name="project"
                  value={formData.project}
                  onChange={handleChange}
                  required
                >
                  <MenuItem value="" disabled>
                    -- Select Project (Required) --
                  </MenuItem>
                  {projects.map((proj) => (
                    <MenuItem key={proj.id} value={proj.id}>
                      {proj.name} ({proj.location || 'General'})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Plot / Unit Number"
                  name="plot_number"
                  value={formData.plot_number}
                  onChange={handleChange}
                  placeholder="e.g. A-104, Plot 42"
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Block / Sector / Phase"
                  name="block_sector"
                  value={formData.block_sector}
                  onChange={handleChange}
                  placeholder="e.g. Phase 2, Sector B"
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Plot Type"
                  name="plot_type"
                  value={formData.plot_type}
                  onChange={handleChange}
                  required
                >
                  <MenuItem value="residential">Residential</MenuItem>
                  <MenuItem value="commercial">Commercial</MenuItem>
                  <MenuItem value="mixed">Mixed / Semi-Commercial</MenuItem>
                </TextField>
              </Grid>
            </Grid>

            <Typography variant="h6" fontWeight="bold" gutterBottom color="primary">
              2. Dimensions & Pricing
            </Typography>
            <Grid container spacing={2.5} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Area (Sq. Ft.)"
                  name="area_sqft"
                  value={formData.area_sqft}
                  onChange={handleChange}
                  required
                  placeholder="e.g. 1500"
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Rate (₹ / Sq. Ft.)"
                  name="price_per_sqft"
                  value={formData.price_per_sqft}
                  onChange={handleChange}
                  required
                  placeholder="e.g. 3500"
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Total Price (₹)"
                  name="total_price"
                  value={formData.total_price}
                  onChange={handleChange}
                  required
                  placeholder="e.g. 5250000"
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  select
                  label="Facing Direction"
                  name="facing"
                  value={formData.facing}
                  onChange={handleChange}
                  required
                >
                  <MenuItem value="east">East</MenuItem>
                  <MenuItem value="west">West</MenuItem>
                  <MenuItem value="north">North</MenuItem>
                  <MenuItem value="south">South</MenuItem>
                  <MenuItem value="corner">Corner Facing</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Dimensions (L x W)"
                  name="dimensions"
                  value={formData.dimensions}
                  onChange={handleChange}
                  placeholder="e.g. 30 x 50"
                  required
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  select
                  label="Inventory Status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                >
                  <MenuItem value="available">Available</MenuItem>
                  <MenuItem value="reserved">Reserved</MenuItem>
                  <MenuItem value="sold">Sold</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Nearby Amenities / Highlights"
                  name="amenities"
                  value={formData.amenities}
                  onChange={handleChange}
                  placeholder="Park-facing, 40ft wide road, near clubhouse, gated security..."
                  required
                  helperText="Key features and plot highlights (Mandatory)"
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button variant="outlined" onClick={() => router.push('/plots')} disabled={loading}>
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
                {loading ? <CircularProgress size={24} /> : 'Save Plot to Inventory'}
              </Button>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
