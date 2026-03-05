import { db } from '../server/db';
import { users } from '../shared/schema';
import bcrypt from 'bcrypt';

async function main() {
  const password = 'love-money';
  const hashedPassword = await bcrypt.hash(password, 10);

  const adminUsers = [
    {
      username: 'strawberrycupcake',
      email: 'strawberrycupcake@example.com',
      password_hash: hashedPassword,
      role: 'admin' as const,
    },
    {
      username: 'honeybunches',
      email: 'honeybunches@example.com',
      password_hash: hashedPassword,
      role: 'admin' as const,
    },
  ];

  const regularUser = {
    username: 'guest',
    email: 'guest@example.com',
    password_hash: hashedPassword,
    role: 'user' as const,
  };

  console.log('Seeding users...');
  await db.insert(users).values([...adminUsers, regularUser]);
  console.log('Users seeded successfully!');

  process.exit(0);
}

main().catch((err) => {
  console.error('Error seeding users:', err);
  process.exit(1);
});
