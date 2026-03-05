import { db } from '../server/db';
import { users } from '../shared/schema';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

async function main() {
  const password = 'love-money';
  const hashedPassword = await bcrypt.hash(password, 10);

  console.log('Updating honeybunches user...');
  await db.update(users)
    .set({ password_hash: hashedPassword })
    .where(eq(users.username, 'honeybunches'));
  console.log('honeybunches user updated successfully!');

  process.exit(0);
}

main().catch((err) => {
  console.error('Error updating user:', err);
  process.exit(1);
});
