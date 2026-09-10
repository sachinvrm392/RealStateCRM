'use client';
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Stack,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Divider,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';

export default function ImportPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState('');

  const handleDownloadTemplate = () => {
    const csvContent =
      'full_name,phone_primary,phone_alternate,email,whatsapp_number,source,city,budget_range,plot_size_preference,notes\n' +
      'John Doe,+919876543210,,john@example.com,+919876543210,facebook,Mumbai,35L-50L,1200 sqft,Looking for residential plot\n' +
      'Jane Smith,+919123456789,+919888877777,jane@test.com,,whatsapp,Pune,60L-80L,2000 sqft,Urgent buyer for corner plot';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sample_leads_template.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/api/leads/import_csv/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to import CSV. Please verify file format.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ pb: 5 }}>
      <Stack direction="row" alignItems="center" spacing={2} mb={3}>
        <IconButton onClick={() => router.push('/leads')}>
          <ArrowBackIcon />
        </IconButton>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Bulk Lead Import (CSV)
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Upload CSV spreadsheets from offline campaigns or Meta/WhatsApp export files
          </Typography>
        </Box>
      </Stack>

      <GridWrapper>
        <Card elevation={2} sx={{ mb: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight="bold">
                Step 1: Download Sample CSV Template
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<FileDownloadIcon />}
                onClick={handleDownloadTemplate}
              >
                Download CSV Template
              </Button>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Ensure column headers match: <code>full_name</code>, <code>phone_primary</code>, <code>source</code>, <code>city</code>, <code>budget_range</code>, <code>plot_size_preference</code>, <code>notes</code>.
            </Typography>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Step 2: Select & Upload File
            </Typography>

            <Box
              sx={{
                border: '2px dashed #90caf9',
                bgcolor: '#f5f9ff',
                p: 4,
                borderRadius: 2,
                textAlign: 'center',
                my: 2,
              }}
            >
              <CloudUploadIcon sx={{ fontSize: 54, color: 'primary.main', mb: 1 }} />
              <Typography variant="h6" gutterBottom>
                {file ? file.name : 'Choose a .csv file to upload'}
              </Typography>
              {file && (
                <Typography variant="caption" display="block" color="text.secondary" mb={2}>
                  Size: {(file.size / 1024).toFixed(1)} KB
                </Typography>
              )}

              <Button variant="contained" component="label" sx={{ mr: 2 }}>
                Browse Files
                <input
                  type="file"
                  hidden
                  accept=".csv"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setFile(e.target.files[0]);
                    }
                  }}
                />
              </Button>

              <Button
                variant="contained"
                color="success"
                onClick={handleUpload}
                disabled={!file || loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Start Import'}
              </Button>
            </Box>

            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          </CardContent>
        </Card>

        {/* Results summary */}
        {result && (
          <Card elevation={2}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Import Results Summary
              </Typography>

              <Stack direction="row" spacing={2} my={2}>
                <Chip
                  icon={<CheckCircleIcon />}
                  label={`${result.created_count || 0} Leads Created (Auto-assigned)`}
                  color="success"
                />
                <Chip
                  icon={<WarningAmberIcon />}
                  label={`${result.duplicate_count || 0} Duplicates Skipped`}
                  color="warning"
                />
                {result.error_count > 0 && (
                  <Chip
                    icon={<ErrorOutlineIcon />}
                    label={`${result.error_count} Errors`}
                    color="error"
                  />
                )}
              </Stack>

              {result.duplicates && result.duplicates.length > 0 && (
                <Box mt={3}>
                  <Typography variant="subtitle2" fontWeight="bold" color="warning.dark" gutterBottom>
                    Duplicate Records (Skipped automatically to prevent overwrite):
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Row</TableCell>
                          <TableCell>Phone Number</TableCell>
                          <TableCell>Existing Matched Leads</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {result.duplicates.map((d: any, i: number) => (
                          <TableRow key={i}>
                            <TableCell>Row {d.row}</TableCell>
                            <TableCell>{d.phone}</TableCell>
                            <TableCell>
                              {d.existing_leads?.map((ex: any) => (
                                <span key={ex.id}>
                                  #{ex.id} {ex.full_name} ({ex.status})
                                </span>
                              ))}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              <Box mt={3}>
                <Button variant="contained" onClick={() => router.push('/leads')}>
                  Go to Leads Listing
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}
      </GridWrapper>
    </Box>
  );
}

function GridWrapper({ children }: { children: React.ReactNode }) {
  return <Box sx={{ maxWidth: 850, mx: 'auto' }}>{children}</Box>;
}
