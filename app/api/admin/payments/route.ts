import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const payments = await prisma.paymentRecord.findMany({
      include: { 
        user: true,
        sessions: true
      },
      orderBy: { paidAt: "desc" }
    });
    return NextResponse.json(payments);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, amount, paidAt, note, commission, percentage, sessionIds } = body;
    
    // Create payment and link to sessions
    const payment = await prisma.$transaction(async (tx) => {
      // 1. Create the payment record
      const record = await tx.paymentRecord.create({
        data: {
          userId,
          amount: Number(amount),
          paidAt: new Date(paidAt),
          note,
          commission: Number(commission),
          percentage: Number(percentage),
          sessions: {
            connect: sessionIds.map((id: string) => ({ id }))
          }
        }
      });
      
      // 2. Mark sessions as paid
      await tx.workSession.updateMany({
        where: {
          id: { in: sessionIds }
        },
        data: {
          isPaid: true
        }
      });
      
      return record;
    });
    
    return NextResponse.json(payment);
  } catch (error) {
    console.error("Payment Error:", error);
    return NextResponse.json({ error: "Failed to record payment" }, { status: 500 });
  }
}
