// backend/src/scripts/ingestJobs.ts

import fs from "fs/promises";
import path from "path";
import { pool } from "../db";
import dotenv from "dotenv";

dotenv.config();

/**
 * Generates embeddings using BGE-Base-v1.5 (768 dimensions)
 */
async function generateEmbedding(text: string): Promise<number[]> {
  const modelId = "BAAI/bge-base-en-v1.5";
  const hfToken = process.env.HF_TOKEN;

  const response = await fetch(
    `https://router.huggingface.co/hf-inference/models/${modelId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${hfToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: text.slice(0, 5000),
        options: { wait_for_model: true },
      }),
    }
  );

  const resultText = await response.text();
  if (!response.ok) throw new Error(`Hugging Face API Error: ${resultText}`);

  const result = JSON.parse(resultText);

  // Handle various HF response formats
  if (Array.isArray(result) && Array.isArray(result[0])) return result[0];
  return result;
}

async function ingestJobs() {
  console.log("Starting LinkedIn job ingestion from jobDump.json...");
  
  const filePath = path.join(__dirname, "../../backups/jobDump.json");

  try {
    const fileData = await fs.readFile(filePath, "utf-8");
    const items = JSON.parse(fileData);

    console.log(`Found ${items.length} jobs to process.`);

    for (const job of items) {
      try {
        const jobId = job.id;
        if (!jobId) {
          console.warn("Skipping job: No ID found in JSON object.");
          continue;
        }

        // Check if job already exists in the linkedin_jobs table
        const existing = await pool.query(
          "SELECT 1 FROM linkedin_jobs WHERE id = $1 LIMIT 1",
          [jobId]
        );

        if (existing.rowCount && existing.rowCount > 0) {
          console.log(`Skipping existing job: ${jobId}`);
          continue; 
        }

        // Map JSON keys to variables
        const title = job.title || "Unknown Title";
        const companyName = job.companyName || "Unknown Company";
        const description = job.descriptionText || "";
        const seniorityLevel = job.seniorityLevel || "";

        // Skip if description is too short for meaningful embedding
        if (description.length < 200) continue;

        console.log(`Processing: ${title} at ${companyName}`);

        // Create searchable text for the embedding
        //  title, company, and location for better semantic match
        const textToEmbed = `Title: ${title}\nCompany: ${companyName}\nLocation: ${job.Location}\nDescription: ${description}\nSeniority Level: ${seniorityLevel}`;
        const embedding = await generateEmbedding(textToEmbed);

        // Ensure embedding is a flat JSON string for pgvector
        const vectorString = JSON.stringify(embedding);

        const url = job.applyUrl || job.link || "";

        const country = job.companyAddress?.addressCountry || "";

        // Insert into linkedin_jobs table
        await pool.query(
          `INSERT INTO linkedin_jobs (
            id, 
            title, 
            company_name, 
            company_employees_count,
            location, 
            posted_at, 
            description_text, 
            applicants_count, 
            apply_url, 
            seniority_level, 
            employment_type, 
            industries, 
            job_function, 
            country,
            embedding
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
          ON CONFLICT (id)
          DO UPDATE SET
            last_seen_at = NOW(),
            title = EXCLUDED.title,
            description_text = EXCLUDED.description_text,
            embedding = EXCLUDED.embedding`,
          [
            jobId,                          // $1
            title,                          // $2
            companyName,                    // $3
            job.companyEmployeesCount,      // $4
            job.location,                   // $5
            job.postedAt || new Date(),     // $6
            description,                    // $7
            job.applicantsCount || 0,       // $8
            url,                            // $9
            job.seniorityLevel,             // $10
            job.employmentType,             // $11
            job.industries,                 // $12
            job.jobFunction,  //$13
            country,   // $14
            vectorString                    // $15
          ]
        );

        console.log(`Success: ${title}`);
      } catch (err) {
        console.error(`Failed to process job ID ${job.id}:`, err);
      }
    }
  } catch (outerErr) {
    console.error("Critical error reading jobDump.json:", outerErr);
  }

  console.log("Ingestion finished.");
  process.exit(0);
}

ingestJobs();