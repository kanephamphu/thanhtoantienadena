"use client";

import { useEffect, useMemo, useState } from "react";
import {
  buildDailySeries,
  buildLeaderboardDelta,
  buildUserSummaries,
  buildWeeklyRanking,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
  getSessionAdena,
  getSessionHours,
  getSessionIncome
} from "@/lib/calculations";
import { seedState } from "@/lib/seed";
import { AppState, Role, User } from "@/lib/types";

const storageKey = "adena-payroll-state";
const currentUserKey = "adena-payroll-current-user";

function Card({
  title,
  value,
  meta
}: {
  title: string;
  value: string;
  meta: string;
}) {
  return (
    <div className="card metric-card">
      <span className="eyebrow">{title}</span>
      <strong>{value}</strong>
      <span className="muted">{meta}</span>
    </div>
  );
}

function LineChart({
  values,
  color
}: {
  values: number[];
  color: string;
}) {
  if (values.length === 0) {
    return <div className="empty-chart">Chưa có dữ liệu để vẽ biểu đồ.</div>;
  }

  const max = Math.max(...values, 1);
  const points = values
    .map((value, index) => {
      const x = values.length === 1 ? 160 : (index / (values.length - 1)) * 320;
      const y = 120 - (value / max) * 90;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox="0 0 320 140" className="chart-svg" role="img" aria-label="Biểu đồ đường">
      <path d="M0 120 H320" className="chart-axis" />
      <polyline fill="none" stroke={color} strokeWidth="4" points={points} strokeLinejoin="round" strokeLinecap="round" />
      {values.map((value, index) => {
        const x = values.length === 1 ? 160 : (index / (values.length - 1)) * 320;
        const y = 120 - (value / max) * 90;
        return <circle key={`${value}-${index}`} cx={x} cy={y} r="4" fill={color} />;
      })}
    </svg>
  );
}

function BarChart({
  labels,
  values,
  color
}: {
  labels: string[];
  values: number[];
  color: string;
}) {
  if (values.length === 0) {
    return <div className="empty-chart">Chưa có dữ liệu để vẽ biểu đồ.</div>;
  }

  const max = Math.max(...values, 1);

  return (
    <div className="bars">
      {values.map((value, index) => (
        <div className="bar-column" key={`${labels[index]}-${index}`}>
          <span className="bar-value">{formatNumber(value)}</span>
          <div className="bar-track">
            <div className="bar-fill" style={{ height: `${Math.max((value / max) * 100, 6)}%`, background: color }} />
          </div>
          <span className="bar-label">{labels[index]}</span>
        </div>
      ))}
    </div>
  );
}

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

type SessionFormState = {
  userId: string;
  startAt: string;
  endAt: string;
  hourlyRate: string;
  adenaRate: string;
  adenaUnit: string;
  startAdena: string;
  endAdena: string;
  note: string;
};

type PaymentFormState = {
  userId: string;
  amount: string;
  paidAt: string;
  note: string;
};

type UserFormState = {
  name: string;
  username: string;
  pin: string;
  team: string;
  role: Role;
};

function getDefaultSessionForm(state: AppState): SessionFormState {
  const firstMember = state.users.find((user) => user.role === "member") ?? state.users[0];
  return {
    userId: firstMember?.id ?? "",
    startAt: "2026-04-28T08:00",
    endAt: "2026-04-28T12:00",
    hourlyRate: String(state.settings.defaultHourlyRate),
    adenaRate: String(state.settings.defaultAdenaRate),
    adenaUnit: String(state.settings.defaultAdenaUnit),
    startAdena: "0",
    endAdena: "0",
    note: ""
  };
}

function getDefaultPaymentForm(state: AppState): PaymentFormState {
  const firstMember = state.users.find((user) => user.role === "member") ?? state.users[0];
  return {
    userId: firstMember?.id ?? "",
    amount: "",
    paidAt: "2026-04-28T18:00",
    note: ""
  };
}

export function DashboardApp() {
  const [state, setState] = useState<AppState>(seedState);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [loginUserId, setLoginUserId] = useState(seedState.users[0].id);
  const [pin, setPin] = useState("");
  const [sessionForm, setSessionForm] = useState<SessionFormState>(getDefaultSessionForm(seedState));
  const [paymentForm, setPaymentForm] = useState<PaymentFormState>(getDefaultPaymentForm(seedState));
  const [userForm, setUserForm] = useState<UserFormState>({
    name: "",
    username: "",
    pin: "",
    team: "",
    role: "member"
  });
  const [settingsMessage, setSettingsMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const savedState = window.localStorage.getItem(storageKey);
    if (savedState) {
      const parsed = JSON.parse(savedState) as AppState;
      setState(parsed);
      setSessionForm(getDefaultSessionForm(parsed));
      setPaymentForm(getDefaultPaymentForm(parsed));
      setLoginUserId(parsed.users[0]?.id ?? "");
    }

    const savedUser = window.localStorage.getItem(currentUserKey);
    if (savedUser) {
      setCurrentUserId(savedUser);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    if (currentUserId) {
      window.localStorage.setItem(currentUserKey, currentUserId);
    } else {
      window.localStorage.removeItem(currentUserKey);
    }
  }, [currentUserId]);

  const currentUser = state.users.find((user) => user.id === currentUserId) ?? null;
  const isAdmin = currentUser?.role === "admin";

  const summaries = useMemo(() => buildUserSummaries(state), [state]);
  const dailySeries = useMemo(() => buildDailySeries(state), [state]);
  const weeklyRanking = useMemo(() => buildWeeklyRanking(state), [state]);
  const leaderboard = useMemo(() => buildLeaderboardDelta(state), [state]);

  const mine = currentUser?.role === "member" ? summaries.find((summary) => summary.userId === currentUser.id) : null;
  const mySessions = currentUser?.role === "member" ? state.sessions.filter((session) => session.userId === currentUser.id) : [];

  const totalAdena = summaries.reduce((sum, summary) => sum + summary.totalAdena, 0);
  const totalGross = summaries.reduce((sum, summary) => sum + summary.grossIncome, 0);
  const totalPaid = summaries.reduce((sum, summary) => sum + summary.paidAmount, 0);
  const previewSession = {
    id: "preview",
    userId: sessionForm.userId,
    startAt: `${sessionForm.startAt}:00+07:00`,
    endAt: `${sessionForm.endAt}:00+07:00`,
    hourlyRate: Number(sessionForm.hourlyRate) || 0,
    adenaRate: Number(sessionForm.adenaRate) || 0,
    adenaUnit: Number(sessionForm.adenaUnit) || 1,
    startAdena: Number(sessionForm.startAdena) || 0,
    endAdena: Number(sessionForm.endAdena) || 0,
    note: sessionForm.note
  };

  function handleLogin() {
    const user = state.users.find((item) => item.id === loginUserId);
    if (!user || user.pin !== pin) {
      setErrorMessage("Sai tài khoản hoặc mã PIN.");
      return;
    }
    setErrorMessage("");
    setPin("");
    setCurrentUserId(user.id);
  }

  function handleLogout() {
    setCurrentUserId("");
  }

  function addSession() {
    if (!sessionForm.userId) {
      setErrorMessage("Chưa chọn Thành viên.");
      return;
    }

    setState((current) => ({
      ...current,
      sessions: [
        {
          id: createId("session"),
          userId: sessionForm.userId,
          startAt: `${sessionForm.startAt}:00+07:00`,
          endAt: `${sessionForm.endAt}:00+07:00`,
          hourlyRate: Number(sessionForm.hourlyRate) || 0,
          adenaRate: Number(sessionForm.adenaRate) || current.settings.defaultAdenaRate,
          adenaUnit: Number(sessionForm.adenaUnit) || current.settings.defaultAdenaUnit,
          startAdena: Number(sessionForm.startAdena) || 0,
          endAdena: Number(sessionForm.endAdena) || 0,
          note: sessionForm.note
        },
        ...current.sessions
      ]
    }));

    setSessionForm(getDefaultSessionForm(state));
    setSettingsMessage("Đã thêm ca cày và tính công tự động.");
    setErrorMessage("");
  }

  function addPayment() {
    if (!paymentForm.userId || !paymentForm.amount) {
      setErrorMessage("Thiếu người nhận hoặc số tiền thanh toán.");
      return;
    }

    setState((current) => ({
      ...current,
      payments: [
        {
          id: createId("payment"),
          userId: paymentForm.userId,
          amount: Number(paymentForm.amount) || 0,
          paidAt: `${paymentForm.paidAt}:00+07:00`,
          note: paymentForm.note
        },
        ...current.payments
      ]
    }));

    setPaymentForm(getDefaultPaymentForm(state));
    setSettingsMessage("Đã ghi nhận thanh toán.");
    setErrorMessage("");
  }

  function addUser() {
    if (!userForm.name || !userForm.username || !userForm.pin) {
      setErrorMessage("Cần nhập tên, tài khoản và PIN.");
      return;
    }

    if (state.users.some((user) => user.username === userForm.username)) {
      setErrorMessage("Tên đăng nhập đã tồn tại.");
      return;
    }

    setState((current) => ({
      ...current,
      users: [
        ...current.users,
        {
          id: createId("user"),
          name: userForm.name,
          username: userForm.username,
          pin: userForm.pin,
          role: userForm.role,
          team: userForm.team || "Chưa phân tổ",
          active: true
        }
      ]
    }));

    setUserForm({
      name: "",
      username: "",
      pin: "",
      team: "",
      role: "member"
    });
    setSettingsMessage("Đã thêm tài khoản mới.");
    setErrorMessage("");
  }

  function updateSettings(field: "defaultAdenaRate" | "defaultAdenaUnit" | "defaultHourlyRate", value: string) {
    setState((current) => ({
      ...current,
      settings: {
        ...current.settings,
        [field]: Number(value) || 0
      }
    }));
  }

  if (!currentUser) {
    return (
      <main className="shell">
        <section className="hero">
          <div>
            <span className="badge">Adena Payroll</span>
            <h1>Hệ thống tính công cày Adena, thanh toán và xếp hạng theo ngày.</h1>
            <p>
              Bản dựng này có khu vực admin để nhập ca cày, cấu hình rate Adena, thanh toán và thêm tài khoản; người dùng thường
              xem được kết quả cá nhân, leaderboard tuần và biểu đồ hiệu suất.
            </p>
          </div>
          <div className="card login-card">
            <h2>Đăng nhập</h2>
            <label>
              Tài khoản
              <select value={loginUserId} onChange={(event) => setLoginUserId(event.target.value)}>
                {state.users.map((user) => (
                  <option value={user.id} key={user.id}>
                    {user.name} ({user.username})
                  </option>
                ))}
              </select>
            </label>
            <label>
              PIN
              <input type="password" value={pin} onChange={(event) => setPin(event.target.value)} placeholder="Ví dụ 1234" />
            </label>
            <button onClick={handleLogin}>Vào hệ thống</button>
            {errorMessage ? <p className="error-text">{errorMessage}</p> : null}
            <div className="hint-box">
              <strong>Tài khoản mẫu</strong>
              <span>`admin / 1234`</span>
              <span>`nv01 / 1111`</span>
              <span>`nv02 / 2222`</span>
              <span>`nv03 / 3333`</span>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="shell">
      <section className="hero compact">
        <div>
          <span className="badge">{isAdmin ? "Quyền admin" : "Tài khoản Thành viên"}</span>
          <h1>Dashboard công cày Adena</h1>
          <p>
            {currentUser.name} đang đăng nhập. Toàn bộ người dùng xem được bảng xếp hạng tuần, biểu đồ theo ngày; admin có thêm
            quyền nhập ca cày, payment và tạo tài khoản.
          </p>
        </div>
        <div className="actions">
          <button className="secondary-button" onClick={handleLogout}>
            Đăng xuất
          </button>
        </div>
      </section>

      <section className="metrics-grid">
        <Card title="Tổng Adena toàn đội" value={formatNumber(totalAdena)} meta={`${summaries.length} Thành viên đang hoạt động`} />
        <Card title="Tổng tiền công" value={formatCurrency(totalGross)} meta="Tính từ ca cày + rate hiện tại" />
        <Card title="Đã thanh toán" value={formatCurrency(totalPaid)} meta={formatCurrency(totalGross - totalPaid) + " còn lại"} />
        <Card title="Bảng xếp hạng tuần" value={weeklyRanking[0]?.name ?? "Chưa có"} meta={`${formatNumber(weeklyRanking[0]?.totalAdena ?? 0)} Adena`} />
      </section>

      {mine ? (
        <section className="card personal-card">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Tổng quan cá nhân</span>
              <h2>{mine.name}</h2>
            </div>
            <span className="team-chip">{mine.team}</span>
          </div>
          <div className="personal-stats">
            <div>
              <span className="muted">Adena đã kiếm</span>
              <strong>{formatNumber(mine.totalAdena)}</strong>
            </div>
            <div>
              <span className="muted">Tổng tiền công</span>
              <strong>{formatCurrency(mine.grossIncome)}</strong>
            </div>
            <div>
              <span className="muted">Đã thanh toán</span>
              <strong>{formatCurrency(mine.paidAmount)}</strong>
            </div>
            <div>
              <span className="muted">Còn lại</span>
              <strong>{formatCurrency(mine.remainingAmount)}</strong>
            </div>
          </div>
        </section>
      ) : null}

      <section className="two-column">
        <div className="card">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Biểu đồ ngày</span>
              <h2>Adena kiếm theo ngày</h2>
            </div>
          </div>
          <LineChart values={dailySeries.map((item) => item.totalAdena)} color="#d97132" />
          <div className="legend-row">
            {dailySeries.map((item) => (
              <span key={item.day}>
                {formatDate(item.day)}: {formatNumber(item.totalAdena)}
              </span>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="section-heading">
            <div>
              <span className="eyebrow">So sánh tuần</span>
              <h2>Leaderboard tuần hiện tại</h2>
            </div>
          </div>
          <BarChart labels={weeklyRanking.map((item) => item.name)} values={weeklyRanking.map((item) => item.totalAdena)} color="#0f766e" />
        </div>
      </section>

      <section className="two-column">
        <div className="card">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Bảng xếp hạng</span>
              <h2>Xếp hạng Thành viên cày</h2>
            </div>
          </div>
          <div className="ranking-list">
            {leaderboard.map((item, index) => (
              <div key={item.userId} className="ranking-item">
                <div>
                  <strong>
                    #{index + 1} {item.name}
                  </strong>
                  <span className="muted">
                    {item.team} · {formatCurrency(item.grossIncome)}
                  </span>
                </div>
                <div className="progress-box">
                  <span>{formatNumber(item.totalAdena)} Adena</span>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${item.progressPercent}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Lịch sử của tôi</span>
              <h2>Ca cày và số liệu đã ghi</h2>
            </div>
          </div>
          <div className="session-table">
            <div className="session-row session-header">
              <span>Bắt đầu</span>
              <span>Kết thúc</span>
              <span>Adena</span>
              <span>Tiền công</span>
            </div>
            {mySessions.map((session) => (
              <div className="session-row" key={session.id}>
                <span>{formatDateTime(session.startAt)}</span>
                <span>{formatDateTime(session.endAt)}</span>
                <span>{formatNumber(getSessionAdena(session))}</span>
                <span>{formatCurrency(getSessionIncome(session))}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {isAdmin ? (
        <section className="admin-grid">
          <div className="card">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Admin</span>
                <h2>Thêm ca cày</h2>
              </div>
            </div>
            <div className="form-grid">
              <label>
                Thành viên
                <select value={sessionForm.userId} onChange={(event) => setSessionForm((current) => ({ ...current, userId: event.target.value }))}>
                  {state.users
                    .filter((user) => user.role === "member")
                    .map((user) => (
                      <option value={user.id} key={user.id}>
                        {user.name}
                      </option>
                    ))}
                </select>
              </label>
              <label>
                Bắt đầu
                <input
                  type="datetime-local"
                  value={sessionForm.startAt}
                  onChange={(event) => setSessionForm((current) => ({ ...current, startAt: event.target.value }))}
                />
              </label>
              <label>
                Kết thúc
                <input
                  type="datetime-local"
                  value={sessionForm.endAt}
                  onChange={(event) => setSessionForm((current) => ({ ...current, endAt: event.target.value }))}
                />
              </label>
              <label>
                Lương theo giờ
                <input
                  type="number"
                  value={sessionForm.hourlyRate}
                  onChange={(event) => setSessionForm((current) => ({ ...current, hourlyRate: event.target.value }))}
                />
              </label>
              <label>
                Rate Adena
                <input
                  type="number"
                  value={sessionForm.adenaRate}
                  onChange={(event) => setSessionForm((current) => ({ ...current, adenaRate: event.target.value }))}
                />
              </label>
              <label>
                Đơn vị rate
                <input
                  type="number"
                  value={sessionForm.adenaUnit}
                  onChange={(event) => setSessionForm((current) => ({ ...current, adenaUnit: event.target.value }))}
                />
              </label>
              <label>
                Số Adena đầu
                <input
                  type="number"
                  value={sessionForm.startAdena}
                  onChange={(event) => setSessionForm((current) => ({ ...current, startAdena: event.target.value }))}
                />
              </label>
              <label>
                Số Adena cuối
                <input
                  type="number"
                  value={sessionForm.endAdena}
                  onChange={(event) => setSessionForm((current) => ({ ...current, endAdena: event.target.value }))}
                />
              </label>
              <label className="full-span">
                Ghi chú
                <textarea value={sessionForm.note} onChange={(event) => setSessionForm((current) => ({ ...current, note: event.target.value }))} />
              </label>
            </div>
            <div className="preview-box">
              <span>Giờ công: {formatNumber(getSessionHours(previewSession))}</span>
              <span>Adena kiếm được: {formatNumber(Math.max((Number(sessionForm.endAdena) || 0) - (Number(sessionForm.startAdena) || 0), 0))}</span>
              <span>Tiền công tạm tính: {formatCurrency(getSessionIncome(previewSession))}</span>
            </div>
            <button onClick={addSession}>Lưu ca cày</button>
          </div>

          <div className="card">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Admin</span>
                <h2>Ghi nhận thanh toán</h2>
              </div>
            </div>
            <div className="form-grid">
              <label>
                Thành viên
                <select value={paymentForm.userId} onChange={(event) => setPaymentForm((current) => ({ ...current, userId: event.target.value }))}>
                  {state.users
                    .filter((user) => user.role === "member")
                    .map((user) => (
                      <option value={user.id} key={user.id}>
                        {user.name}
                      </option>
                    ))}
                </select>
              </label>
              <label>
                Số tiền đã thanh toán
                <input
                  type="number"
                  value={paymentForm.amount}
                  onChange={(event) => setPaymentForm((current) => ({ ...current, amount: event.target.value }))}
                />
              </label>
              <label>
                Thời gian thanh toán
                <input
                  type="datetime-local"
                  value={paymentForm.paidAt}
                  onChange={(event) => setPaymentForm((current) => ({ ...current, paidAt: event.target.value }))}
                />
              </label>
              <label className="full-span">
                Ghi chú
                <textarea value={paymentForm.note} onChange={(event) => setPaymentForm((current) => ({ ...current, note: event.target.value }))} />
              </label>
            </div>
            <button onClick={addPayment}>Lưu thanh toán</button>
          </div>

          <div className="card">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Admin</span>
                <h2>Thêm tài khoản</h2>
              </div>
            </div>
            <div className="form-grid">
              <label>
                Họ tên
                <input value={userForm.name} onChange={(event) => setUserForm((current) => ({ ...current, name: event.target.value }))} />
              </label>
              <label>
                Username
                <input value={userForm.username} onChange={(event) => setUserForm((current) => ({ ...current, username: event.target.value }))} />
              </label>
              <label>
                PIN
                <input value={userForm.pin} onChange={(event) => setUserForm((current) => ({ ...current, pin: event.target.value }))} />
              </label>
              <label>
                Tổ làm việc
                <input value={userForm.team} onChange={(event) => setUserForm((current) => ({ ...current, team: event.target.value }))} />
              </label>
              <label>
                Quyền
                <select value={userForm.role} onChange={(event) => setUserForm((current) => ({ ...current, role: event.target.value as Role }))}>
                  <option value="member">Thành viên</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
            </div>
            <button onClick={addUser}>Tạo tài khoản</button>
          </div>

          <div className="card">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Thiết lập</span>
                <h2>Cấu hình mặc định</h2>
              </div>
            </div>
            <div className="form-grid">
              <label>
                Rate Adena mặc định
                <input
                  type="number"
                  value={state.settings.defaultAdenaRate}
                  onChange={(event) => updateSettings("defaultAdenaRate", event.target.value)}
                />
              </label>
              <label>
                Đơn vị Adena mặc định
                <input
                  type="number"
                  value={state.settings.defaultAdenaUnit}
                  onChange={(event) => updateSettings("defaultAdenaUnit", event.target.value)}
                />
              </label>
              <label>
                Lương giờ mặc định
                <input
                  type="number"
                  value={state.settings.defaultHourlyRate}
                  onChange={(event) => updateSettings("defaultHourlyRate", event.target.value)}
                />
              </label>
            </div>
            <p className="muted">
              Công thức hiện tại: `tiền công = (Adena kiếm được / đơn vị Adena) x rate Adena + (tổng giờ x lương giờ)`.
            </p>
            <p className="muted">
              Seed mẫu dùng `25.000 VND / 16.666,67 Adena` để khớp số tiền trong bảng bạn gửi.
            </p>
          </div>
        </section>
      ) : null}

      <section className="card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Toàn bộ ca đã nhập</span>
            <h2>Danh sách công cày</h2>
          </div>
        </div>
        <div className="session-table">
          <div className="session-row session-header wide">
            <span>Thành viên</span>
            <span>Bắt đầu</span>
            <span>Kết thúc</span>
            <span>Giờ</span>
            <span>Rate</span>
            <span>Số đầu</span>
            <span>Số cuối</span>
            <span>Coin kiếm</span>
            <span>Tiền công</span>
          </div>
          {state.sessions.map((session) => {
            const user = state.users.find((item) => item.id === session.userId) as User | undefined;
            return (
              <div className="session-row wide" key={session.id}>
                <span>{user?.name ?? "Không rõ"}</span>
                <span>{formatDateTime(session.startAt)}</span>
                <span>{formatDateTime(session.endAt)}</span>
                <span>{formatNumber(getSessionHours(session))}</span>
                <span>{formatNumber(session.adenaRate)}</span>
                <span>{formatNumber(session.startAdena)}</span>
                <span>{formatNumber(session.endAdena)}</span>
                <span>{formatNumber(getSessionAdena(session))}</span>
                <span>{formatCurrency(getSessionIncome(session))}</span>
              </div>
            );
          })}
        </div>
        {settingsMessage ? <p className="success-text">{settingsMessage}</p> : null}
        {errorMessage ? <p className="error-text">{errorMessage}</p> : null}
      </section>
    </main>
  );
}
