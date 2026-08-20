import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Password Hashing
  const passwordHash = await bcrypt.hash('password123', 10);
  const adminHash = await bcrypt.hash('admin123', 10);

  // 2. Create Users
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@delivery.com' },
    update: {},
    create: {
      name: 'System Admin',
      email: 'admin@delivery.com',
      password_hash: adminHash,
      role: 'ADMIN',
      phone: '+919876543210',
    },
  });

  const customerUser = await prisma.user.upsert({
    where: { email: 'customer@delivery.com' },
    update: {},
    create: {
      name: 'Rajesh Customer',
      email: 'customer@delivery.com',
      password_hash: passwordHash,
      role: 'CUSTOMER',
      phone: '+919812345678',
    },
  });

  // 3. Create Zones & Areas
  const zoneSouth = await prisma.zone.upsert({
    where: { code: 'BLR_S' },
    update: {},
    create: {
      name: 'Bangalore South',
      code: 'BLR_S',
      areas: {
        create: [
          { pincode: '560001', areaName: 'MG Road / Bangalore Central' },
          { pincode: '560002', areaName: 'City Market' },
          { pincode: '560034', areaName: 'Koramangala' },
          { pincode: '560078', areaName: 'JP Nagar' },
        ],
      },
    },
  });

  const zoneNorth = await prisma.zone.upsert({
    where: { code: 'BLR_N' },
    update: {},
    create: {
      name: 'Bangalore North',
      code: 'BLR_N',
      areas: {
        create: [
          { pincode: '560003', areaName: 'Malleshwaram' },
          { pincode: '560004', areaName: 'Basavanagudi' },
          { pincode: '560012', areaName: 'Rajajinagar' },
        ],
      },
    },
  });

  const zoneMumbai = await prisma.zone.upsert({
    where: { code: 'MUM_W' },
    update: {},
    create: {
      name: 'Mumbai West',
      code: 'MUM_W',
      areas: {
        create: [
          { pincode: '400001', areaName: 'Fort / South Mumbai' },
          { pincode: '400050', areaName: 'Bandra West' },
        ],
      },
    },
  });

  // 4. Create Delivery Agents
  const agent1User = await prisma.user.upsert({
    where: { email: 'agent.rahul@delivery.com' },
    update: {},
    create: {
      name: 'Rahul Agent',
      email: 'agent.rahul@delivery.com',
      password_hash: passwordHash,
      role: 'AGENT',
      phone: '+919900112233',
    },
  });

  const agent1Profile = await prisma.agent.upsert({
    where: { userId: agent1User.id },
    update: { status: 'AVAILABLE', currentZoneId: zoneSouth.id },
    create: {
      userId: agent1User.id,
      status: 'AVAILABLE',
      currentZoneId: zoneSouth.id,
      currentLat: 12.9716,
      currentLng: 77.5946,
      vehicleType: 'BIKE',
    },
  });

  const agent2User = await prisma.user.upsert({
    where: { email: 'agent.priya@delivery.com' },
    update: {},
    create: {
      name: 'Priya Agent',
      email: 'agent.priya@delivery.com',
      password_hash: passwordHash,
      role: 'AGENT',
      phone: '+919900445566',
    },
  });

  await prisma.agent.upsert({
    where: { userId: agent2User.id },
    update: { status: 'AVAILABLE', currentZoneId: zoneNorth.id },
    create: {
      userId: agent2User.id,
      status: 'AVAILABLE',
      currentZoneId: zoneNorth.id,
      currentLat: 12.9800,
      currentLng: 77.6000,
      vehicleType: 'VAN',
    },
  });

  // 5. Create Rate Cards
  await prisma.rateCard.deleteMany({});
  await prisma.rateCard.createMany({
    data: [
      { orderType: 'B2C', relation: 'INTRA', ratePerKg: 15, baseCharge: 50, minCharge: 40, isActive: true },
      { orderType: 'B2C', relation: 'INTER', ratePerKg: 25, baseCharge: 80, minCharge: 80, isActive: true },
      { orderType: 'B2B', relation: 'INTRA', ratePerKg: 12, baseCharge: 100, minCharge: 100, isActive: true },
      { orderType: 'B2B', relation: 'INTER', ratePerKg: 20, baseCharge: 200, minCharge: 200, isActive: true },
    ],
  });

  // 6. Create COD Surcharge Configs
  await prisma.codSurchargeConfig.deleteMany({});
  await prisma.codSurchargeConfig.createMany({
    data: [
      { orderType: 'B2C', surchargeType: 'FLAT', value: 30, isActive: true },
      { orderType: 'B2B', surchargeType: 'PERCENT', value: 3.5, isActive: true },
    ],
  });

  console.log('✅ Seeding completed successfully!');
  console.log('   Admin login: admin@delivery.com / admin123');
  console.log('   Customer login: customer@delivery.com / password123');
  console.log('   Agent login: agent.rahul@delivery.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
