"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Coins, Download, ExternalLink, TrendingUp, Users } from "lucide-react";
import { EarningsChart } from "@/components/dashboard/EarningsChart";
import { Leaderboard } from "@/components/dashboard/Leaderboard";
import { StatCard } from "@/components/dashboard/StatCard";
import { addDaysToDateKey, formatCurrency, formatDisplayDateKey, formatNumber, formatVNTDateInput } from "@/lib/calculations";
import { DailySeriesItem, UserDailySeriesMap } from "@/lib/types";

type DashboardUser = {
  id: string;
  name: string;
  team: string;
};

type DashboardLeaderboardItem = {
  userId: string;
  name: string;
  team: string;
  avatar?: string;
  totalAdena: number;
  totalHours: number;
  grossIncome: number;
  paidAmount: number;
  remainingAmount: number;
  sessionCount: number;
  progressPercent: number;
};

type DashboardResponse = {
  users: DashboardUser[];
  settings: {
    defaultHourlyRate: number;
    defaultAdenaRate: number;
    defaultAdenaUnit: number;
    defaultSharePercentage: number;
    currency: "VND";
  };
  summaries: Array<{ userId: string }>;
  dailySeries: DailySeriesItem[];
  userDailyData: UserDailySeriesMap;
  leaderboard: DashboardLeaderboardItem[];
  totalStats: {
    totalAdena: number;
    totalGross: number;
    totalPaid: number;
  };
};

const chartPalette = ["#f59e0b", "#38bdf8", "#34d399", "#f87171", "#a78bfa", "#f472b6"];
const chartDashPatterns = ["0", "8 4", "3 4", "10 6", "2 6", "12 4 3 4"];

// formatVNTDateInput imported from lib/calculations.ts

function formatDisplayDay(value: string) {
  return formatDisplayDateKey(value, true);
}

function buildDateRange(start: string, end: string) {
  const result: string[] = [];
  let current = start;

  while (current <= end) {
    result.push(current);
    current = addDaysToDateKey(current, 1);
  }

  return result;
}

function formatShareRatio(percentage: number) {
  const mine = percentage / 10;
  const other = (100 - percentage) / 10;
  return `${Number.isInteger(mine) ? mine.toFixed(0) : mine.toFixed(1)}/${Number.isInteger(other) ? other.toFixed(0) : other.toFixed(1)}`;
}

export default function PublicDashboard() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState("all");
  const [from, setFrom] = useState(() => {
    const today = formatVNTDateInput();
    return addDaysToDateKey(today, -7);
  });
  const [to, setTo] = useState(() => formatVNTDateInput());

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/dashboard?from=${from}&to=${to}`);
        const json = (await res.json()) as DashboardResponse;
        setData(json);
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [from, to]);

  if (loading) {
    return (
      <div className="shell" style={{ display: "grid", placeItems: "center", minHeight: "80vh" }}>
        <div className="text-accent" style={{ fontSize: "1.5rem", fontWeight: 700 }}>Đang tải dữ liệu...</div>
      </div>
    );
  }

  if (!data) {
    return <div className="shell">Error loading data.</div>;
  }

  const dashboardData = data;
  const selectedUser = dashboardData.users.find((user) => user.id === selectedUserId) ?? null;
  const selectedSeries = selectedUser ? dashboardData.userDailyData[selectedUser.id] ?? [] : dashboardData.dailySeries;
  const selectedLeaderboardItem = selectedUser
    ? dashboardData.leaderboard.find((item) => item.userId === selectedUser.id) ?? null
    : null;
  const dateRange = buildDateRange(from, to);
  const chartLines = selectedUser
      ? [
        {
          key: selectedUser.id,
          label: selectedUser.name,
          color: chartPalette[0],
          dashArray: chartDashPatterns[0]
        }
      ]
    : dashboardData.users.map((user, index) => ({
        key: user.id,
        label: user.name,
        color: chartPalette[index % chartPalette.length],
        dashArray: chartDashPatterns[index % chartDashPatterns.length]
      }));
  const chartData = selectedUser
    ? dateRange.map((day) => {
        const item = selectedSeries.find((seriesItem) => seriesItem.day === day);
        return {
          day,
          [selectedUser.id]: item?.totalAdena ?? 0
        };
      })
    : dateRange.map((day) => {
        const row: Record<string, number | string> = { day };
        dashboardData.users.forEach((user) => {
          const item = dashboardData.userDailyData[user.id]?.find((seriesItem) => seriesItem.day === day);
          row[user.id] = item?.totalAdena ?? 0;
        });
        return row;
      });
  const chartTitle = selectedUser ? `Hiệu suất cày của ${selectedUser.name}` : "Hiệu suất cày toàn đội";
  const chartSubtitle = selectedUser
    ? `Dữ liệu hằng ngày của ${selectedUser.name} trong khoảng ${formatDisplayDay(from)} - ${formatDisplayDay(to)}`
    : `So sánh Adena hằng ngày của từng thành viên trong khoảng ${formatDisplayDay(from)} - ${formatDisplayDay(to)}`;
  const statAdenaValue = selectedLeaderboardItem?.totalAdena ?? dashboardData.totalStats.totalAdena;
  const statGrossValue = dashboardData.settings.defaultAdenaUnit > 0
    ? Math.round((statAdenaValue / dashboardData.settings.defaultAdenaUnit) * dashboardData.settings.defaultAdenaRate)
    : 0;
  const currentShareText = formatShareRatio(dashboardData.settings.defaultSharePercentage);
  const statAdenaMeta = selectedUser ? selectedUser.name : "Tất cả thành viên";
  const statGrossMeta = selectedUser
    ? `Số tạm tính của ${selectedUser.name} • Rate hiện tại: ${formatCurrency(dashboardData.settings.defaultAdenaRate)} cho ${formatNumber(dashboardData.settings.defaultAdenaUnit)} Adena • Tỉ lệ chia hiện tại: ${currentShareText}`
    : `Số tạm tính theo cấu hình hiện tại • Rate: ${formatCurrency(dashboardData.settings.defaultAdenaRate)} cho ${formatNumber(dashboardData.settings.defaultAdenaUnit)} Adena • Tỉ lệ chia: ${currentShareText}`;

  function handleExportCsv() {
    const rows = selectedUser
      ? [
          ["Ngay", "Thanh vien", "Team", "Tong Adena", "Tong tien cong"],
          ...selectedSeries.map((item) => [
            item.day,
            selectedUser.name,
            selectedUser.team,
            String(item.totalAdena),
            String(item.totalIncome)
          ])
        ]
      : [
          ["Ngay", "Thanh vien", "Team", "Tong Adena", "Tong tien cong"],
          ...dateRange.flatMap((day) =>
            dashboardData.users.map((user) => {
              const item = dashboardData.userDailyData[user.id]?.find((seriesItem) => seriesItem.day === day);
              return [
                day,
                user.name,
                user.team,
                String(item?.totalAdena ?? 0),
                String(item?.totalIncome ?? 0)
              ];
            })
          )
        ];

    const csvContent = rows
      .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
      .join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const slug = (selectedUser?.name ?? "toan-doi").toLowerCase().trim().replaceAll(/\s+/g, "-");
    link.href = url;
    link.download = `adena-${slug}-${from}-to-${to}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <main className="shell">
      <header className="hero animate-fade-in">
        <div className="public-hero-chip">
          L2 ADENA SYSTEM
        </div>
        <h1>Thống kê & Bảng xếp hạng</h1>
        <p>Theo dõi hiệu suất cày Adena của các thành viên trong nhóm theo thời gian thực.</p>

        <div className="dashboard-toolbar">
          <div className="dashboard-filter-group public-filter-panel">
            <div>
              <label className="public-filter-label">Từ ngày</label>
              <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div>
              <label className="public-filter-label">Đến ngày</label>
              <input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} />
            </div>
            <div>
              <label className="public-filter-label">Thành viên</label>
              <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)}>
                <option value="all">Toàn đội</option>
                {dashboardData.users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="public-filter-label">Xuất dữ liệu</label>
              <button className="secondary" onClick={handleExportCsv}>
                <Download size={18} />
                Export CSV
              </button>
            </div>
          </div>

          <div className="page-actions public-cta-row">
            <Link href="/login" className="button-link" style={{ padding: "10px 20px" }}>
              Đăng nhập <ChevronRight size={18} />
            </Link>
            <a
              href="https://chogem.com/trends?game=lineage_classic&server=24613"
              target="_blank"
              rel="noopener noreferrer"
              className="button-link secondary"
              style={{ padding: "10px 20px" }}
            >
              Xem coins <ExternalLink size={18} />
            </a>
            <Link href="/admin" className="button-link secondary" style={{ padding: "10px 20px" }}>
              Admin
            </Link>
          </div>
        </div>
      </header>

      <section className="stats-grid">
        <StatCard
          label="Tổng Adena Kiếm Được"
          value={formatNumber(statAdenaValue)}
          icon={Coins}
          meta={statAdenaMeta}
        />
        <StatCard
          label="Tổng Tiền Công"
          value={formatCurrency(statGrossValue)}
          icon={TrendingUp}
          meta={statGrossMeta}
        />
        <StatCard
          label="Tổng Thành Viên"
          value={dashboardData.summaries.length}
          icon={Users}
          meta="Đang hoạt động"
        />
      </section>

      <div className="dashboard-content-grid">
        <section>
          <EarningsChart data={chartData} lines={chartLines} title={chartTitle} subtitle={chartSubtitle} />

          <div className="card" style={{ marginTop: "20px" }}>
            <div className="public-section-header">
              <div>
                <h3 className="font-heading" style={{ margin: 0 }}>Dữ liệu theo ngày</h3>
                <p className="text-muted" style={{ margin: "6px 0 0", fontSize: "0.9rem" }}>
                  {selectedUser ? `Chi tiết cày hằng ngày của ${selectedUser.name}` : "So sánh Adena theo ngày của từng thành viên"}
                </p>
              </div>
              <div className="text-muted public-date-range">
                {formatDisplayDay(from)} - {formatDisplayDay(to)}
              </div>
            </div>

            <div className="data-table-wrapper">
              <table className="data-table public-data-table">
                <thead>
                  <tr>
                    <th>Ngày</th>
                    {selectedUser ? (
                      <>
                        <th>Adena</th>
                        <th>Tiền công</th>
                      </>
                    ) : (
                      dashboardData.users.map((user) => (
                        <th key={user.id}>{user.name}</th>
                      ))
                    )}
                  </tr>
                </thead>
                <tbody>
                  {dateRange.map((day) => (
                    <tr key={`${selectedUserId}-${day}`}>
                      <td data-label="Ngày">{formatDisplayDay(day)}</td>
                      {selectedUser ? (
                        <>
                          <td data-label="Adena">{formatNumber(selectedSeries.find((item) => item.day === day)?.totalAdena ?? 0)}</td>
                          <td data-label="Tiền công">{formatCurrency(selectedSeries.find((item) => item.day === day)?.totalIncome ?? 0)}</td>
                        </>
                      ) : (
                        dashboardData.users.map((user) => (
                          <td key={`${day}-${user.id}`} data-label={user.name}>
                            {formatNumber(dashboardData.userDailyData[user.id]?.find((item) => item.day === day)?.totalAdena ?? 0)}
                          </td>
                        ))
                      )}
                    </tr>
                  ))}
                  {dateRange.length === 0 ? (
                    <tr>
                      <td colSpan={selectedUser ? 3 : dashboardData.users.length + 1} className="table-empty">Chưa có dữ liệu trong khoảng ngày đã chọn.</td>
                    </tr>
                  ) : null}
                  {selectedUser && selectedSeries.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="table-empty">Chưa có dữ liệu trong khoảng ngày đã chọn.</td>
                    </tr>
                  ) : null}
                  {!selectedUser && dashboardData.users.length === 0 ? (
                    <tr>
                      <td colSpan={1} className="table-empty">Chưa có thành viên để hiển thị.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section>
          <Leaderboard data={dashboardData.leaderboard} />
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
