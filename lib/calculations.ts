import { AppState, DailySeriesItem, PaymentRecord, UserSummary, WorkSession } from "@/lib/types";

const millisecondsPerHour = 1000 * 60 * 60;
export const VNT_TIME_ZONE = "Asia/Ho_Chi_Minh";
const VNT_OFFSET = "+07:00";

const vntDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: VNT_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
});

const vntDateTimeFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: VNT_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23"
});

const vntTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: VNT_TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23"
});

function toDate(value: string | Date) {
  return value instanceof Date ? value : new Date(value);
}

function getParts(
  formatter: Intl.DateTimeFormat,
  value: Date
) {
  const parts = formatter.formatToParts(value);
  return {
    year: parts.find((part) => part.type === "year")?.value ?? "0000",
    month: parts.find((part) => part.type === "month")?.value ?? "01",
    day: parts.find((part) => part.type === "day")?.value ?? "01",
    hour: parts.find((part) => part.type === "hour")?.value ?? "00",
    minute: parts.find((part) => part.type === "minute")?.value ?? "00"
  };
}

function normalizeVNTInput(value: string) {
  if (/[zZ]$|[+-]\d{2}:\d{2}$/.test(value)) {
    return value;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return `${value}T00:00:00${VNT_OFFSET}`;
  }

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
    return `${value}:00${VNT_OFFSET}`;
  }

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(value)) {
    return `${value}${VNT_OFFSET}`;
  }

  return value;
}

export function parseVNTDateTime(value: string) {
  return new Date(normalizeVNTInput(value));
}

export function parseVNTDateStart(value: string) {
  return parseVNTDateTime(`${value}T00:00:00`);
}

export function parseVNTDateEnd(value: string) {
  return parseVNTDateTime(`${value}T23:59:59.999`);
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0
  }).format(value);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 2
  }).format(value);
}

export function formatDateTime(value: string | Date) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: VNT_TIME_ZONE
  }).format(toDate(value));
}

export function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeZone: VNT_TIME_ZONE
  }).format(toDate(value));
}

export function formatTime(value: string | Date) {
  return vntTimeFormatter.format(toDate(value));
}

export function formatVNTDateInput(value: string | Date = new Date()) {
  const { year, month, day } = getParts(vntDateFormatter, toDate(value));
  return `${year}-${month}-${day}`;
}

export function formatVNTDateTimeInput(value: string | Date = new Date()) {
  const { year, month, day, hour, minute } = getParts(vntDateTimeFormatter, toDate(value));
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

export function formatDisplayDateKey(value: string, includeYear = false) {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) {
    return value;
  }

  return includeYear ? `${day}/${month}/${year}` : `${day}/${month}`;
}

export function toVNTDateKey(value: string | Date) {
  return formatVNTDateInput(value);
}

export function addDaysToDateKey(value: string, days: number) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

export function getCurrentVNTWeekStart(value: string | Date = new Date()) {
  const dateKey = formatVNTDateInput(value);
  const [year, month, day] = dateKey.split("-").map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  const offset = (weekday + 6) % 7;
  return addDaysToDateKey(dateKey, -offset);
}

export function getSessionHours(session: WorkSession) {
  const hours = (new Date(session.endAt).getTime() - new Date(session.startAt).getTime()) / millisecondsPerHour;
  return Number(Math.max(hours, 0).toFixed(2));
}

export function getSessionAdena(session: WorkSession) {
  return Math.max(session.endAdena - session.startAdena, 0);
}

export function getSessionIncome(session: WorkSession) {
  const adenaIncome = session.adenaUnit > 0 ? (getSessionAdena(session) / session.adenaUnit) * session.adenaRate : 0;
  const hourlyIncome = getSessionHours(session) * session.hourlyRate;
  return Math.round(adenaIncome + hourlyIncome);
}

export function getPaidAmountForUser(userId: string, payments: PaymentRecord[]) {
  return payments.filter((payment) => payment.userId === userId).reduce((sum, payment) => sum + payment.amount, 0);
}

export function buildUserSummaries(state: AppState): UserSummary[] {
  return state.users
    .filter((user) => user.active && user.role === "member")
    .map((user) => {
      const sessions = state.sessions.filter((session) => session.userId === user.id);
      const totalAdena = sessions.reduce((sum, session) => sum + getSessionAdena(session), 0);
      const totalHours = Number(sessions.reduce((sum, session) => sum + getSessionHours(session), 0).toFixed(2));
      const grossIncome = sessions.reduce((sum, session) => sum + getSessionIncome(session), 0);
      const paidAmount = getPaidAmountForUser(user.id, state.payments);

      return {
        userId: user.id,
        name: user.name,
        team: user.team,
        avatar: user.avatar,
        totalAdena,
        totalHours,
        grossIncome,
        paidAmount,
        remainingAmount: grossIncome - paidAmount,
        sessionCount: sessions.length
      };
    })
    .sort((left, right) => right.totalAdena - left.totalAdena);
}

export function buildDailySeries(state: AppState): DailySeriesItem[] {
  const dailyMap = new Map<string, DailySeriesItem>();

  state.sessions.forEach((session) => {
    const day = toVNTDateKey(session.startAt);
    const current = dailyMap.get(day) ?? {
      day,
      totalAdena: 0,
      totalIncome: 0
    };

    current.totalAdena += getSessionAdena(session);
    current.totalIncome += getSessionIncome(session);
    dailyMap.set(day, current);
  });

  return Array.from(dailyMap.values()).sort((left, right) => left.day.localeCompare(right.day));
}

export function buildUserDailyData(state: AppState) {
  const userDailyMap = new Map<string, Map<string, DailySeriesItem>>();

  state.sessions.forEach((session) => {
    const userId = session.userId;
    const day = toVNTDateKey(session.startAt);
    
    if (!userDailyMap.has(userId)) {
      userDailyMap.set(userId, new Map());
    }
    
    const dayMap = userDailyMap.get(userId)!;
    const current = dayMap.get(day) ?? {
      day,
      totalAdena: 0,
      totalIncome: 0
    };

    current.totalAdena += getSessionAdena(session);
    current.totalIncome += getSessionIncome(session);
    dayMap.set(day, current);
  });

  const result: Record<string, DailySeriesItem[]> = {};
  userDailyMap.forEach((dayMap, userId) => {
    result[userId] = Array.from(dayMap.values()).sort((left, right) => left.day.localeCompare(right.day));
  });
  
  return result;
}

export function buildWeeklyRanking(state: AppState) {
  const currentWeekStart = getCurrentVNTWeekStart();
  const currentWeekSessions = state.sessions.filter((session) => toVNTDateKey(session.startAt) >= currentWeekStart);

  return state.users
    .filter((user) => user.active && user.role === "member")
    .map((user) => {
      const sessions = currentWeekSessions.filter((session) => session.userId === user.id);
      return {
        userId: user.id,
        name: user.name,
        totalAdena: sessions.reduce((sum, session) => sum + getSessionAdena(session), 0),
        totalIncome: sessions.reduce((sum, session) => sum + getSessionIncome(session), 0)
      };
    })
    .sort((left, right) => right.totalAdena - left.totalAdena);
}

export function buildLeaderboardDelta(state: AppState) {
  const summaries = buildUserSummaries(state);
  if (summaries.length === 0) {
    return [];
  }

  const leaderAdena = summaries[0].totalAdena || 1;

  return summaries.map((summary) => ({
    ...summary,
    progressPercent: Math.round((summary.totalAdena / leaderAdena) * 100)
  }));
}
