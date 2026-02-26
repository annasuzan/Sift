import { pool } from "../db";

async function cleanup() {
  console.log("Cleaning stale jobs...");

  const result = await pool.query(`
    DELETE FROM jobs
    WHERE last_seen_at < NOW() - INTERVAL '14 days'
  `);

  console.log(`Removed ${result.rowCount} expired jobs`);
  process.exit(0);
}

cleanup();