import { Router } from "express";
import { pool } from "../db";
import dotenv from "dotenv";

dotenv.config();

const router = Router();

/**
 * Embedding Function
 * Must match ingestJobs.ts model
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
        options: { wait_for_model: true }
      }),
    }
  );

  const resultText = await response.text();
  if (!response.ok) {
    throw new Error(`Hugging Face API Error: ${resultText}`);
  }

  const result = JSON.parse(resultText);

  // Flatten if nested
  if (Array.isArray(result) && Array.isArray(result[0])) {
    return result[0];
  }

  return result;
}


// Match resume to jobs
router.post("/match", async (req, res) => {
  try {
    const { resumeText } = req.body;

    if (!resumeText || resumeText.length < 50) {
      return res.status(400).json({ error: "Invalid resume text" });
    }

    console.log("Generating embedding for resume...");

    const embedding = await generateEmbedding(resumeText);


    const vectorString = JSON.stringify(embedding);

    const result = await pool.query(
      `SELECT id, title, company, location, source_url,
              1 - (embedding <=> $1) AS similarity
       FROM jobs
       ORDER BY embedding <=> $1
       LIMIT 10`,
      [vectorString]
    );

    res.json(result.rows);

  } catch (err) {
    console.error("Match error:", err);
    res.status(500).json({ error: "Failed to match resume with jobs" });
  }
});

export default router;