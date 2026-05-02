"use client";

import { useEffect, useState } from "react";
import { StatCard } from "@/components/dashboard/StatCard";
import { EarningsChart } from "@/components/dashboard/EarningsChart";
import { Leaderboard } from "@/components/dashboard/Leaderboard";
import { 
  Coins, 
  TrendingUp, 
  CreditCard, 
  Users, 
  ChevronRight 
} from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/calculations";
import Link from "next/link";

export default function PublicDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/dashboard");
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="shell" style={{ display: "grid", placeItems: "center", minHeight: "80vh" }}>
        <div className="text-accent" style={{ fontSize: "1.5rem", fontWeight: 700 }}>Đang tải dữ liệu...</div>
      </div>
    );
  }

  if (!data) return <div className="shell">Error loading data.</div>;

  return (
    <main className="shell">
      <header className="hero animate-fade-in">
        <div style={{ display: "inline-flex", padding: "6px 12px", background: "var(--accent-glow)", borderRadius: "99px", color: "var(--accent)", fontWeight: 700, fontSize: "0.8rem", marginBottom: "16px" }}>
          L2 ADENA SYSTEM
        </div>
        <h1>Thống kê & Bảng xếp hạng</h1>
        <p>Theo dõi hiệu suất cày Adena của các thành viên trong nhóm theo thời gian thực.</p>
        
        <div style={{ marginTop: "24px", display: "flex", justifyContent: "center", gap: "16px" }}>
          <Link href="/admin">
            <button>
              Quản lý hệ thống <ChevronRight size={18} />
            </button>
          </Link>
        </div>
      </header>

      <section className="stats-grid">
        <StatCard 
          label="Tổng Adena Kiếm Được" 
          value={formatNumber(data.totalStats.totalAdena)} 
          icon={Coins}
          meta="Tất cả thành viên"
        />
        <StatCard 
          label="Tổng Tiền Công" 
          value={formatCurrency(data.totalStats.totalGross)} 
          icon={TrendingUp}
          meta="Dựa trên rate hiện tại"
        />
        <StatCard 
          label="Đã Thanh Toán" 
          value={formatCurrency(data.totalStats.totalPaid)} 
          icon={CreditCard}
          meta={`Còn nợ: ${formatCurrency(data.totalStats.totalGross - data.totalStats.totalPaid)}`}
          trend="neutral"
        />
        <StatCard 
          label="Tổng Thành Viên" 
          value={data.summaries.length} 
          icon={Users}
          meta="Đang hoạt động"
        />
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "20px" }}>
        <section>
          <EarningsChart data={data.dailySeries} />
        </section>
        <section>
          <Leaderboard data={data.leaderboard} />
        </section>
      </div>

      <footer style={{ marginTop: "60px", textAlign: "center", borderTop: "1px solid var(--panel-border)", paddingTop: "20px" }}>
        <p className="text-muted" style={{ fontSize: "0.9rem" }}>
          &copy; 2026 Adena Management System. Build with Premium Aesthetics.
        </p>
      </footer>
    </main>
  );
}
