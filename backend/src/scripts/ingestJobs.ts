// backend/src/scripts/ingestJobs.ts

import fs from "fs/promises";
import path from "path";
import { pool } from "../db";
import dotenv from "dotenv";
import { JOB_CATEGORIES } from "./jobCategories";

dotenv.config();

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

  // Flatten if nested
  if (Array.isArray(result) && Array.isArray(result[0])) return result[0];
  return result;
}

async function ingestJobs() {
  console.log("Starting job ingestion from backup JSON files...");
  const backupFolder = path.join(__dirname, "../../backups");

//   const backupFolder = path.join(__dirname, "backup");

  for (const config of JOB_CATEGORIES) {
    try {
      const fileName = `${config.query.replace(/\s+/g, "_").toLowerCase()}.json`;
      const filePath = path.join(backupFolder, fileName);
      const fileData = await fs.readFile(filePath, "utf-8");
      const items = JSON.parse(fileData);

      console.log(`Processing ${items.length} jobs from ${filePath}`);

      for (const job of items) {
        try {
            const indeedId = job.id || job.jobId || job.externalId;
            if (!indeedId) {
                console.warn("Skipping job: No ID found");
                continue;
            }

            //  Check if job already exists
            const existing = await pool.query(
            "SELECT 1 FROM jobs WHERE id = $1 LIMIT 1",
            [indeedId]
            );

            if (existing.rowCount && existing.rowCount > 0) {
                console.log(`Skipping existing job: ${indeedId}`);
                continue; //Skip embedding + insert
            }

          const title = job.positionName || "Unknown Title";
          const company = job.company || "Unknown Company";
          const description = job.description || "";
          const location = job.location || "Remote";

          // NEW COLUMNS MAPPING
          const jobType = job.jobType || "Not Specified";
          const salary = job.salary || "Not Disclosed";
          const postedDate = job.postingDateParsed || new Date().toISOString();
          const cleanUrl = job.url || "";

          if (description.length < 200) continue;

          const text = `Title: ${title}\nCompany: ${company}\nLocation: ${location}\nType: ${jobType}\nDescription: ${description}`;
          console.log(`Processing: ${title} at ${company}`);

          const embedding = await generateEmbedding(text);

          // Flatten & stringify for pg-vector
          const flatEmbedding = Array.isArray(embedding[0]) ? embedding[0] : embedding;
          const vectorString = JSON.stringify(flatEmbedding);

          await pool.query(
            `INSERT INTO jobs (
              id, title, company, location, job_type, salary, 
              posted_date, description, embedding, source_url, category
            )
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
            ON CONFLICT (id)
            DO UPDATE SET
              last_seen_at = NOW(),
              title = EXCLUDED.title,
              description = EXCLUDED.description,
              embedding = EXCLUDED.embedding,
              posted_date = EXCLUDED.posted_date`,
            [
              indeedId,
              title,
              company,
              location,
              jobType,
              salary,
              postedDate,
              description,
              vectorString,
              cleanUrl,
              config.category,
            ]
          );

          console.log("Success:", title);
        } catch (err) {
          console.error("Failed to process job:", job.positionName || job.title, err);
        }
      }
    } catch (outerErr) {
      console.error("Failed category:", config.query, outerErr);
    }
  }

  console.log("Ingestion finished");
  process.exit(0);
}

ingestJobs();

































// // backend/src/scripts/ingestJobs.ts

// import { ApifyClient } from "apify-client";
// import { pool } from "../db";
// import dotenv from "dotenv";
// import { JOB_CATEGORIES } from "./jobCategories";

// dotenv.config();

// const apify = new ApifyClient({
//   token: process.env.APIFY_TOKEN!,
// });

// async function generateEmbedding(text: string): Promise<number[]> {
//   const modelId = "BAAI/bge-base-en-v1.5";
//   const hfToken = process.env.HF_TOKEN;

//   const response = await fetch(
//     `https://router.huggingface.co/hf-inference/models/${modelId}`,
//     {
//       method: "POST",
//       headers: {
//         Authorization: `Bearer ${hfToken}`,
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         inputs: text.slice(0, 5000),
//         options: { wait_for_model: true }
//       }),
//     }
//   );

//   const resultText = await response.text();
//   if (!response.ok) throw new Error(`Hugging Face API Error: ${resultText}`);

//   const result = JSON.parse(resultText);
//   return (Array.isArray(result) && Array.isArray(result[0])) ? result[0] : result;
// }

// async function ingestJobs() {
//   console.log("Starting job ingestion with new columns...");

//   for (const config of JOB_CATEGORIES) {
//     try {
//         console.log("Fetching:", config.query);
//         const run = await apify.actor("misceres/indeed-scraper").call({
//             position: config.query,
//             maxItemsPerSearch: 10,
//             country: "US",
//         });
        
//         const { items } = await apify.dataset(run.defaultDatasetId).listItems();

//         const backupPath = path.join(__dirname, `backup_${config.category}.json`);
//         await fs.writeFile(backupPath, JSON.stringify(items, null, 2));
//         console.log(`Saved backup to ${backupPath}`);
        
//         for (const job of items) {
//             try {
//                 const indeedId = job.id || (job as any).jobId || (job as any).externalId;
                
//                 if (!indeedId) {
//                     console.warn("Skipping job: No ID found");
//                     continue;
//                 }

//                 const title = job.positionName || "Unknown Title";
//                 const company = job.company || "Unknown Company";
//                 const description = job.description || "";
//                 const location = job.location || "Remote";
                
//                 // NEW COLUMNS MAPPING
//                 const jobType = (job as any).employmentType || "Not Specified";
//                 const salary = (job as any).salary || "Not Disclosed";
//                 const postedDate = (job as any).postingDateParsed || new Date().toISOString(); 
//                 const cleanUrl = job.url ? job.url : "";

//                 if (description.length < 200) continue;
                
//                 const text = `Title: ${title}\nCompany: ${company}\nLocation: ${location}\nType: ${jobType}\nDescription: ${description}`;
//                 console.log(`Processing: ${title} at ${company}`);

//                 const embedding = await generateEmbedding(text);
//                 const vectorString = JSON.stringify(embedding);

//                 await pool.query(
//                     `INSERT INTO jobs (
//                         id, title, company, location, job_type, salary, 
//                         posted_date, description, embedding, source_url, category
//                     )
//                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
//                     ON CONFLICT (id) 
//                     DO UPDATE SET
//                         last_seen_at = NOW(),
//                         title = EXCLUDED.title,
//                         description = EXCLUDED.description,
//                         embedding = EXCLUDED.embedding,
//                         posted_date = EXCLUDED.posted_date`,
//                     [
//                         indeedId, 
//                         title, 
//                         company, 
//                         location, 
//                         jobType, 
//                         salary,
//                         postedDate, 
//                         description, 
//                         vectorString, 
//                         cleanUrl, 
//                         config.category
//                     ]
//                 );
                
//                 console.log("Success:", title);
//             } catch (err) {
//                 console.error("Failed to process job:", (job as any).positionName, err);
//             }
//         }
//     } catch (outerErr) {
//         console.error("Failed category:", config.query, outerErr);
//     }
//   }

//   console.log("Ingestion finished");
//   process.exit(0);
// }

// ingestJobs();