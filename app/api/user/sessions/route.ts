import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    
    if (!userId) {
      return NextResponse.json({ error: "Thiếu userId" }, { status: 400 });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        sessions: {
          orderBy: { startAt: "desc" }
        },
        payments: {
          orderBy: { paidAt: "desc" }
        }
      }
    });
    
    if (!user) {
      return NextResponse.json({ error: "Không tìm thấy người dùng" }, { status: 404 });
    }
    
    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: "Lỗi lấy dữ liệu" }, { status: 500 });
  }
}
