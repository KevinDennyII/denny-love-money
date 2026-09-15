import { db } from '../server/db';
import { users } from '../shared/schema';
import bcrypt from 'bcryptjs';

async function main() {
  const adminPasswordHash = await bcrypt.hash('love-money', 10);
  const therapistPasswordHash = await bcrypt.hash('latoya-view', 10);

  const adminUsers = [
    {
      username: 'strawberrycupcake',
      email: 'strawberrycupcake@example.com',
      password_hash: adminPasswordHash,
      role: 'admin' as const,
    },
    {
      username: 'honeybunches',
      email: 'honeybunches@example.com',
      password_hash: adminPasswordHash,
      role: 'admin' as const,
    },
  ];

  const regularUsers = [
    {
      username: 'guest',
      email: 'guest@example.com',
      password_hash: adminPasswordHash,
      role: 'user' as const,
    },
    {
      // Mrs. La'Toya Ray, CPA — Jamie's financial therapist (read-only)
      username: 'latoyaray',
      email: 'latoyaray@example.com',
      password_hash: therapistPasswordHash,
      role: 'user' as const,
    },
  ];

  console.log('Seeding users...');
  await db.insert(users).values([...adminUsers, ...regularUsers]).onConflictDoNothing();
  console.log('Users seeded successfully!');

  process.exit(0);
}

main().catch((err) => {
  console.error('Error seeding users:', err);
  process.exit(1);
});
