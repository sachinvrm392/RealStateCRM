'use client';
import React from 'react';
import { Card, CardContent, Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip } from '@mui/material';

export interface AgentPerformanceData {
  agent_id: number;
  agent_name: string;
  total_leads: number;
  calls_made: number;
  conversions: number;
  deals_closed: number;
}

export default function AgentPerformance({ data }: { data: AgentPerformanceData[] }) {
  return (
    <Card elevation={2} sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          Agent Performance
        </Typography>
        <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 300 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell><strong>Agent</strong></TableCell>
                <TableCell align="center"><strong>Total Leads</strong></TableCell>
                <TableCell align="center"><strong>Calls Made</strong></TableCell>
                <TableCell align="center"><strong>Conversions</strong></TableCell>
                <TableCell align="center"><strong>Deals Closed</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(!data || data.length === 0) ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography color="text.secondary" py={2}>No agent performance data</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row) => (
                  <TableRow key={row.agent_id} hover>
                    <TableCell>{row.agent_name}</TableCell>
                    <TableCell align="center">
                      <Chip label={row.total_leads} size="small" color="primary" variant="outlined" />
                    </TableCell>
                    <TableCell align="center">{row.calls_made}</TableCell>
                    <TableCell align="center">
                      <Chip label={row.conversions} size="small" color="secondary" />
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={row.deals_closed} size="small" color="success" />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
}
