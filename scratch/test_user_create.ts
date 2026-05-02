import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  try {
    const user = await prisma.user.create({
      data: {
        name: "Test User",
        username: "testuser_" + Date.now(),
        pin: "1234",
        avatar: "",
        role: "member",
        team: "General"
      }
    })
    console.log("Success:", user)
  } catch (e) {
    console.error("Error:", e)
  } finally {
    await prisma.$disconnect()
  }
}

main()
