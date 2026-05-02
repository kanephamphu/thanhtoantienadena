import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  meta?: string;
  icon?: LucideIcon;
  trend?: "up" | "down" | "neutral";
}

export function StatCard({ label, value, meta, icon: Icon, trend }: StatCardProps) {
  return (
    <div className="card stat-card animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span className="stat-label">{label}</span>
        {Icon && <Icon className="text-muted" size={20} />}
      </div>
      <div className="stat-value">{value}</div>
      {meta && (
        <div className={`stat-meta ${trend === "down" ? "text-danger" : "text-success"}`}>
          {meta}
        </div>
      )}
    </div>
  );
}
