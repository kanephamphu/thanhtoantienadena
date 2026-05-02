const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');
  
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      name: 'Administrator',
      username: 'admin',
      pin: '1234',
      role: 'admin',
      team: 'Management'
    }
  });
  
  console.log('Admin created:', admin.username);
  
  const settings = [
    { key: 'defaultHourlyRate', value: '20000' },
    { key: 'defaultAdenaRate', value: '25000' },
    { key: 'defaultAdenaUnit', value: '16666.67' }
  ];
  
  for (const s of settings) {
    await prisma.globalSetting.upsert({
      where: { key: s.key },
      update: {},
      create: s
    });
  }
  
  console.log('Settings initialized.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
