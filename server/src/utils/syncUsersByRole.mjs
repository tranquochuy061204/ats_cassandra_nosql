import client from '../config/cassandra.mjs';

async function syncUsersByRole() {
  const result = await client.execute('SELECT user_id, full_name, user_email, role FROM users_by_id', [], {
    prepare: true,
  });

  console.log(`🔄 Syncing ${result.rowLength} users...`);

  for (const row of result.rows) {
    await client.execute(
      'INSERT INTO users_by_role (role, user_id, full_name, email) VALUES (?, ?, ?, ?)',
      [row.role, row.user_id, row.full_name, row.user_email],
      { prepare: true }
    );
  }

  console.log('✅ Done syncing users_by_role');
  process.exit(0);
}

syncUsersByRole().catch((err) => {
  console.error('❌ Sync error:', err);
  process.exit(1);
});
