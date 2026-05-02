import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, amount, paidAt, note } = body;
    
    const payment = await prisma.paymentRecord.create({
      data: {
        userId,
        amount: Number(amount),
        paidAt: new Date(paidAt),
        note
      }
    });
    
    return NextResponse.json(payment);
  } catch (error) {
    return NextResponse.json({ error: "Failed to record payment" }, { status: 500 });
  }
}
