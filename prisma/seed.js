import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create dummy users for testing purpose
  const password = await bcrypt.hash('password123', 12);
  
  const user1 = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      name: 'Alice Johnson',
      email: 'alice@example.com',
      passwordHash: password,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      name: 'Bob Smith',
      email: 'bob@example.com',
      passwordHash: password,
    },
  });

  const user3 = await prisma.user.upsert({
    where: { email: 'carol@example.com' },
    update: {},
    create: {
      name: 'Carol Wilson',
      email: 'carol@example.com',
      passwordHash: password,
    },
  });

  // Create demo polls
  const poll1 = await prisma.poll.create({
    data: {
      question: 'What is your favorite programming language?',
      isPublished: true,
      userId: user1.id,
      options: {
        create: [
          { text: 'JavaScript' },
          { text: 'Python' },
          { text: 'Java' },
          { text: 'C++' },
        ],
      },
    },
    include: { options: true },
  });

  const poll2 = await prisma.poll.create({
    data: {
      question: 'Which framework do you prefer for web development?',
      isPublished: true,
      userId: user2.id,
      options: {
        create: [
          { text: 'React' },
          { text: 'Vue.js' },
          { text: 'Angular' },
          { text: 'Svelte' },
        ],
      },
    },
    include: { options: true },
  });

  const poll3 = await prisma.poll.create({
    data: {
      question: 'What is the best time for team meetings?',
      isPublished: false,
      userId: user3.id,
      options: {
        create: [
          { text: 'Morning (9-11 AM)' },
          { text: 'Afternoon (2-4 PM)' },
          { text: 'Evening (5-7 PM)' },
        ],
      },
    },
    include: { options: true },
  });

  // Create some demo votes
  await prisma.vote.createMany({
    data: [
      { userId: user2.id, pollOptionId: poll1.options[0].id }, // Bob votes for JavaScript
      { userId: user3.id, pollOptionId: poll1.options[1].id }, // Carol votes for Python
      { userId: user1.id, pollOptionId: poll2.options[0].id }, // Alice votes for React
      { userId: user3.id, pollOptionId: poll2.options[2].id }, // Carol votes for Angular
    ],
  });

  console.log('✅ Database seeded successfully!');
  console.log('\n📊 Created data:');
  console.log('Users:', await prisma.user.count());
  console.log('Polls:', await prisma.poll.count());
  console.log('Poll Options:', await prisma.pollOption.count());
  console.log('Votes:', await prisma.vote.count());
  
  console.log('\n👤 Demo users (password: password123):');
  console.log('- alice@example.com');
  console.log('- bob@example.com');
  console.log('- carol@example.com');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });