"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { StockRecord } from "@/lib/types";

const getNumber = (data: StockRecord, key: string) => {
  const value = data[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
};

export default function BsChart({ data }: { data: StockRecord }) {
  const chartData = [
    {
      category: '資産',
      総資産: getNumber(data, '★資産合計'),
      negative_pad: 0,
    },
    {
      category: '負債・純資産',
      総資産: 0,
      負債: getNumber(data, '★負債合計'),
      純資産: getNumber(data, '★純資産合計'),
    }
  ];

  return (
    <div className="h-[320px] min-w-0 w-full md:h-[420px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={chartData} 
          margin={{ top: 16, right: 12, left: 4, bottom: 12 }}
          barCategoryGap="30%"
          maxBarSize={150}
        >
          <CartesianGrid strokeDasharray="3 4" vertical={false} stroke="#e1e2e8" />
          <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#44474f' }} axisLine={{ stroke: '#c4c6d0' }} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#44474f' }} unit=" 億" width={54} axisLine={false} tickLine={false} />
          <Tooltip 
            cursor={{ fill: 'rgba(0, 90, 193, 0.07)' }}
            formatter={(value) => [`${value} 億円`]}
            contentStyle={{ borderRadius: '8px', border: '1px solid #c4c6d0', padding: '10px', boxShadow: '0 5px 18px rgba(18, 27, 45, 0.12)' }}
          />
          <Legend wrapperStyle={{ paddingTop: '12px', fontSize: '11px' }} />
          
          <Bar dataKey="総資産" stackId="a" fill="#005ac1" radius={[8, 8, 0, 0]} name="総資産" />
          <Bar dataKey="負債" stackId="a" fill="#ba1a1a" name="負債" />
          <Bar dataKey="純資産" stackId="a" fill="#006874" radius={[8, 8, 0, 0]} name="純資産" />
          
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
