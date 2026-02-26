import { Router } from "express";
import { pool } from "../db";
import dotenv from "dotenv";
import multer from "multer";
import pdfParse from "@cyber2024/pdf-parse-fixed";


dotenv.config();

const router = Router();

// Initialize Multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

/**
 * Embedding Function
 * Matches ingestJobs.ts (BGE-Base-v1.5 produces 768 dimensions)
 */
async function generateEmbedding(text: string): Promise<number[]> {
  const modelId = "BAAI/bge-base-en-v1.5";
  const hfToken = process.env.HF_TOKEN;

  if (!hfToken) throw new Error("HF_TOKEN is missing from your environment variables");

  const response = await fetch(
   `https://router.huggingface.co/hf-inference/models/${modelId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${hfToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: text.slice(0, 5000), // Respect model context limits
        options: { wait_for_model: true }
      }),
    }
  );

  const resultText = await response.text();
  if (!response.ok) {
    throw new Error(`Hugging Face API Error: ${resultText}`);
  }

  const result = JSON.parse(resultText);

  // Handle nested array response format from Hugging Face
  if (Array.isArray(result) && Array.isArray(result[0])) {
    return result[0];
  }

  return result;
}

function cleanResumeText(text: string): string {
  return text
    // Normalize whitespace and newlines
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    
    // Remove excessive blank lines (more than 2 consecutive)
    .replace(/\n{3,}/g, "\n\n")
    
    // Remove special characters that add no meaning
    .replace(/[^\w\s\n\.\,\-\(\)\@\/\+\#]/g, " ")
    
    // Remove repeated whitespace on same line
    .replace(/[ \t]{2,}/g, " ")
    
    // Remove lines that are just symbols or numbers (page numbers, dividers)
    .replace(/^[\s\-\_\=\*\.]+$/gm, "")
    
    // Trim each line
    .split("\n")
    .map(line => line.trim())
    .filter(line => line.length > 2) // Remove very short/empty lines
    .join("\n")
    
    // Final trim
    .trim();
}

// Match resume to LinkedIn jobs
router.post("/match", upload.single("resume"), async (req, res) => {
  try {
    console.log("Received resume upload request12");
    // 1. Verify file exists
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded. Please upload a PDF resume." });
    }

    // 2. Parse PDF
    let resumeText = "";
    try {
        const pdfData = await pdfParse(req.file.buffer);
        resumeText = cleanResumeText(pdfData.text);
        // resumeText = pdfData.text;

      if (!resumeText || resumeText.trim().length === 0) {
        throw new Error("No extractable text found in PDF");
      }

      console.log(`Extracted text successfully: ${resumeText}`);
    } catch (err) {
      console.error("PDF Parsing Error:", err);
      return res.status(500).json({ error: "Failed to parse PDF content." });
    }

    // 3. Generate embedding
    console.log("Generating embedding for resume...");
    const embedding = await generateEmbedding(resumeText);
    const vectorString = JSON.stringify(embedding);

    console.log("Embedding generated successfully. Length:", embedding.length);
    console.log("Sample embedding values:", embedding.slice(0, 5));
    console.log("Vector string length:", vectorString.length);
    console.log("Vector string sample:", vectorString.slice(0, 100));
    if (embedding.length !== 768) {
      console.warn(`Warning: Expected embedding of length 768, got ${embedding.length}`);
    }

    // 4. Query the linkedin_jobs table with full metadata
    const result = await pool.query(
      `SELECT 
        id, 
        title, 
        company_name, 
        company_employees_count,
        location, 
        apply_url, 
        seniority_level,
        employment_type,
        posted_at,
        1 - (embedding <=> $1) AS similarity
       FROM linkedin_jobs
       ORDER BY embedding <=> $1
       LIMIT 10`,
      [vectorString]
    );

    console.log(`Database query completed. Found ${result.rowCount} matches.`);
    console.log("Raw query results:", result.rows);

    // 5. Format results (similarity as 0-100 percentage)
    const formattedResults = result.rows.map(row => ({
      ...row,
      similarity: parseFloat((row.similarity * 100).toFixed(2))
    }));

    console.log("Match results:", formattedResults);

    res.json(formattedResults);

  } catch (err) {
    console.error("Match error:", err);
    res.status(500).json({ error: "An error occurred while matching your resume." });
  }
});

export default router;