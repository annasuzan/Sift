// src/db.ts
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

// If process.env.DATABASE_URL is undefined, it defaults to localhost
// which is causing your ECONNREFUSED error.
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required for Neon cloud connections
  },
});


// import { Pool } from "pg";

// const isProduction = process.env.NODE_ENV === "production";

// export const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
//   ssl: isProduction ? { rejectUnauthorized: false } : false,
// });

// pool.on("connect", () => {
//   console.log("Connected to PostgreSQL");
// });

// import pkg from "pg";
// const { Pool } = pkg;
// import dotenv from "dotenv";
// dotenv.config();

// export const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
// });