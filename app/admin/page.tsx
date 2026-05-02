"use client";

import { useEffect, useState } from "react";
import { 
  Plus, 
  UserPlus, 
  DollarSign, 
  Settings as SettingsIcon,
  LogOut,
  LayoutDashboard,
  Save,
  Clock,
  ArrowLeft
} from "lucide-react";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/calculations";
import Link from "next/link";

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [pin, setPin] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"sessions" | "payments" | "members" | "settings">("sessions");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Forms State
  const [sessionForm, setSessionForm] = useState({
    userId: "",
    startAt: "",
    endAt: "",
    hourlyRate: 20000,
    adenaRate: 25000,
    adenaUnit: 16666.67,
    startAdena: 0,
    endAdena: 0,
    note: ""
  });

  const [paymentForm, setPaymentForm] = useState({
    userId: "",
    amount: 0,
    paidAt: new Date().toISOString().slice(0, 16),
    note: ""
  });

  const [userForm, setUserForm] = useState({
    name: "",
    username: "",
    pin: "",
    role: "member",
    team: ""
  });

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
      fetchSessions();
    }
  }, [isAdmin]);

  async function fetchUsers() {
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    setUsers(data);
    if (data.length > 0) {
      setSessionForm(prev => ({ ...prev, userId: data[0].id }));
      setPaymentForm(prev => ({ ...prev, userId: data[0].id }));
    }
  }

  async function fetchSessions() {
    const res = await fetch("/api/admin/sessions");
    const data = await res.json();
    setSessions(data);
  }

  const handleLogin = () => {
    if (pin === "1234") { // Hardcoded for demo, in production should check against DB
      setIsAdmin(true);
    } else {
      alert("Sai mã PIN!");
    }
  };

  const handleAddSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/sessions", {
        method: "POST",
        body: JSON.stringify(sessionForm),
      });
      if (res.ok) {
        setMessage("Đã lưu ca cày thành công!");
        fetchSessions();
        setSessionForm({ ...sessionForm, startAdena: sessionForm.endAdena, note: "" });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/payments", {
        method: "POST",
        body: JSON.stringify(paymentForm),
      });
      if (res.ok) {
        setMessage("Đã ghi nhận thanh toán!");
        setPaymentForm({ ...paymentForm, amount: 0, note: "" });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        body: JSON.stringify(userForm),
      });
      if (res.ok) {
        setMessage("Đã tạo thành viên mới!");
        fetchUsers();
        setUserForm({ name: "", username: "", pin: "", role: "member", team: "" });
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="shell" style={{ display: "grid", placeItems: "center", minHeight: "80vh" }}>
        <div className="card animate-fade-in" style={{ width: "100%", maxWidth: "400px" }}>
          <h2 className="font-heading" style={{ textAlign: "center", marginBottom: "24px" }}>Admin Access</h2>
          <label>Nhập mã PIN Admin</label>
          <input 
            type="password" 
            value={pin} 
            onChange={(e) => setPin(e.target.value)} 
            placeholder="****"
            style={{ textAlign: "center", fontSize: "1.5rem", letterSpacing: "0.5em" }}
          />
          <button onClick={handleLogin} style={{ width: "100%", marginTop: "20px" }}>
            Xác nhận
          </button>
          <div style={{ marginTop: "20px", textAlign: "center" }}>
            <Link href="/" className="text-muted" style={{ fontSize: "0.9rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
              <ArrowLeft size={14} /> Quay lại Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="shell">
      <header className="hero compact animate-fade-in" style={{ textAlign: "left", marginBottom: "40px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <h1 style={{ fontSize: "2.5rem", margin: 0 }}>Quản trị hệ thống</h1>
            <span className="rank-badge" style={{ width: "auto", padding: "0 12px" }}>ADMIN</span>
          </div>
          <p>Quản lý thành viên, nhập liệu ca cày và đối soát thanh toán.</p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <Link href="/">
            <button className="secondary"><LayoutDashboard size={18} /> Dashboard</button>
          </Link>
          <button onClick={() => setIsAdmin(false)} className="secondary" style={{ color: "var(--danger)" }}>
            <LogOut size={18} /> Thoát
          </button>
        </div>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: "32px" }}>
        <aside className="animate-fade-in">
          <nav style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <button 
              className={activeTab === "sessions" ? "" : "secondary"} 
              onClick={() => setActiveTab("sessions")}
              style={{ justifyContent: "flex-start" }}
            >
              <Clock size={18} /> Ca cày
            </button>
            <button 
              className={activeTab === "payments" ? "" : "secondary"} 
              onClick={() => setActiveTab("payments")}
              style={{ justifyContent: "flex-start" }}
            >
              <DollarSign size={18} /> Thanh toán
            </button>
            <button 
              className={activeTab === "members" ? "" : "secondary"} 
              onClick={() => setActiveTab("members")}
              style={{ justifyContent: "flex-start" }}
            >
              <UserPlus size={18} /> Thành viên
            </button>
            <button 
              className={activeTab === "settings" ? "" : "secondary"} 
              onClick={() => setActiveTab("settings")}
              style={{ justifyContent: "flex-start" }}
            >
              <SettingsIcon size={18} /> Thiết lập
            </button>
          </nav>
        </aside>

        <section className="animate-fade-in delay-1">
          {message && (
            <div className="card text-success" style={{ marginBottom: "20px", padding: "12px 20px", border: "1px solid var(--success)" }}>
              {message}
              <button onClick={() => setMessage("")} style={{ float: "right", background: "none", padding: 0, color: "inherit" }}>&times;</button>
            </div>
          )}

          {activeTab === "sessions" && (
            <div style={{ display: "grid", gap: "24px" }}>
              <div className="card">
                <h3 className="font-heading"><Plus size={18} /> Nhập ca cày mới</h3>
                <form onSubmit={handleAddSession} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "20px" }}>
                  <div>
                    <label>Nhân viên</label>
                    <select value={sessionForm.userId} onChange={e => setSessionForm({...sessionForm, userId: e.target.value})}>
                      {users.filter(u => u.role === "member").map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label>Lương theo giờ (VND)</label>
                    <input type="number" value={sessionForm.hourlyRate} onChange={e => setSessionForm({...sessionForm, hourlyRate: Number(e.target.value)})} />
                  </div>
                  <div>
                    <label>Thời gian bắt đầu</label>
                    <input type="datetime-local" value={sessionForm.startAt} onChange={e => setSessionForm({...sessionForm, startAt: e.target.value})} required />
                  </div>
                  <div>
                    <label>Thời gian kết thúc</label>
                    <input type="datetime-local" value={sessionForm.endAt} onChange={e => setSessionForm({...sessionForm, endAt: e.target.value})} required />
                  </div>
                  <div>
                    <label>Số Adena lúc đầu</label>
                    <input type="number" value={sessionForm.startAdena} onChange={e => setSessionForm({...sessionForm, startAdena: Number(e.target.value)})} />
                  </div>
                  <div>
                    <label>Số Adena lúc cuối</label>
                    <input type="number" value={sessionForm.endAdena} onChange={e => setSessionForm({...sessionForm, endAdena: Number(e.target.value)})} />
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label>Ghi chú</label>
                    <textarea value={sessionForm.note} onChange={e => setSessionForm({...sessionForm, note: e.target.value})} />
                  </div>
                  <button type="submit" disabled={loading} style={{ gridColumn: "1 / -1" }}>
                    <Save size={18} /> {loading ? "Đang lưu..." : "Lưu ca cày"}
                  </button>
                </form>
              </div>

              <div className="card">
                <h3 className="font-heading">Lịch sử ca cày gần đây</h3>
                <div style={{ marginTop: "20px", overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr className="text-muted" style={{ textAlign: "left", fontSize: "0.85rem" }}>
                        <th style={{ padding: "12px" }}>Thành viên</th>
                        <th style={{ padding: "12px" }}>Thời gian</th>
                        <th style={{ padding: "12px" }}>Adena</th>
                        <th style={{ padding: "12px" }}>Tiền công</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessions.map(s => (
                        <tr key={s.id} style={{ borderTop: "1px solid var(--panel-border)" }}>
                          <td style={{ padding: "12px" }}>{s.user.name}</td>
                          <td style={{ padding: "12px", fontSize: "0.85rem" }}>{formatDateTime(s.startAt)}</td>
                          <td style={{ padding: "12px" }}>{formatNumber(s.endAdena - s.startAdena)}</td>
                          <td style={{ padding: "12px" }}>{formatCurrency((s.endAdena - s.startAdena) / s.adenaUnit * s.adenaRate + (new Date(s.endAt).getTime() - new Date(s.startAt).getTime()) / 3600000 * s.hourlyRate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "payments" && (
            <div className="card">
              <h3 className="font-heading"><DollarSign size={18} /> Ghi nhận thanh toán</h3>
              <form onSubmit={handleAddPayment} style={{ display: "grid", gap: "16px", marginTop: "20px", maxWidth: "500px" }}>
                <div>
                  <label>Nhân viên nhận tiền</label>
                  <select value={paymentForm.userId} onChange={e => setPaymentForm({...paymentForm, userId: e.target.value})}>
                    {users.filter(u => u.role === "member").map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Số tiền thanh toán (VND)</label>
                  <input type="number" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: Number(e.target.value)})} required />
                </div>
                <div>
                  <label>Ngày thanh toán</label>
                  <input type="datetime-local" value={paymentForm.paidAt} onChange={e => setPaymentForm({...paymentForm, paidAt: e.target.value})} />
                </div>
                <div>
                  <label>Ghi chú</label>
                  <textarea value={paymentForm.note} onChange={e => setPaymentForm({...paymentForm, note: e.target.value})} />
                </div>
                <button type="submit" disabled={loading}>
                  <Save size={18} /> {loading ? "Đang xử lý..." : "Xác nhận thanh toán"}
                </button>
              </form>
            </div>
          )}

          {activeTab === "members" && (
            <div style={{ display: "grid", gap: "24px" }}>
              <div className="card">
                <h3 className="font-heading"><UserPlus size={18} /> Thêm thành viên</h3>
                <form onSubmit={handleAddUser} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "20px" }}>
                  <div>
                    <label>Họ tên</label>
                    <input value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} required />
                  </div>
                  <div>
                    <label>Tên đăng nhập (Username)</label>
                    <input value={userForm.username} onChange={e => setUserForm({...userForm, username: e.target.value})} required />
                  </div>
                  <div>
                    <label>Mã PIN (Cho thành viên tự xem)</label>
                    <input value={userForm.pin} onChange={e => setUserForm({...userForm, pin: e.target.value})} required />
                  </div>
                  <div>
                    <label>Tổ / Nhóm</label>
                    <input value={userForm.team} onChange={e => setUserForm({...userForm, team: e.target.value})} placeholder="Vd: Tổ cày đêm" />
                  </div>
                  <button type="submit" disabled={loading} style={{ gridColumn: "1 / -1" }}>
                    <Save size={18} /> {loading ? "Đang lưu..." : "Tạo tài khoản"}
                  </button>
                </form>
              </div>

              <div className="card">
                <h3 className="font-heading">Danh sách thành viên</h3>
                <div style={{ marginTop: "20px" }} className="list-container">
                  {users.map(user => (
                    <div key={user.id} className="list-item">
                      <div className="rank-badge" style={{ background: user.role === 'admin' ? 'var(--primary)' : 'rgba(255,255,255,0.1)', color: user.role === 'admin' ? 'white' : 'inherit' }}>
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700 }}>{user.name}</div>
                        <div className="text-muted" style={{ fontSize: "0.8rem" }}>@{user.username} • {user.team}</div>
                      </div>
                      <div className="text-muted">{user.role.toUpperCase()}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="card">
              <h3 className="font-heading"><SettingsIcon size={18} /> Cấu hình hệ thống</h3>
              <p className="text-muted" style={{ fontSize: "0.9rem", margin: "12px 0 20px" }}>
                Thiết lập các thông số tính toán mặc định cho toàn bộ hệ thống.
              </p>
              <div style={{ display: "grid", gap: "20px", maxWidth: "400px" }}>
                <div>
                  <label>Rate Adena mặc định (VND)</label>
                  <input type="number" defaultValue={25000} />
                </div>
                <div>
                  <label>Đơn vị Adena (VND)</label>
                  <input type="number" defaultValue={16666.67} />
                </div>
                <div>
                  <label>Lương giờ mặc định (VND)</label>
                  <input type="number" defaultValue={20000} />
                </div>
                <button>Cập nhật thiết lập</button>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
