import { ResumeDetails, SeniorityTier } from "../types/jobs";

export async function extractResumeDetails(resumeText: string): Promise<ResumeDetails> {
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
  "yearsOfExperience": <number, total professional years, 0 if student/intern>,
  "tier": <one of: "internship", "entry", "mid", "senior", "lead">,
  "skills": <string[] up to 10 most relevant technical skills>,
  "summary": <string, 2-3 sentences capturing level, domain, and key strengths>,
  "jobTitles": <string[], up to 3 typical job titles for this candidate>,
}

Tier rules: Assign 'internship' for undergraduate students with no full-time experience, 'entry' for 1-2 years, 'mid' for 3-5 years, 'senior' for 5-9 years, and 'lead' for 9+ years or staff/principal/director/VP title.

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

  return { ...parsed };
}

function fallbackProfile(): ResumeDetails {
  return {
    yearsOfExperience: 0,
    tier: "entry",
    skills: [],
    summary: "",
    jobTitles: [],
    industries: [],
  };
}
