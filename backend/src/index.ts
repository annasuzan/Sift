import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

console.log("Database URL present:", !!process.env.DATABASE_URL);
if (!process.env.DATABASE_URL) {
  console.error("ERROR: DATABASE_URL is missing from environment variables!");
}

import { pool } from "./db";
import jobsRoutes from "./routes/jobs";


const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: "*" }));
app.use(express.json());

app.get("/health", (_, res) => {
  res.json({ status: "ok" });
});

app.use("/jobs", jobsRoutes);

async function initializeDatabase() {
  // 1. Enable pgvector
  await pool.query(`CREATE EXTENSION IF NOT EXISTS vector;`);
  
  // 2. Enable pgcrypto (for gen_random_uuid support if needed on older PG versions)
  await pool.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

  // 3. Create Table - 1024 dimensions for BGE-M3
  await pool.query(`
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      company TEXT NOT NULL,
      location TEXT,
      job_type TEXT,
      salary TEXT,
      posted_date TIMESTAMPTZ,
      description TEXT NOT NULL,
      embedding vector(768) NOT NULL, 
      source_url TEXT UNIQUE,
      category TEXT,
      last_seen_at TIMESTAMP DEFAULT NOW(),
      first_seen_at TIMESTAMP DEFAULT NOW(),
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // 4. Create HNSW Index (Superior to ivfflat for most use cases)
  // We use vector_cosine_ops because we are matching resumes to jobs
  await pool.query(`
    CREATE INDEX IF NOT EXISTS jobs_embedding_hnsw_idx
    ON jobs
    USING hnsw (embedding vector_cosine_ops);
  `);

  console.log("Database initialized with 1024-dim vectors and HNSW index.");
}

async function start() {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Startup error:", err);
    process.exit(1);
  }
}

start();