import { db } from '../server/db';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

async function main() {
  const newPassword = 'community-money';
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  console.log("Updating guest user's password...");

  await db.update(users)
    .set({ password_hash: hashedPassword, updated_at: new Date() })
    .where(eq(users.username, 'guest'));

  console.log("Guest user's password updated successfully!");

  process.exit(0);
}

main().catch((err) => {
  console.error("Error updating guest password:", err);
  process.exit(1);
});
