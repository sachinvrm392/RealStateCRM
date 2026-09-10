'use client';
import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface TemperatureData {
  temperature: string;
  count: number;
}

const TEMP_COLORS: Record<string, string> = {
  hot: '#f44336',
  warm: '#ff9800',
  cold: '#2196f3',
  unqualified: '#9e9e9e',
};

export default function TemperatureChart({ data }: { data: TemperatureData[] }) {
  const chartData = (data || []).map((item) => ({
    name: (item.temperature || 'unqualified').toUpperCase(),
    value: item.count,
    color: TEMP_COLORS[item.temperature?.toLowerCase()] || '#757575',
  }));

  return (
    <Card elevation={2} sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          Lead Temperature Distribution
        </Typography>
        <Box height={280}>
          {chartData.length === 0 ? (
            <Box display="flex" alignItems="center" justifyContent="center" height="100%">
              <Typography color="text.secondary">No temperature data available</Typography>
            </Box>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
