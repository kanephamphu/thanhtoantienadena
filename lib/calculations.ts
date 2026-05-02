import { AppState, DailySeriesItem, PaymentRecord, UserSummary, WorkSession } from "@/lib/types";

const millisecondsPerHour = 1000 * 60 * 60;

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

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short"
  }).format(new Date(value));
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
    const day = session.startAt.slice(0, 10);
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
    const day = session.startAt.slice(0, 10);
    
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
  const now = new Date();
  const currentWeekStart = new Date(now);
  currentWeekStart.setHours(0, 0, 0, 0);
  currentWeekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));

  const currentWeekSessions = state.sessions.filter((session) => new Date(session.startAt) >= currentWeekStart);

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
