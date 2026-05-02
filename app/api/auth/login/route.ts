import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { username, pin } = await request.json();
    
    const user = await prisma.user.findUnique({
      where: { username }
    });
    
    if (!user || user.pin !== pin) {
      return NextResponse.json({ error: "Sai tài khoản hoặc mã PIN" }, { status: 401 });
    }
    
    // In a real app, we would set a cookie/session here. 
    // For this simple business logic, we'll return user info and handle it in localStorage on the client.
    return NextResponse.json({
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      team: user.team
    });
  } catch (error) {
    return NextResponse.json({ error: "Lỗi đăng nhập" }, { status: 500 });
  }
}
