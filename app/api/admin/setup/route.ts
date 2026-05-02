import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Check if admin exists
    const admin = await prisma.user.findFirst({
      where: { username: "admin" }
    });
    
    if (!admin) {
      await prisma.user.create({
        data: {
          name: "Administrator",
          username: "admin",
          pin: "1234",
          role: "admin",
          team: "Management"
        }
      });
    }
    
    // Setup default settings
    const defaultSettings = [
      { key: "defaultHourlyRate", value: "20000" },
      { key: "defaultAdenaRate", value: "25000" },
      { key: "defaultAdenaUnit", value: "16666.67" },
      { key: "defaultSharePercentage", value: "60" }
    ];
    
    for (const setting of defaultSettings) {
      await prisma.globalSetting.upsert({
        where: { key: setting.key },
        update: {},
        create: setting
      });
    }
    
    return NextResponse.json({ message: "Setup completed successfully" });
  } catch (error) {
    console.error("Setup Error:", error);
    return NextResponse.json({ error: "Setup failed" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const settings = [
      { key: "defaultHourlyRate", value: String(body.defaultHourlyRate) },
      { key: "defaultAdenaRate", value: String(body.defaultAdenaRate) },
      { key: "defaultAdenaUnit", value: String(body.defaultAdenaUnit) },
      { key: "defaultSharePercentage", value: String(body.defaultSharePercentage) }
    ];
    
    for (const setting of settings) {
      await prisma.globalSetting.upsert({
        where: { key: setting.key },
        update: { value: setting.value },
        create: setting
      });
    }
    
    return NextResponse.json({ message: "Settings updated" });
  } catch (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
