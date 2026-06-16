import 'dotenv/config';
import prisma from '../src/lib/prisma';

async function main(): Promise<void> {
  // Create a test user
  const user = await prisma.user.create({
    data: {
      email: 'demo@example.com',
      passwordHash: '$2a$12$demo-hash-not-real-do-not-use',
    },
  });
  process.stdout.write(`✅ User created: ${user.id} — ${user.email}\n`);

  // Create a test todo linked to that user
  const todo = await prisma.todo.create({
    data: {
      userId: user.id,
      title: 'Buy groceries',
      description: 'Milk, eggs, bread',
      completed: false,
      dueDate: new Date('2026-06-20'),
    },
  });
  process.stdout.write(`✅ Todo created: ${todo.id} — ${todo.title}\n`);

  // Create a test session linked to that user
  const session = await prisma.session.create({
    data: {
      userId: user.id,
      refreshToken: 'demo-refresh-token-not-real',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
  process.stdout.write(`✅ Session created: ${session.id} (expires ${session.expiresAt.toISOString()})\n`);

  process.stdout.write('\n🎉 All records created — check your Supabase table editor!\n');
}

main()
  .catch((e) => {
    process.stderr.write(`❌ Failed: ${String(e)}\n`);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

