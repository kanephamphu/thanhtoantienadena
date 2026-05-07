"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Plus,
  UserPlus,
  DollarSign,
  Settings as SettingsIcon,
  LogOut,
  LayoutDashboard,
  Save,
  Clock,
  ArrowLeft,
  Trash2,
  Edit,
  Printer,
  CheckSquare,
  Square,
  Check,
  History,
  Users
} from "lucide-react";
import { formatCurrency, formatDateTime, formatNumber, formatTime, formatVNTDateTimeInput, getSessionIncome } from "@/lib/calculations";
import Link from "next/link";

import { useRouter } from "next/navigation";

export default function AdminPage() {
  const router = useRouter();
  const [hasMounted, setHasMounted] = useState(false);
  const defaultDocumentTitleRef = useRef("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [pin, setPin] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"sessions" | "payments" | "members" | "settings">("sessions");
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [adenaRate10k, setAdenaRate10k] = useState<number>(25000);
  const [payPercentage, setPayPercentage] = useState<number>(60);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [payments, setPayments] = useState<any[]>([]);
  const [selectedPrintPayment, setSelectedPrintPayment] = useState<any>(null);

  // Forms State
  const [sessionForm, setSessionForm] = useState({
    id: "", // Added ID for editing
    userId: "",
    startAt: "",
    endAt: "",
    hourlyRate: 0,
    adenaRate: 0,
    adenaUnit: 10000,
    startAdena: 0,
    endAdena: 0,
    note: ""
  });

  const [paymentForm, setPaymentForm] = useState({
    userId: "",
    amount: 0,
    paidAt: formatVNTDateTimeInput(),
    note: "",
    commission: 60,
    sessionIds: [] as string[]
  });

  const [userForm, setUserForm] = useState({
    id: "", // Added for editing
    name: "",
    username: "",
    pin: "",
    avatar: "",
    role: "member",
    team: ""
  });

  useEffect(() => {
    setHasMounted(true);
    defaultDocumentTitleRef.current = document.title;
  }, []);

  useEffect(() => {
    const userStr = localStorage.getItem("adena_user");
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user.role === "admin") {
        setIsAdmin(true);
      } else {
        router.push("/dashboard");
      }
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
      fetchSessions();
      fetchPayments();
    }
  }, [isAdmin]);

  async function fetchUsers() {
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    setUsers(data);
    if (data.length > 0) {
      const firstMember = data.find((u: any) => u.role === "member");
      const defaultId = firstMember?.id || data[0].id;
      setSessionForm(prev => ({ ...prev, userId: defaultId }));
      setPaymentForm(prev => ({ ...prev, userId: defaultId }));
      setSelectedEmployee(defaultId);
    }
  }

  async function fetchPayments() {
    const res = await fetch("/api/admin/payments");
    const data = await res.json();
    setPayments(data);
  }

  async function fetchSessions() {
    const res = await fetch("/api/admin/sessions");
    const data = await res.json();
    setSessions(data);
    // Refresh selected sessions if they were deleted/updated
    setSelectedSessions([]);
  }

  const handleLogout = () => {
    localStorage.removeItem("adena_user");
    setIsAdmin(false);
    router.push("/login");
  };

  const filteredSessions = sessions.filter(s => s.userId === selectedEmployee);
  const unpaidSessions = filteredSessions.filter(s => !s.isPaid);

  const selectedSessionsData = sessions.filter(s => selectedSessions.includes(s.id));
  const totalAdenaForPayroll = selectedSessionsData.reduce((sum, s) => sum + (s.endAdena - s.startAdena), 0);
  const calculatedGross = (totalAdenaForPayroll / 10000) * adenaRate10k;
  const finalAmount = calculatedGross * (payPercentage / 100);

  const employeeSummary = users.find(u => u.id === selectedEmployee) ? {
    totalAdena: filteredSessions.reduce((sum, s) => sum + (s.endAdena - s.startAdena), 0),
    totalIncome: filteredSessions.reduce((sum, s) => {
      const adenaEarned = s.endAdena - s.startAdena;
      return sum + (adenaEarned / (s.adenaUnit || 10000) * (s.adenaRate || 25000));
    }, 0),
    totalPaid: 0
  } : { totalAdena: 0, totalIncome: 0, totalPaid: 0 };

  const [settingsForm, setSettingsForm] = useState({
    defaultHourlyRate: 20000,
    defaultAdenaRate: 25000,
    defaultAdenaUnit: 16666.67,
    defaultSharePercentage: 60
  });

  useEffect(() => {
    if (isAdmin) {
      fetchSettings();
    }
  }, [isAdmin]);

  useEffect(() => {
    document.body.classList.toggle("print-receipt-mode", Boolean(selectedPrintPayment));
    return () => {
      document.body.classList.remove("print-receipt-mode");
    };
  }, [selectedPrintPayment]);

  useEffect(() => {
    if (!selectedPrintPayment) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedPrintPayment(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedPrintPayment]);

  async function fetchSettings() {
    const res = await fetch("/api/dashboard"); // Reusing this for settings
    const data = await res.json();
    if (data.settings) {
      setSettingsForm({
        defaultHourlyRate: data.settings.defaultHourlyRate,
        defaultAdenaRate: data.settings.defaultAdenaRate,
        defaultAdenaUnit: data.settings.defaultAdenaUnit,
        defaultSharePercentage: data.settings.defaultSharePercentage
      });
      setAdenaRate10k(data.settings.defaultAdenaRate);
      setPayPercentage(data.settings.defaultSharePercentage);
    }
  }

  const handleUpdateSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/setup", {
        method: "POST",
        body: JSON.stringify(settingsForm)
      });
      if (res.ok) {
        setAdenaRate10k(settingsForm.defaultAdenaRate);
        setPayPercentage(settingsForm.defaultSharePercentage);
        setMessage("Đã cập nhật thiết lập hệ thống!");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const method = sessionForm.id ? "PUT" : "POST";
      const res = await fetch("/api/admin/sessions", {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sessionForm),
      });
      if (res.ok) {
        setMessage(sessionForm.id ? "Đã cập nhật ca cày!" : "Đã lưu ca cày thành công!");
        fetchSessions();
        setSessionForm({
          ...sessionForm,
          id: "",
          startAdena: sessionForm.endAdena,
          note: ""
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xoá ca cày này?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/sessions?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setMessage("Đã xoá ca cày!");
        fetchSessions();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditSession = (session: any) => {
    setSessionForm({
      id: session.id,
      userId: session.userId,
      startAt: formatVNTDateTimeInput(session.startAt),
      endAt: formatVNTDateTimeInput(session.endAt),
      hourlyRate: session.hourlyRate,
      adenaRate: session.adenaRate,
      adenaUnit: session.adenaUnit,
      startAdena: session.startAdena,
      endAdena: session.endAdena,
      note: session.note || "",
      isPaid: session.isPaid
    } as any);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSessions.length === 0) {
      alert("Vui lòng chọn ít nhất một ca cày để thanh toán!");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...paymentForm,
          userId: selectedEmployee,
          amount: finalAmount,
          commission: adenaRate10k,
          percentage: payPercentage,
          sessionIds: selectedSessions
        }),
      });
      if (res.ok) {
        setMessage("Đã ghi nhận thanh toán và chốt ca cày!");
        await Promise.all([fetchSessions(), fetchPayments()]);
        setSelectedSessions([]);
        setPaymentForm({ ...paymentForm, amount: 0, note: "" });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPrintPreview = () => {
    if (selectedSessions.length === 0) {
      alert("Vui lòng chọn ít nhất một ca cày để in phiếu thanh toán!");
      return;
    }

    setSelectedPrintPayment({
      id: "preview",
      user: users.find((user) => user.id === selectedEmployee),
      paidAt: paymentForm.paidAt,
      note: paymentForm.note,
      commission: adenaRate10k,
      percentage: payPercentage,
      amount: finalAmount,
      sessions: selectedSessionsData
    });
  };

  const handlePrintReceipt = () => {
    window.setTimeout(() => {
      const previousTitle = document.title;
      document.title = receiptPrintTitle;
      window.addEventListener("afterprint", () => {
        document.title = previousTitle || defaultDocumentTitleRef.current;
      }, { once: true });
      window.print();
    }, 50);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const method = userForm.id ? "PUT" : "POST";
      const res = await fetch("/api/admin/users", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userForm),
      });
      if (res.ok) {
        setMessage(userForm.id ? "Đã cập nhật thành viên!" : "Đã tạo thành viên mới!");
        fetchUsers();
        setUserForm({ id: "", name: "", username: "", pin: "", avatar: "", role: "member", team: "" });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xoá thành viên này? Tất cả dữ liệu ca cày và thanh toán liên quan sẽ có thể bị ảnh hưởng.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setMessage("Đã xoá thành viên!");
        fetchUsers();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: any) => {
    setUserForm({
      id: user.id,
      name: user.name,
      username: user.username,
      pin: user.pin,
      avatar: user.avatar || "",
      role: user.role,
      team: user.team || ""
    });
    // Scroll to form
    const formElement = document.getElementById("user-form");
    formElement?.scrollIntoView({ behavior: "smooth" });
  };

  const receiptRate10k = Number(selectedPrintPayment?.commission ?? adenaRate10k) || 0;
  const getReceiptSessionAdena = (session: any) => Math.max((session.endAdena ?? 0) - (session.startAdena ?? 0), 0);
  const getReceiptSessionSubtotal = (session: any) => {
    const sessionAdena = getReceiptSessionAdena(session);
    if (receiptRate10k > 0) {
      return (sessionAdena / 10000) * receiptRate10k;
    }
    return (sessionAdena / (session.adenaUnit || 10000)) * (session.adenaRate || 25000);
  };
  const receiptRateLabel = receiptRate10k > 0
    ? `${formatCurrency(receiptRate10k)}/10k Adena`
    : "Theo rate của từng ca";
  const receiptPrintTitle = selectedPrintPayment
    ? `Bang-luong-${(selectedPrintPayment.user?.name || "thanh-vien").trim().replace(/\s+/g, "-")}-${formatVNTDateTimeInput(selectedPrintPayment.paidAt).replace("T", "_")}`
    : defaultDocumentTitleRef.current || "Bang-luong";
  const receiptTotalAdena = selectedPrintPayment?.sessions?.reduce((sum: number, session: any) => sum + getReceiptSessionAdena(session), 0) ?? 0;
  const receiptGrossValue = selectedPrintPayment?.sessions?.reduce(
    (sum: number, session: any) => sum + getReceiptSessionSubtotal(session),
    0
  ) ?? 0;

  if (!isAdmin) {
    return (
      <div className="shell" style={{ display: "grid", placeItems: "center", minHeight: "80vh" }}>
        <div className="card animate-fade-in" style={{ width: "100%", maxWidth: "400px" }}>
          <h2 className="font-heading" style={{ textAlign: "center", marginBottom: "24px" }}>Admin Access</h2>
          <p className="text-muted" style={{ textAlign: "center", marginBottom: "20px" }}>Vui lòng đăng nhập từ trang login chính thức.</p>
          <Link href="/login" style={{ width: "100%" }}>
            <button style={{ width: "100%" }}>
              Đi tới trang Đăng nhập
            </button>
          </Link>
          <div style={{ marginTop: "20px", textAlign: "center" }}>
            <Link href="/" className="text-muted" style={{ fontSize: "0.9rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
              <ArrowLeft size={14} /> Quay lại Dashboard công khai
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
        <div className="page-actions">
          <Link href="/">
            <button className="secondary"><LayoutDashboard size={18} /> Public View</button>
          </Link>
          <button onClick={handleLogout} className="secondary" style={{ color: "var(--danger)" }}>
            <LogOut size={18} /> Đăng xuất
          </button>
        </div>
      </header>

      <div className="admin-layout">
        <aside className="animate-fade-in">
          <nav className="admin-tab-nav">
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
                <form onSubmit={handleAddSession} className="admin-form-grid" style={{ marginTop: "20px" }}>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label>Thành viên</label>
                    <select value={sessionForm.userId} onChange={e => setSessionForm({ ...sessionForm, userId: e.target.value })}>
                      {users.filter(u => u.role === "member").map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label>Thời gian bắt đầu</label>
                    <input type="datetime-local" value={sessionForm.startAt} onChange={e => setSessionForm({ ...sessionForm, startAt: e.target.value })} required />
                  </div>
                  <div>
                    <label>Thời gian kết thúc</label>
                    <input type="datetime-local" value={sessionForm.endAt} onChange={e => setSessionForm({ ...sessionForm, endAt: e.target.value })} required />
                  </div>
                  <div>
                    <label>Số Adena lúc đầu</label>
                    <input type="number" value={sessionForm.startAdena} onChange={e => setSessionForm({ ...sessionForm, startAdena: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label>Số Adena lúc cuối</label>
                    <input type="number" value={sessionForm.endAdena} onChange={e => setSessionForm({ ...sessionForm, endAdena: Number(e.target.value) })} />
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label>Ghi chú</label>
                    <textarea value={sessionForm.note} onChange={e => setSessionForm({ ...sessionForm, note: e.target.value })} />
                  </div>
                  {sessionForm.id && (
                    <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                      <input
                        type="checkbox"
                        id="isPaid"
                        checked={(sessionForm as any).isPaid}
                        onChange={e => setSessionForm({ ...sessionForm, isPaid: e.target.checked } as any)}
                      />
                      <label htmlFor="isPaid" style={{ marginBottom: 0 }}>Đã thanh toán (Manual Override)</label>
                    </div>
                  )}
                  <div className="button-row" style={{ gridColumn: "1 / -1" }}>
                    <button type="submit" disabled={loading} style={{ flex: 1 }}>
                      <Save size={18} /> {loading ? "Đang lưu..." : (sessionForm.id ? "Cập nhật ca cày" : "Lưu ca cày")}
                    </button>
                    {sessionForm.id && (
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => setSessionForm({ ...sessionForm, id: "" })}
                        style={{ flex: 1 }}
                      >
                        Hủy sửa
                      </button>
                    )}
                  </div>
                </form>
              </div>

              <div className="card">
                <div className="card-toolbar" style={{ marginBottom: "20px" }}>
                  <h3 className="font-heading" style={{ margin: 0 }}>Lịch sử & Đối soát thanh toán</h3>
                  <div className="toolbar-inline">
                    <span className="text-muted">Chọn Thành viên:</span>
                    <select
                      value={selectedEmployee}
                      onChange={e => setSelectedEmployee(e.target.value)}
                      style={{ width: "auto" }}
                    >
                      {users.filter(u => u.role === "member").map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="stats-grid compact-stats" style={{ marginBottom: "24px" }}>
                  <div className="card" style={{ background: "rgba(255,255,255,0.05)", padding: "16px" }}>
                    <div className="stat-label">Tổng Adena cày được</div>
                    <div className="stat-value" style={{ fontSize: "1.5rem" }}>{formatNumber(employeeSummary.totalAdena)}</div>
                  </div>
                  <div className="card" style={{ background: "rgba(255,255,255,0.05)", padding: "16px" }}>
                    <div className="stat-label">Tổng tiền công tạm tính</div>
                    <div className="stat-value" style={{ fontSize: "1.5rem" }}>{formatCurrency(employeeSummary.totalIncome)}</div>
                  </div>
                </div>

                <div>
                  <table className="mobile-table">
                    <thead>
                      <tr className="text-muted" style={{ textAlign: "left", fontSize: "0.85rem" }}>
                        <th style={{ padding: "12px" }}>Bắt đầu</th>
                        <th style={{ padding: "12px" }}>Kết thúc</th>
                        <th style={{ padding: "12px" }}>Adena</th>
                        <th style={{ padding: "12px" }}>Tiền công</th>
                        <th style={{ padding: "12px" }}>Trạng thái</th>
                        <th style={{ padding: "12px" }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSessions.map(s => (
                        <tr key={s.id} style={{ borderTop: "1px solid var(--panel-border)" }}>
                          <td data-label="Bắt đầu" style={{ padding: "12px", fontSize: "0.85rem" }}>{formatDateTime(s.startAt)}</td>
                          <td data-label="Kết thúc" style={{ padding: "12px", fontSize: "0.85rem" }}>{formatDateTime(s.endAt)}</td>
                          <td data-label="Adena" style={{ padding: "12px" }}>{formatNumber(s.endAdena - s.startAdena)}</td>
                          <td data-label="Tiền công" style={{ padding: "12px" }}>
                            {formatCurrency(getSessionIncome(s))}
                          </td>
                          <td data-label="Trạng thái" style={{ padding: "12px" }}>
                            <span className={`rank-badge ${s.isPaid ? 'success' : 'warning'}`} style={{ width: "auto", fontSize: "0.7rem", padding: "2px 8px" }}>
                              {s.isPaid ? 'ĐÃ TRẢ' : 'CHƯA TRẢ'}
                            </span>
                          </td>
                          <td data-label="Thao tác" className="mobile-table-actions" style={{ padding: "12px", textAlign: "right" }}>
                            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                              <button
                                onClick={() => handleEditSession(s)}
                                className="secondary"
                                style={{ padding: "4px 8px", color: "var(--accent)" }}
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteSession(s.id)}
                                className="secondary"
                                style={{ padding: "4px 8px", color: "var(--danger)" }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredSessions.length === 0 && (
                        <tr>
                          <td colSpan={6} style={{ padding: "40px", textAlign: "center" }} className="text-muted">Chưa có ca cày nào cho thành viên này.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "payments" && (
            <div style={{ display: "grid", gap: "24px" }}>
              <div className="card">
                <div className="card-toolbar" style={{ marginBottom: "20px" }}>
                  <h3 className="font-heading" style={{ margin: 0 }}><DollarSign size={18} /> Đối soát & Thanh toán (Payroll)</h3>
                  <div className="toolbar-inline">
                    <span className="text-muted">Chọn Thành viên:</span>
                    <select
                      value={selectedEmployee}
                      onChange={e => {
                        setSelectedEmployee(e.target.value);
                        setSelectedSessions([]);
                      }}
                      style={{ width: "auto" }}
                    >
                      {users.filter(u => u.role === "member").map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: "24px" }}>
                  <p className="text-muted" style={{ fontSize: "0.9rem", marginBottom: "16px" }}>
                    Chọn các ca cày chưa thanh toán của <strong>{users.find(u => u.id === selectedEmployee)?.name}</strong> để lập bảng lương.
                  </p>
                  <div>
                    <table className="mobile-table">
                      <thead>
                        <tr className="text-muted" style={{ textAlign: "left", fontSize: "0.85rem" }}>
                          <th style={{ padding: "12px", width: "40px" }}>
                            <input
                              type="checkbox"
                              checked={unpaidSessions.length > 0 && selectedSessions.length === unpaidSessions.length}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedSessions(unpaidSessions.map(s => s.id));
                                else setSelectedSessions([]);
                              }}
                            />
                          </th>
                          <th style={{ padding: "12px" }}>Thời gian</th>
                          <th style={{ padding: "12px" }}>Adena</th>
                          <th style={{ padding: "12px" }}>Gross Income</th>
                        </tr>
                      </thead>
                      <tbody>
                        {unpaidSessions.map(s => {
                          const gross = getSessionIncome(s);
                          return (
                            <tr key={s.id} style={{ borderTop: "1px solid var(--panel-border)" }}>
                              <td data-label="Chọn" style={{ padding: "12px" }}>
                                <input
                                  type="checkbox"
                                  checked={selectedSessions.includes(s.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) setSelectedSessions([...selectedSessions, s.id]);
                                    else setSelectedSessions(selectedSessions.filter(id => id !== s.id));
                                  }}
                                />
                              </td>
                              <td data-label="Thời gian" style={{ padding: "12px", fontSize: "0.85rem" }}>{formatDateTime(s.startAt)} - {formatTime(s.endAt)}</td>
                              <td data-label="Adena" style={{ padding: "12px" }}>{formatNumber(s.endAdena - s.startAdena)}</td>
                              <td data-label="Gross Income" style={{ padding: "12px" }}>{formatCurrency(gross)}</td>
                            </tr>
                          );
                        })}
                        {unpaidSessions.length === 0 && (
                          <tr>
                            <td colSpan={5} style={{ padding: "40px", textAlign: "center" }} className="text-muted">Tất cả ca cày đã được thanh toán hoặc chưa có dữ liệu.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="payroll-grid" style={{ paddingTop: "24px", borderTop: "2px solid var(--panel-border)" }}>
                  <div className="payroll-input-grid">
                    <div>
                      <label>Rate 10k Adena (VND)</label>
                      <input
                        type="number"
                        value={adenaRate10k}
                        onChange={e => setAdenaRate10k(Number(e.target.value))}
                        style={{ fontSize: "1.2rem", fontWeight: 700 }}
                      />
                    </div>
                    <div>
                      <label>Phần trăm nhận (%)</label>
                      <input
                        type="number"
                        value={payPercentage}
                        onChange={e => setPayPercentage(Number(e.target.value))}
                        style={{ fontSize: "1.2rem", fontWeight: 700 }}
                      />
                    </div>
                    <div style={{ gridColumn: "1 / -1" }}>
                      <label>Ghi chú thanh toán</label>
                      <textarea
                        value={paymentForm.note}
                        onChange={e => setPaymentForm({ ...paymentForm, note: e.target.value })}
                        placeholder="Vd: Thanh toán tuần 1 tháng 5"
                      />
                    </div>
                  </div>
                  <div className="card" style={{ background: "var(--accent-glow)", borderColor: "var(--accent)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                      <span className="text-muted">Tổng Adena đã chọn:</span>
                      <span style={{ fontWeight: 700 }}>{formatNumber(totalAdenaForPayroll)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                      <span className="text-muted">Giá trị Adena:</span>
                      <span style={{ fontWeight: 700 }}>{formatCurrency((totalAdenaForPayroll / 10000) * adenaRate10k)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
                      <span className="text-muted">Thực nhận ({payPercentage}%):</span>
                      <span style={{ color: "var(--success)", fontWeight: 700 }}>{formatCurrency(finalAmount)}</span>
                    </div>
                    <div style={{ fontSize: "1.5rem", fontWeight: 900, textAlign: "right", color: "var(--accent)", marginBottom: "20px" }}>
                      {formatCurrency(finalAmount)}
                    </div>
                    <div className="button-row">
                      <button onClick={handleAddPayment} disabled={loading || selectedSessions.length === 0} style={{ flex: 2 }}>
                        <Save size={18} /> {loading ? "Đang xử lý..." : "Xác nhận & Chốt ca"}
                      </button>
                      <button onClick={handleOpenPrintPreview} className="secondary" style={{ flex: 1 }}>
                        <Printer size={18} /> Xem bản in
                      </button>
                    </div>
                  </div>
                </div>

                {/* Lịch sử thanh toán */}
                <div className="card" style={{ marginTop: "24px" }}>
                  <h3 className="font-heading"><History size={18} /> Lịch sử thanh toán</h3>
                  <div style={{ marginTop: "20px" }} className="list-container">
                    {payments.map(p => (
                      <div key={p.id} className="list-item" style={{ cursor: "pointer" }} onClick={() => setSelectedPrintPayment(p)}>
                        <div className="rank-badge" style={{ background: "var(--success)" }}>
                          <Check size={14} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700 }}>{p.user?.name} - {formatCurrency(p.amount)}</div>
                          <div className="text-muted" style={{ fontSize: "0.8rem" }}>
                            {formatDateTime(p.paidAt)} • {p.sessions?.length} ca làm • {formatCurrency(p.commission || 0)}/10k • {p.percentage}% tỉ lệ
                          </div>
                          {p.note && <div style={{ fontSize: "0.75rem", fontStyle: "italic" }}>Ghi chú: {p.note}</div>}
                        </div>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button className="secondary" style={{ padding: "8px" }} onClick={(e) => { e.stopPropagation(); setSelectedPrintPayment(p); }}>
                            <Printer size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {payments.length === 0 && (
                      <div className="text-muted" style={{ padding: "40px", textAlign: "center" }}>Chưa có lịch sử thanh toán.</div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {activeTab === "members" && (
            <div style={{ display: "grid", gap: "24px" }}>
              <div className="card" id="user-form">
                <h3 className="font-heading"><UserPlus size={18} /> {userForm.id ? "Chỉnh sửa thành viên" : "Thêm thành viên"}</h3>
                <form onSubmit={handleAddUser} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "20px" }}>
                  <div>
                    <label>Họ tên</label>
                    <input value={userForm.name} onChange={e => setUserForm({ ...userForm, name: e.target.value })} required />
                  </div>
                  <div>
                    <label>Tên đăng nhập (Username)</label>
                    <input value={userForm.username} onChange={e => setUserForm({ ...userForm, username: e.target.value })} required />
                  </div>
                  <div>
                    <label>Mã PIN (Cho thành viên tự xem)</label>
                    <input value={userForm.pin} onChange={e => setUserForm({ ...userForm, pin: e.target.value })} required />
                  </div>
                  <div>
                    <label>Tổ / Nhóm</label>
                    <input value={userForm.team} onChange={e => setUserForm({ ...userForm, team: e.target.value })} placeholder="Vd: Tổ cày đêm" />
                  </div>
                  <div>
                    <label>URL Hình ảnh (Avatar)</label>
                    <input value={userForm.avatar} onChange={e => setUserForm({ ...userForm, avatar: e.target.value })} placeholder="https://...jpg" />
                  </div>
                  <div style={{ gridColumn: "1 / -1", display: "flex", gap: "12px" }}>
                    <button type="submit" disabled={loading} style={{ flex: 1 }}>
                      <Save size={18} /> {loading ? "Đang lưu..." : (userForm.id ? "Cập nhật" : "Tạo tài khoản")}
                    </button>
                    {userForm.id && (
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => setUserForm({ id: "", name: "", username: "", pin: "", avatar: "", role: "member", team: "" })}
                        style={{ flex: 1 }}
                      >
                        Hủy
                      </button>
                    )}
                  </div>
                </form>
              </div>

              <div className="card">
                <h3 className="font-heading">Danh sách thành viên</h3>
                <div style={{ marginTop: "20px" }} className="list-container">
                  {users.map(user => (
                    <div key={user.id} className="list-item">
                      <div className="rank-badge" style={{
                        background: user.role === 'admin' ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                        color: user.role === 'admin' ? 'white' : 'inherit',
                        padding: 0,
                        overflow: 'hidden'
                      }}>
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          user.name.charAt(0)
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700 }}>{user.name}</div>
                        <div className="text-muted" style={{ fontSize: "0.8rem" }}>@{user.username} • {user.team}</div>
                      </div>
                      <div className="text-muted">{user.role.toUpperCase()}</div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          onClick={() => handleEditUser(user)}
                          className="secondary"
                          style={{ padding: "4px 8px", color: "var(--accent)" }}
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="secondary"
                          style={{ padding: "4px 8px", color: "var(--danger)" }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
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
                  <input
                    type="number"
                    value={settingsForm.defaultAdenaRate}
                    onChange={e => setSettingsForm({ ...settingsForm, defaultAdenaRate: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label>Đơn vị Adena (VND)</label>
                  <input
                    type="number"
                    value={settingsForm.defaultAdenaUnit}
                    onChange={e => setSettingsForm({ ...settingsForm, defaultAdenaUnit: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label>Lương giờ mặc định (VND)</label>
                  <input
                    type="number"
                    value={settingsForm.defaultHourlyRate}
                    onChange={e => setSettingsForm({ ...settingsForm, defaultHourlyRate: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label>Tỉ lệ ăn chia mặc định (%)</label>
                  <input
                    type="number"
                    value={settingsForm.defaultSharePercentage}
                    onChange={e => setSettingsForm({ ...settingsForm, defaultSharePercentage: Number(e.target.value) })}
                  />
                  <div className="text-muted" style={{ fontSize: "0.8rem", marginTop: "8px" }}>
                    Mặc định 6/4 tương ứng 60% cho người nhận.
                  </div>
                </div>
                <button onClick={handleUpdateSettings} disabled={loading}>
                  {loading ? "Đang lưu..." : "Cập nhật thiết lập"}
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
      {hasMounted && selectedPrintPayment && createPortal(
        <div
          className="payment-print-modal"
          style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.85)", display: "grid", placeItems: "center",
            zIndex: 1000, padding: "20px", backdropFilter: "blur(5px)"
          }}
          onClick={() => setSelectedPrintPayment(null)}
        >
          <div
            className="card animate-fade-in payment-print-sheet"
            style={{ maxWidth: "860px", width: "100%", maxHeight: "90vh", overflowY: "auto", border: "1px solid var(--accent)" }}
            onClick={e => e.stopPropagation()}
          >
            <div className="payment-print-toolbar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", gap: "12px", flexWrap: "wrap" }}>
              <div>
                <div className="text-muted" style={{ fontSize: "0.8rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>Phiếu thanh toán</div>
                <h2 className="font-heading" style={{ margin: "6px 0 0" }}>Bảng lương chi tiết</h2>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={handlePrintReceipt} style={{ background: "var(--success)" }}>
                  <Printer size={18} /> In bảng lương
                </button>
                <button onClick={() => setSelectedPrintPayment(null)} className="secondary">Đóng</button>
              </div>
            </div>
            <p className="text-muted" style={{ margin: "-10px 0 20px", fontSize: "0.85rem" }}>
              Khi lưu ra PDF xong, bạn có thể bấm <strong>Đóng</strong> để quay lại màn hình quản trị.
            </p>

            <div className="payment-print-header">
              <div>
                <div className="payment-print-label">Thành viên</div>
                <div className="payment-print-value">{selectedPrintPayment.user?.name}</div>
              </div>
              <div>
                <div className="payment-print-label">Ngày thanh toán</div>
                <div className="payment-print-value">{formatDateTime(selectedPrintPayment.paidAt)}</div>
              </div>
              <div>
                <div className="payment-print-label">Số ca chốt</div>
                <div className="payment-print-value">{selectedPrintPayment.sessions?.length ?? 0} ca</div>
              </div>
            </div>

            {selectedPrintPayment.note && (
              <div className="payment-print-note">
                <span className="payment-print-label">Ghi chú</span>
                <div>{selectedPrintPayment.note}</div>
              </div>
            )}

            <div className="payment-print-summary">
              <div className="payment-print-metric">
                <span className="payment-print-label">Tổng Adena</span>
                <strong>{formatNumber(receiptTotalAdena)}</strong>
              </div>
              <div className="payment-print-metric">
                <span className="payment-print-label">Rate áp dụng</span>
                <strong>{receiptRateLabel}</strong>
              </div>
              <div className="payment-print-metric">
                <span className="payment-print-label">Giá trị Adena</span>
                <strong>{formatCurrency(receiptGrossValue)}</strong>
              </div>
              <div className="payment-print-metric">
                <span className="payment-print-label">Tỉ lệ thanh toán</span>
                <strong>{selectedPrintPayment.percentage}%</strong>
              </div>
              <div className="payment-print-metric highlight">
                <span className="payment-print-label">Thực nhận</span>
                <strong>{formatCurrency(selectedPrintPayment.amount)}</strong>
              </div>
            </div>

            <table className="payment-print-table">
              <thead>
                <tr>
                  <th>Ca làm</th>
                  <th>Adena</th>
                  <th>Tạm tính</th>
                </tr>
              </thead>
              <tbody>
                {selectedPrintPayment.sessions?.map((s: any) => (
                  <tr key={s.id}>
                    <td>
                      <div>{formatDateTime(s.startAt)}</div>
                      <div className="payment-print-subline">đến {formatDateTime(s.endAt)}</div>
                    </td>
                    <td>{formatNumber(getReceiptSessionAdena(s))}</td>
                    <td style={{ textAlign: "right" }}>
                      <div>{formatCurrency(getReceiptSessionSubtotal(s))}</div>
                      <div className="payment-print-subline">Rate {receiptRateLabel}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="payment-print-footer">
              <div className="payment-print-signature">
                <span className="payment-print-label">Người lập phiếu</span>
                <div className="payment-print-sign-line" />
              </div>
              <div className="payment-print-signature">
                <span className="payment-print-label">Người nhận</span>
                <div className="payment-print-sign-line" />
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </main>
  );
}
