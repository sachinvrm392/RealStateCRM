'use client';
import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export interface PlotSummaryItem {
  project__name: string;
  status: string;
  count: number;
}

export default function PlotSummary({ data }: { data: PlotSummaryItem[] }) {
  // Aggregate data by project
  const projectMap: Record<string, { name: string; available: number; reserved: number; sold: number }> = {};

  (data || []).forEach((item) => {
    const proj = item.project__name || 'General';
    if (!projectMap[proj]) {
      projectMap[proj] = { name: proj, available: 0, reserved: 0, sold: 0 };
    }
    if (item.status === 'available') projectMap[proj].available += item.count;
    else if (item.status === 'reserved') projectMap[proj].reserved += item.count;
    else if (item.status === 'sold') projectMap[proj].sold += item.count;
  });

  const chartData = Object.values(projectMap);

  return (
    <Card elevation={2} sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          Plot Inventory Overview
        </Typography>
        <Box height={280}>
          {chartData.length === 0 ? (
            <Box display="flex" alignItems="center" justifyContent="center" height="100%">
              <Typography color="text.secondary">No plot inventory data</Typography>
            </Box>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="available" name="Available" fill="#4caf50" stackId="a" />
                <Bar dataKey="reserved" name="Reserved / Booked" fill="#ff9800" stackId="a" />
                <Bar dataKey="sold" name="Sold" fill="#2196f3" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
