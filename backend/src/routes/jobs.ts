import { Router } from "express";
import { pool } from "../db";
import dotenv from "dotenv";
import multer from "multer";
import pdfParse from "@cyber2024/pdf-parse-fixed";


dotenv.config();

const router = Router();

// Initializing Multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Define Seniority Tiers
type SeniorityTier = "internship" | "entry" | "mid" | "senior" | "lead";

// Structure into which resume should be converted into
interface ResumeDetails{
    yearsOfExperience: number;
    tier: SeniorityTier;
    // targetTiers: SeniorityTier[];
    skills: string[];
    summary: string;
}

const SENIORITY_FILTER: Record<SeniorityTier, string[]> = {
  internship: ["Internship", "Entry level"],
  entry:      ["Internship", "Entry level", "Associate"],
  mid:        ["Entry level", "Associate", "Mid-Senior level"],
  senior:     ["Mid-Senior level", "Director"],
  lead:       ["Mid-Senior level", "Director", "Executive"],
};


async function extractResumeDetails(resumeText: string): Promise<ResumeDetails> {
  const hfToken = process.env.HF_TOKEN;
  if (!hfToken) throw new Error("HF_TOKEN missing");

  const response = await fetch(
    "https://router.huggingface.co/v1/chat/completions", 
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${hfToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta-llama/Llama-3.1-8B-Instruct:cerebras", 
        messages: [
          {
            role: "system",
            content: "You are a resume parser. Respond with valid JSON only. No markdown, no extra text, no explanation.",
          },
          {
            role: "user",
            content: `Extract from this resume and return ONLY a JSON object with these exact fields:
{
  "yearsOfExperience": <number>,
  "tier": <"internship"|"entry"|"mid"|"senior"|"lead">,
  "skills": <string[] up to 10>,
  "summary": <string, 2-3 sentences>
}

Tier rules: internship=student/no full-time exp, entry=1 to 2 years of exp, mid=3-5 years, senior=5-9 years, lead=9+ years or staff/principal/director/VP title.

Resume:
${resumeText.slice(0, 4000)}`,
          },
        ],
        max_tokens: 512,
        temperature: 0.1,
      }),
    }
  );

  const resultText = await response.text();
  if (!response.ok) throw new Error(`HF API Error: ${resultText}`);

  const result = JSON.parse(resultText);
  // Standard OpenAI-compatible response shape
  const rawOutput: string = result.choices?.[0]?.message?.content?.trim() ?? "";

  return parseProfileFromLLMOutput(rawOutput);
}

function parseProfileFromLLMOutput(rawOutput: string): ResumeDetails {
  const jsonMatch = rawOutput.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error("No JSON found in LLM output, falling back:", rawOutput);
    return fallbackProfile();
  }

  let parsed: ResumeDetails;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    console.error("Failed to parse LLM JSON, falling back:", jsonMatch[0]);
    return fallbackProfile();
  }

  const validTiers: SeniorityTier[] = ["internship", "entry", "mid", "senior", "lead"];
  if (!validTiers.includes(parsed.tier)) parsed.tier = "entry";

  return {
    ...parsed  };
}

function fallbackProfile(): ResumeDetails {
  return {
    yearsOfExperience: 0,
    tier: "entry",
    skills: [],
    summary: "",
  };
}



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
        inputs: text.slice(0, 5000),
        options: { wait_for_model: true },
      }),
    }
  );
  const resultText = await response.text();
  if (!response.ok) throw new Error(`Hugging Face API Error: ${resultText}`);

  const result = JSON.parse(resultText);
  if (Array.isArray(result) && Array.isArray(result[0])) return result[0];
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
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded. Please upload a PDF resume." });
    }

    // Parse PDF
    let resumeText = "";
    try {
      const pdfData = await pdfParse(req.file.buffer);
      resumeText = cleanResumeText(pdfData.text);
      //resumeText = pdfData.text;
      if (!resumeText || resumeText.trim().length === 0) {
        throw new Error("No extractable text found in PDF");
      }
    } catch (err) {
      console.error("PDF Parsing Error:", err);
      return res.status(500).json({ error: "Failed to parse PDF content." });
    }

    // Run LLM extraction 
    console.log("Running LLM extraction and embedding in parallel...");
    const profile = await extractResumeDetails(resumeText);

    console.log("Resume profile:", profile);

    //Create augmented text for better embedding quality
    const augmentedText = `
      ${profile.summary}
      Skills: ${profile.skills.join(", ")}
      Experience: ${profile.yearsOfExperience} years
      ${resumeText.slice(0, 3000)}
    `.trim();

    // Generate embedding for the augmented text
    const augmentedEmbedding = await generateEmbedding(augmentedText);
    const vectorString = JSON.stringify(augmentedEmbedding);

    // Query with seniority filter
    const allowedLevels = SENIORITY_FILTER[profile.tier];

    const result = await pool.query(
      `SELECT 
        id,
        title,
        company_name,
        company_employees_count,
        description_text,
        location,
        apply_url,
        seniority_level,
        employment_type,
        posted_at,
        1 - (embedding <=> $1) AS similarity
       FROM linkedin_jobs
       WHERE 
         seniority_level = ANY($2::text[])  -- enforce seniority band
         OR seniority_level IS NULL          -- don't drop jobs with missing level data
         OR seniority_level = ''
       ORDER BY embedding <=> $1
       LIMIT 100`,
      [vectorString, allowedLevels]
    );

    // Consider core level as the middle value of the allowed range, removing the overlap.
    // Provide jobs that have seniority levels the same as the core level with additional boost as they
    // are probably the best fit.
    const coreLevels = allowedLevels.slice(1, -1).length > 0
      ? allowedLevels.slice(1, -1)
      : allowedLevels;

    const reranked = result.rows
      .map((row: any) => {
        const isCoreSeniority = coreLevels.includes(row.seniority_level);
        const boost = isCoreSeniority ? 0.05 : 0;
        return {
          ...row,
          similarity: parseFloat(((row.similarity + boost) * 100).toFixed(2)),
          _candidateTier: profile.tier,
          _candidateYears: profile.yearsOfExperience,
        };
      })
      .sort((a : any, b : any) => b.similarity - a.similarity)
      .slice(0, 20);

    //   console.log("Top matches:", reranked)
    res.json({
      candidateProfile: {
        tier: profile.tier,
        yearsOfExperience: profile.yearsOfExperience,
        skills: profile.skills,
        summary: profile.summary,
      },
      matches: reranked,
    });

  } catch (err) {
    console.error("Match error:", err);
    res.status(500).json({ error: "An error occurred while matching your resume." });
  }
});

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
