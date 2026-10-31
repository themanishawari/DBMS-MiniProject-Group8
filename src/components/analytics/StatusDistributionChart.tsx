import React from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

interface StatusDistributionChartProps {
  data: { name: string; count: number }[];
}

const PIE_COLORS = [
  '#f59e0b', // Submitted
  '#0284c7', // Acknowledged
  '#6366f1', // Assigned
  '#3b82f6', // In Progress
  '#8b5cf6', // Awaiting
  '#f43f5e', // Escalated
  '#10b981', // Resolved
  '#64748b', // Closed
  '#ea580c', // Reopened
  '#ef4444', // Rejected
];

export const StatusDistributionChart: React.FC<StatusDistributionChartProps> = ({ data }) => {
  return (
    <div className="h-72 w-full flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={3}
            dataKey="count"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              borderRadius: '8px',
              border: 'none',
              color: '#fff',
              fontSize: '12px',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
