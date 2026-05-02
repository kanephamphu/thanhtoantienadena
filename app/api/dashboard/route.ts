import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { 
  buildUserSummaries, 
  buildDailySeries, 
  buildUserDailyData,
  buildWeeklyRanking, 
  buildLeaderboardDelta,
  parseVNTDateEnd,
  parseVNTDateStart
} from "@/lib/calculations";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const fromDate = from ? parseVNTDateStart(from) : null;
    const toDate = to ? parseVNTDateEnd(to) : null;

    const dateFilter = fromDate && toDate
      ? {
          startAt: {
            gte: fromDate,
            lte: toDate
          }
        }
      : {};

    const paymentFilter = fromDate && toDate
      ? {
          paidAt: {
            gte: fromDate,
            lte: toDate
          }
        }
      : {};
    
    const users = await prisma.user.findMany({
      where: { active: true },
    });
    
    const sessions = await prisma.workSession.findMany({
      where: dateFilter,
      orderBy: { startAt: "desc" },
    });
    
    const payments = await prisma.paymentRecord.findMany({
      where: paymentFilter,
      orderBy: { paidAt: "desc" },
    });
    
    const settings = await prisma.globalSetting.findMany();
    
    const appState = {
      users: users.map(u => ({
        id: u.id,
        name: u.name,
        username: u.username,
        pin: u.pin,
        avatar: u.avatar ?? undefined,
        role: u.role as any,
        team: u.team,
        active: u.active
      })),
      sessions: sessions.map(s => ({
        id: s.id,
        userId: s.userId,
        startAt: s.startAt.toISOString(),
        endAt: s.endAt.toISOString(),
        hourlyRate: s.hourlyRate,
        adenaRate: s.adenaRate,
        adenaUnit: s.adenaUnit,
        startAdena: s.startAdena,
        endAdena: s.endAdena,
        note: s.note || ""
      })),
      payments: payments.map(p => ({
        id: p.id,
        userId: p.userId,
        amount: p.amount,
        paidAt: p.paidAt.toISOString(),
        note: p.note || ""
      })),
      settings: {
        defaultHourlyRate: Number(settings.find(s => s.key === "defaultHourlyRate")?.value) || 20000,
        defaultAdenaRate: Number(settings.find(s => s.key === "defaultAdenaRate")?.value) || 25000,
        defaultAdenaUnit: Number(settings.find(s => s.key === "defaultAdenaUnit")?.value) || 16666.67,
        defaultSharePercentage: Number(settings.find(s => s.key === "defaultSharePercentage")?.value) || 60,
        currency: "VND" as const
      }
    };
    
    const summaries = buildUserSummaries(appState);
    const dailySeries = buildDailySeries(appState);
    const userDailyData = buildUserDailyData(appState);
    const weeklyRanking = buildWeeklyRanking(appState);
    const leaderboard = buildLeaderboardDelta(appState);
    
    return NextResponse.json({
      users: appState.users.filter(u => u.role === "member"),
      settings: appState.settings,
      summaries,
      dailySeries,
      userDailyData,
      weeklyRanking,
      leaderboard,
      totalStats: {
        totalAdena: summaries.reduce((sum, s) => sum + s.totalAdena, 0),
        totalGross: summaries.reduce((sum, s) => sum + s.grossIncome, 0),
        totalPaid: summaries.reduce((sum, s) => sum + s.paidAmount, 0),
      }
    });
  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
