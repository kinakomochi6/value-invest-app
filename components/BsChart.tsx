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
      category: '資産 (Assets)',
      総資産: getNumber(data, '★資産合計'),
      negative_pad: 0,
    },
    {
      category: '負債・純資産 (Liabilities/NA)',
      総資産: 0,
      負債: getNumber(data, '★負債合計'),
      純資産: getNumber(data, '★純資産合計'),
    }
  ];

  return (
    <div style={{ width: '100%', height: 450 }} className="p-4 bg-white rounded border">
      <ResponsiveContainer>
        <BarChart 
          data={chartData} 
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          // ★修正箇所：固定のピクセル幅を削除し、割合（Gap）と上限（maxBarSize）で自動調整させます
          barCategoryGap="25%"
          maxBarSize={160} 
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
          <XAxis dataKey="category" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} unit=" 億円" width={60} />
          <Tooltip 
            cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} 
            formatter={(value) => [`${value} 億円`]} 
            contentStyle={{ borderRadius: '8px', border: '1px solid #ddd', padding: '10px' }}
          />
          <Legend wrapperStyle={{ paddingTop: '15px' }} />
          
          <Bar dataKey="総資産" stackId="a" fill="#3498db" radius={[4, 4, 0, 0]} name="総資産" />
          <Bar dataKey="負債" stackId="a" fill="#e74c3c" name="負債" />
          <Bar dataKey="純資産" stackId="a" fill="#2ecc71" radius={[4, 4, 0, 0]} name="純資産" />
          
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
