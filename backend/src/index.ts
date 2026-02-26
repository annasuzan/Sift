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

app.use("/api/jobs", jobsRoutes);

async function initializeDatabase() {
  try {
    // 1. Enable pgvector extension
    await pool.query(`CREATE EXTENSION IF NOT EXISTS vector;`);
    
    // 2. Create Table - Optimized for LinkedIn Data
    // Note: 'embedding' is vector(768) to match BGE-Base-v1.5
    await pool.query(`
      CREATE TABLE IF NOT EXISTS linkedin_jobs (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        company_name TEXT NOT NULL,
        company_employees_count TEXT, 
        location TEXT,
        posted_at TIMESTAMPTZ,
        description_text TEXT NOT NULL,
        applicants_count INT,
        apply_url TEXT,
        seniority_level TEXT,
        employment_type TEXT,
        industries TEXT,
        job_function TEXT,
        country TEXT,
        embedding vector(768) NOT NULL, 
        last_seen_at TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 3. Create HNSW Index for high-performance semantic search
    await pool.query(`
      CREATE INDEX IF NOT EXISTS linkedin_jobs_embedding_hnsw_idx
      ON linkedin_jobs
      USING hnsw (embedding vector_cosine_ops);
    `);

    console.log("Database initialized: linkedin_jobs table ready with company_employees_count.");
  } catch (err) {
    console.error("Database initialization failed:", err);
    throw err;
  }
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