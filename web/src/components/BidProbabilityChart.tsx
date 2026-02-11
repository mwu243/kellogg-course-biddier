import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface BidProbabilityChartProps {
    data: Array<{ bid: number; probability: number }>;
    safeBid: number;
    title?: string;
}

export function BidProbabilityChart({ data, safeBid, title = "Win Probability" }: BidProbabilityChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="h-64 flex items-center justify-center text-slate-400 border border-dashed border-slate-200 rounded-lg">
                Insufficient data for probability curve
            </div>
        );
    }

    return (
        <div className="w-full">
            <h4 className="text-sm font-semibold text-slate-700 mb-4">{title}</h4>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorProb" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis
                            dataKey="bid"
                            tick={{ fontSize: 12, fill: '#64748B' }}
                            axisLine={{ stroke: '#E2E8F0' }}
                            tickLine={false}
                            label={{ value: 'Bid Points', position: 'insideBottom', offset: -5, fontSize: 12, fill: '#64748B' }}
                        />
                        <YAxis
                            tick={{ fontSize: 12, fill: '#64748B' }}
                            axisLine={false}
                            tickLine={false}
                            domain={[0, 100]}
                            unit="%"
                        />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            formatter={(value: any) => [`${value}%`, 'Win Probability']}
                            labelFormatter={(label) => `${label} Points`}
                        />
                        <Area
                            type="monotone"
                            dataKey="probability"
                            stroke="#4F46E5"
                            fillOpacity={1}
                            fill="url(#colorProb)"
                        />
                        {/* Safe Bid Line */}
                        <ReferenceLine x={safeBid} stroke="#10B981" strokeDasharray="3 3" label={{ position: 'top', value: 'Safe Bid', fill: '#10B981', fontSize: 12 }} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
            <div className="mt-2 text-xs text-slate-500 text-center">
                Higher bid = Higher probability. Curve shows estimated chance to win.
            </div>
        </div>
    );
}
