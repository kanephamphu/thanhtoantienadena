"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  LogOut, 
  Coins, 
  CreditCard, 
  Clock,
  LayoutDashboard
} from "lucide-react";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/calculations";
import Link from "next/link";
import { StatCard } from "@/components/dashboard/StatCard";

export default function UserDashboard() {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const userStr = localStorage.getItem("adena_user");
    if (!userStr) {
      router.push("/login");
      return;
    }
    const loggedUser = JSON.parse(userStr);
    setUser(loggedUser);
    fetchUserData(loggedUser.id);
  }, []);

  async function fetchUserData(userId: string) {
    try {
      const res = await fetch(`/api/user/sessions?userId=${userId}`);
      const data = await res.json();
      setUserData(data);
    } finally {
      setLoading(false);
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("adena_user");
    router.push("/login");
  };

  if (loading) return <div className="shell">Đang tải...</div>;
  if (!userData) return <div className="shell">Lỗi tải dữ liệu.</div>;

  const totalAdena = userData.sessions.reduce((sum: number, s: any) => sum + (s.endAdena - s.startAdena), 0);
  const totalGross = userData.sessions.reduce((sum: number, s: any) => sum + ((s.endAdena - s.startAdena) / s.adenaUnit * s.adenaRate + (new Date(s.endAt).getTime() - new Date(s.startAt).getTime()) / 3600000 * s.hourlyRate), 0);
  const totalPaid = userData.payments.reduce((sum: number, p: any) => sum + p.amount, 0);

  return (
    <main className="shell">
      <header className="hero compact animate-fade-in" style={{ textAlign: "left", marginBottom: "40px" }}>
        <div>
          <h1 style={{ fontSize: "2.5rem", margin: 0 }}>Chào, {userData.name}</h1>
          <p>Xem lại lịch sử cày Adena và tình trạng thanh toán cá nhân.</p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <Link href="/">
            <button className="secondary"><LayoutDashboard size={18} /> Public View</button>
          </Link>
          <button onClick={handleLogout} className="secondary" style={{ color: "var(--danger)" }}>
            <LogOut size={18} /> Đăng xuất
          </button>
        </div>
      </header>

      <section className="stats-grid">
        <StatCard 
          label="Tổng Adena" 
          value={formatNumber(totalAdena)} 
          icon={Coins}
          meta="Đã cày được"
        />
        <StatCard 
          label="Tổng Tiền Công" 
          value={formatCurrency(totalGross)} 
          icon={Clock}
          meta="Tạm tính"
        />
        <StatCard 
          label="Đã Thanh Toán" 
          value={formatCurrency(totalPaid)} 
          icon={CreditCard}
          meta={`Còn lại: ${formatCurrency(totalGross - totalPaid)}`}
          trend={totalGross > totalPaid ? "neutral" : "up"}
        />
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        <div className="card">
          <h3 className="font-heading">Lịch sử ca cày</h3>
          <div style={{ marginTop: "20px", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr className="text-muted" style={{ textAlign: "left", fontSize: "0.85rem" }}>
                  <th style={{ padding: "12px" }}>Bắt đầu</th>
                  <th style={{ padding: "12px" }}>Adena</th>
                  <th style={{ padding: "12px" }}>Tiền công</th>
                </tr>
              </thead>
              <tbody>
                {userData.sessions.map((s: any) => (
                  <tr key={s.id} style={{ borderTop: "1px solid var(--panel-border)" }}>
                    <td style={{ padding: "12px", fontSize: "0.85rem" }}>{formatDateTime(s.startAt)}</td>
                    <td style={{ padding: "12px" }}>{formatNumber(s.endAdena - s.startAdena)}</td>
                    <td style={{ padding: "12px" }}>{formatCurrency((s.endAdena - s.startAdena) / s.adenaUnit * s.adenaRate + (new Date(s.endAt).getTime() - new Date(s.startAt).getTime()) / 3600000 * s.hourlyRate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h3 className="font-heading">Lịch sử thanh toán</h3>
          <div style={{ marginTop: "20px", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr className="text-muted" style={{ textAlign: "left", fontSize: "0.85rem" }}>
                  <th style={{ padding: "12px" }}>Ngày nhận</th>
                  <th style={{ padding: "12px" }}>Số tiền</th>
                  <th style={{ padding: "12px" }}>Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {userData.payments.map((p: any) => (
                  <tr key={p.id} style={{ borderTop: "1px solid var(--panel-border)" }}>
                    <td style={{ padding: "12px", fontSize: "0.85rem" }}>{formatDateTime(p.paidAt)}</td>
                    <td style={{ padding: "12px", color: "var(--success)", fontWeight: 700 }}>{formatCurrency(p.amount)}</td>
                    <td style={{ padding: "12px", fontSize: "0.85rem" }} className="text-muted">{p.note}</td>
                  </tr>
                ))}
                {userData.payments.length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ padding: "40px", textAlign: "center" }} className="text-muted">Chưa có lịch sử nhận tiền.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
