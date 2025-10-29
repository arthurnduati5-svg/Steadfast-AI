import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // Create a test student
  const student = await prisma.studentProfile.upsert({
    where: { userId: 'test-student-1' },
    update: {},
    create: {
      userId: 'test-student-1',
      name: 'Test Student',
      email: 'test@example.com',
      gradeLevel: '10th Grade',
    },
  });

  console.log(`Created or found student: ${student.name}`);

  // Create a few chat sessions
  const session1 = await prisma.chatSession.create({
    data: {
      studentId: student.userId,
      topic: 'Introduction to Algebra',
      isActive: false,
      messages: {
        create: [
          { role: 'student', content: 'Hi there!', messageNumber: 1 },
          { role: 'ai', content: 'Hello! How can I help you with Algebra today?', messageNumber: 2 },
        ],
      },
    },
  });

  console.log(`Created session: ${session1.topic}`);

  const session2 = await prisma.chatSession.create({
    data: {
      studentId: student.userId,
      topic: 'The Solar System',
      isActive: false,
      messages: {
        create: [
          { role: 'student', content: 'Tell me about the planets.', messageNumber: 1 },
          { role: 'ai', content: 'The solar system has 8 planets...', messageNumber: 2 },
          { role: 'student', content: 'Which one is the biggest?', messageNumber: 3 },
          { role: 'ai', content: 'Jupiter is the largest planet in our solar system.', messageNumber: 4 },
        ],
      },
    },
  });

  console.log(`Created session: ${session2.topic}`);

  const lastSession = await prisma.chatSession.create({
    data: {
      studentId: student.userId,
      topic: 'Learning about Earth',
      isActive: true,
      messages: {
        create: [
          { role: 'student', content: 'What is Earth\'s atmosphere made of?', messageNumber: 1 },
          { role: 'ai', content: 'Earth\'s atmosphere is composed of about 78% nitrogen, 21% oxygen, and 1% other gases.', messageNumber: 2 },
        ],
      },
    },
  });

  console.log(`Created active session: ${lastSession.topic}`);

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
