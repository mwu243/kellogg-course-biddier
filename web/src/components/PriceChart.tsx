"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CourseStats } from '@/types/data';

interface PriceChartProps {
    data: CourseStats['history'];
    showAllPhases?: boolean;
}

export function PriceChart({ data, showAllPhases = true }: PriceChartProps) {
    if (!data || data.length === 0) {
        return <div className="h-64 flex items-center justify-center text-slate-400">No historical data available</div>;
    }

    // Check if we have Phase 3/4 data
    const hasPhase3 = data.some(d => d.priceR3 && d.priceR3 > 0);
    const hasPhase4 = data.some(d => d.priceR4 && d.priceR4 > 0);

    return (
        <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart
                    data={data}
                    margin={{
                        top: 5,
                        right: 10,
                        left: -20,
                        bottom: 5,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis
                        dataKey="term"
                        tick={{ fontSize: 11, fill: '#64748B' }}
                        axisLine={{ stroke: '#E2E8F0' }}
                        tickLine={false}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                    />
                    <YAxis
                        tick={{ fontSize: 12, fill: '#64748B' }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value) => [`${value} pts`]}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Line
                        type="monotone"
                        dataKey="priceR1"
                        name="Phase 1"
                        stroke="#4F46E5"
                        strokeWidth={2}
                        dot={{ r: 3, fill: '#4F46E5', strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 5 }}
                        connectNulls
                    />
                    <Line
                        type="monotone"
                        dataKey="priceR2"
                        name="Phase 2"
                        stroke="#10B981"
                        strokeWidth={2}
                        dot={{ r: 3, fill: '#10B981', strokeWidth: 2, stroke: '#fff' }}
                        connectNulls
                    />
                    {showAllPhases && hasPhase3 && (
                        <Line
                            type="monotone"
                            dataKey="priceR3"
                            name="Phase 3"
                            stroke="#F59E0B"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            dot={{ r: 3, fill: '#F59E0B', strokeWidth: 2, stroke: '#fff' }}
                            connectNulls
                        />
                    )}
                    {showAllPhases && hasPhase4 && (
                        <Line
                            type="monotone"
                            dataKey="priceR4"
                            name="PWYB"
                            stroke="#EF4444"
                            strokeWidth={2}
                            strokeDasharray="3 3"
                            dot={{ r: 3, fill: '#EF4444', strokeWidth: 2, stroke: '#fff' }}
                            connectNulls
                        />
                    )}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
