import { db } from '../server/db';
import { users } from '../shared/schema';
import { inArray } from 'drizzle-orm';

/**
 * Lists every user and their role so we can verify permissions match.
 * Run with --make-admins to ensure both family accounts have the admin role:
 *
 *   npm run db:check-users              # report only
 *   npm run db:check-users -- --make-admins
 */
const FAMILY_ADMINS = ['strawberrycupcake', 'honeybunches'];

async function main() {
  const allUsers = await db.select({
    username: users.username,
    email: users.email,
    role: users.role,
  }).from(users);

  console.log('\nCurrent users:');
  console.table(allUsers);

  const wrongRole = allUsers.filter(
    (u) => FAMILY_ADMINS.includes(u.username) && u.role !== 'admin',
  );

  if (wrongRole.length === 0) {
    console.log('✅ strawberrycupcake and honeybunches both have the admin role.');
  } else {
    console.log(`⚠️  Missing admin role: ${wrongRole.map((u) => u.username).join(', ')}`);

    if (process.argv.includes('--make-admins')) {
      await db.update(users)
        .set({ role: 'admin' })
        .where(inArray(users.username, FAMILY_ADMINS));
      console.log('✅ Fixed — both accounts are now admin.');
      console.log('👉 Have the affected user LOG OUT and LOG BACK IN (the role is cached at login).');
    } else {
      console.log('Run again with --make-admins to fix:');
      console.log('  npm run db:check-users -- --make-admins');
    }
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('Error checking users:', err);
  process.exit(1);
});
