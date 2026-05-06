"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

type ChartLine = {
  key: string;
  label: string;
  color: string;
  dashArray?: string;
};

interface EarningsChartProps {
  data: Array<Record<string, number | string>>;
  lines: ChartLine[];
  title?: string;
  subtitle?: string;
}

export function EarningsChart({
  data,
  lines,
  title = "Hiệu suất cày Adena (Theo ngày)",
  subtitle
}: EarningsChartProps) {
  return (
    <div className="card dashboard-chart-card">
      <div style={{ marginBottom: "20px" }}>
        <h3 className="font-heading" style={{ marginBottom: subtitle ? "6px" : 0 }}>{title}</h3>
        {subtitle ? (
          <p className="text-muted" style={{ margin: 0, fontSize: "0.9rem" }}>{subtitle}</p>
        ) : null}
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, right: 18, left: 4, bottom: 12 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
          <XAxis
            dataKey="day"
            stroke="#9ca3af"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => {
              const d = new Date(String(value));
              return `${d.getDate()}/${d.getMonth() + 1}`;
            }}
          />
          <YAxis
            stroke="#9ca3af"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${(Number(value) / 1000000).toFixed(1)}M`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#111827",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "12px",
              color: "#fff"
            }}
            formatter={(value, name) => {
              const numericValue = typeof value === "number" ? value : Number(value ?? 0);
              const label = typeof name === "string" ? name : String(name);
              return [
                new Intl.NumberFormat("vi-VN").format(numericValue),
                lines.find((line) => line.key === label)?.label ?? label
              ];
            }}
            labelFormatter={(value) => {
              const d = new Date(String(value));
              return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
            }}
          />
          {lines.length > 1 ? (
            <Legend
              verticalAlign="top"
              height={40}
              wrapperStyle={{ fontSize: "12px", paddingBottom: "10px" }}
            />
          ) : null}
          {lines.map((line) => (
            <Line
              key={line.key}
              type="monotone"
              dataKey={line.key}
              name={line.label}
              stroke={line.color}
              strokeDasharray={line.dashArray}
              strokeWidth={3}
              dot={{ r: 3, strokeWidth: 0, fill: line.color }}
              activeDot={{ r: 5, fill: line.color, stroke: "#0f172a", strokeWidth: 2 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
