import { formatNumber } from "@/lib/calculations";
import { UserSummary } from "@/lib/types";

interface LeaderboardProps {
  data: (UserSummary & { progressPercent: number })[];
}

export function Leaderboard({ data }: LeaderboardProps) {
  return (
    <div className="card">
      <h3 className="font-heading" style={{ marginBottom: "20px" }}>Bảng xếp hạng cày Adena</h3>
      <div className="list-container">
        {data.map((item, index) => (
          <div key={item.userId} className="list-item animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
            <div className="rank-badge">{index + 1}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ fontWeight: 700 }}>{item.name}</span>
              <span className="text-muted" style={{ fontSize: "0.8rem" }}>{item.team}</span>
              
              <div style={{ width: "100%", height: "4px", background: "rgba(255,255,255,0.1)", borderRadius: "2px", marginTop: "4px" }}>
                <div 
                  style={{ 
                    height: "100%", 
                    width: `${item.progressPercent}%`, 
                    background: "var(--accent)",
                    borderRadius: "2px",
                    boxShadow: "0 0 10px var(--accent-glow)"
                  }} 
                />
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontWeight: 800, color: "var(--accent)" }}>{formatNumber(item.totalAdena)}</div>
              <div className="text-muted" style={{ fontSize: "0.75rem" }}>Adena</div>
            </div>
          </div>
        ))}
        {data.length === 0 && (
          <div className="text-muted" style={{ textAlign: "center", padding: "40px" }}>
            Chưa có dữ liệu xếp hạng.
          </div>
        )}
      </div>
    </div>
  );
}
