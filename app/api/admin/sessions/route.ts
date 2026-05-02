import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const sessions = await prisma.workSession.findMany({
      include: { user: true },
      orderBy: { startAt: "desc" }
    });
    return NextResponse.json(sessions);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, startAt, endAt, hourlyRate, adenaRate, adenaUnit, startAdena, endAdena, note } = body;
    
    const session = await prisma.workSession.create({
      data: {
        userId,
        startAt: new Date(startAt),
        endAt: new Date(endAt),
        hourlyRate: Number(hourlyRate),
        adenaRate: Number(adenaRate),
        adenaUnit: Number(adenaUnit),
        startAdena: Number(startAdena),
        endAdena: Number(endAdena),
        note
      }
    });
    
    return NextResponse.json(session);
  } catch (error) {
    console.error("Create Session Error:", error);
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
}
