import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseVNTDateTime } from "@/lib/calculations";

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

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    
    await prisma.workSession.delete({
      where: { id }
    });
    
    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, startAt, endAt, hourlyRate, adenaRate, adenaUnit, startAdena, endAdena, note, isPaid } = body;
    
    const session = await prisma.workSession.create({
      data: {
        userId,
        startAt: parseVNTDateTime(startAt),
        endAt: parseVNTDateTime(endAt),
        hourlyRate: Number(hourlyRate),
        adenaRate: Number(adenaRate),
        adenaUnit: Number(adenaUnit),
        startAdena: Number(startAdena),
        endAdena: Number(endAdena),
        note,
        isPaid: Boolean(isPaid)
      }
    });
    
    return NextResponse.json(session);
  } catch (error) {
    console.error("Create Session Error:", error);
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
}
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, userId, startAt, endAt, hourlyRate, adenaRate, adenaUnit, startAdena, endAdena, note, isPaid } = body;
    
    const session = await prisma.workSession.update({
      where: { id },
      data: {
        userId,
        startAt: parseVNTDateTime(startAt),
        endAt: parseVNTDateTime(endAt),
        hourlyRate: Number(hourlyRate),
        adenaRate: Number(adenaRate),
        adenaUnit: Number(adenaUnit),
        startAdena: Number(startAdena),
        endAdena: Number(endAdena),
        note,
        isPaid: Boolean(isPaid)
      }
    });
    
    return NextResponse.json(session);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
