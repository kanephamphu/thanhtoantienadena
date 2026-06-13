import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { name: "asc" }
    });
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, username, pin, avatar, role, team, active } = body;
    
    const user = await prisma.user.create({
      data: {
        name,
        username,
        pin,
        avatar,
        role: role || "member",
        team: team || "General",
        active: active ?? true
      } as any
    });
    
    return NextResponse.json(user);
  } catch (error: any) {
    console.error("User Create Error:", error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Username already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create user: " + error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, username, pin, avatar, role, team, active } = body;

    const data: Record<string, unknown> = {};

    if (name !== undefined) data.name = name;
    if (username !== undefined) data.username = username;
    if (pin !== undefined) data.pin = pin;
    if (avatar !== undefined) data.avatar = avatar;
    if (role !== undefined) data.role = role;
    if (team !== undefined) data.team = team || "General";
    if (active !== undefined) data.active = Boolean(active);
    
    const user = await prisma.user.update({
      where: { id },
      data: data as any
    });
    
    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    
    await prisma.user.delete({
      where: { id }
    });
    
    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
