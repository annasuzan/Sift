import { Router } from "express";
import multer from "multer";
import dotenv from "dotenv";
import { pool } from "../db";
import { ResumeDetails, SENIORITY_FILTER } from "../types/jobs";
import { extractTextFromPdf } from "../utils/resumeParser";
import { extractResumeDetails } from "../services/llmService";
import { generateEmbedding } from "../services/embeddingService";

dotenv.config();

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// ── POST /api/jobs/match: Returns jobs that match the resume ──
router.post("/match", upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded. Please upload a PDF resume." });
    }

    // Parse PDF
    let resumeText: string;
    try {
      resumeText = await extractTextFromPdf(req.file.buffer);
    } catch (err) {
      console.error("PDF Parsing Error:", err);
      return res.status(500).json({ error: "Failed to parse PDF content." });
    }

    // Extract profile via LLM
    console.log("Extracting resume profile...");
    let profile : ResumeDetails;
    try{
        profile = await extractResumeDetails(resumeText);
    } catch (err) {
        console.error("Resume extraction error:", err);
        return res.status(500).json({ error: "Failed to extract details from resume." });
    }
    
    console.log("Resume profile:", profile);

    // Generate embedding from augmented text
    const augmentedText = `
      ${profile.summary}
      Job titles: ${profile.jobTitles.join(", ")}
      Skills: ${profile.skills.join(", ")}
      Experience: ${profile.yearsOfExperience} years
    `.trim();

    const embedding = await generateEmbedding(augmentedText);
    const vectorString = JSON.stringify(embedding);

    // Query DB with seniority filter embedding cosine similarity
    const allowedLevels = SENIORITY_FILTER[profile.tier];
    const result = await pool.query(
      `SELECT
        id, title, company_name, company_employees_count,
        description_text, location, apply_url,
        seniority_level, employment_type, posted_at,
        1 - (embedding <=> $1) AS similarity
       FROM linkedin_jobs
       WHERE (seniority_level = ANY($2::text[]) OR seniority_level IS NULL OR seniority_level = '')
       ORDER BY embedding <=> $1
       LIMIT 100`,
      [vectorString, allowedLevels]
    );

    // Rerank with seniority boost and similarity filter
    const coreLevels = allowedLevels.slice(1, -1).length > 0
      ? allowedLevels.slice(1, -1)
      : allowedLevels;

    const matches = result.rows
      .map((row: any) => {
        const boost = coreLevels.includes(row.seniority_level) ? 0.05 : 0;
        return {
          ...row,
          similarity: Math.round((row.similarity + boost) * 100),
          _candidateTier: profile.tier,
          _candidateYears: profile.yearsOfExperience,
        };
      })
      .sort((a: any, b: any) => b.similarity - a.similarity)
      .filter((row: any) => row.similarity >= 60)
      .slice(0, 20);

    res.json({
      candidateProfile: {
        tier: profile.tier,
        yearsOfExperience: profile.yearsOfExperience,
        skills: profile.skills,
        summary: profile.summary,
      },
      matches,
    });

  } catch (err) {
    console.error("Match error:", err);
    res.status(500).json({ error: "An error occurred while matching your resume." });
  }
});

// ── GET /api/jobs/all : Returns all jobs in the DB ──
router.get("/all", async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = 20;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT id, title, company_name, description_text, location, apply_url,
              seniority_level, employment_type, posted_at, 0 AS similarity
       FROM linkedin_jobs
       ORDER BY posted_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json(result.rows.map((row: any) => ({ ...row, similarity: 0 })));
  } catch (err) {
    console.error("Error fetching all jobs:", err);
    res.status(500).json({ error: "Failed to fetch all jobs" });
  }
});

export default router;