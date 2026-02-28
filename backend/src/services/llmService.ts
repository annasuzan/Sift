import { ResumeDetails, SeniorityTier } from "../types/jobs";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";


export async function extractResumeDetails(resumeText: string): Promise<ResumeDetails> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          yearsOfExperience: { type: SchemaType.NUMBER },
          tier: {
            type: SchemaType.STRING,
            format: "enum",
            enum: ["internship", "entry", "mid", "senior", "lead"],
          },
          skills: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
          },
          summary: { type: SchemaType.STRING },
          jobTitles: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
          },
        },
        required: ["yearsOfExperience", "tier", "skills", "summary", "jobTitles"],
      },
    },
  });

  const prompt = `You are an expert resume parser. Extract structured information from the resume below.

CRITICAL RULES:
- jobTitles must reflect what the candidate ACTUALLY DOES, based on their work history and skills — not adjacent roles they could loosely qualify for.
  Examples:
  - A nurse's jobTitles should be clinical roles like "Registered Nurse", "ICU Nurse" — NOT "Care Coordinator" or "Patient Services Manager"
  - A software engineer's jobTitles should be technical roles like "Software Engineer", "SRE" — NOT "Project Coordinator" or "Technical Program Manager"
  - A teacher's jobTitles should be "Teacher", "Curriculum Developer" — NOT "Training Coordinator"
- skills must reflect the candidate's core discipline — technical tools for engineers, clinical skills for healthcare, financial tools for finance, etc. Avoid generic soft skills.
- summary must explicitly name the candidate's profession and specialisation, not vague descriptions like "experienced professional".
- Tier rules: Assign 'internship' for undergraduate students with no full-time experience, 'entry' for 1-2 years, 'mid' for 3-5 years, 'senior' for 5-9 years, and 'lead' for 9+ years or staff/principal/director/VP title.


Fields to extract:
- yearsOfExperience: total professional years as a number, 0 if student or intern
- tier: one of internship, entry, mid, senior, lead
- skills: up to 10 core discipline-specific skills
- summary: 2-3 sentences explicitly naming the profession, specialisation, seniority, and key strengths
- jobTitles: up to 5 job titles this candidate should apply for, strictly based on their actual work history — never roles that are merely adjacent or loosely related


Resume:
${resumeText.slice(0, 4000)}`;

  try {
    const result = await model.generateContent(prompt);
    const rawOutput = result.response.text().trim();
    const parsed = JSON.parse(rawOutput) as ResumeDetails;

    // Validate tier is one of our known values
    const validTiers: SeniorityTier[] = ["internship", "entry", "mid", "senior", "lead"];
    if (!validTiers.includes(parsed.tier)) parsed.tier = "entry";

    return parsed;
  } catch (err) {
    console.error("Gemini extraction failed, falling back:", err);
    throw new Error("CANNOT_PROCESS_RESUME");
    // return fallbackProfile();
  }
}





// export async function extractResumeDetails(resumeText: string): Promise<ResumeDetails> {
//   const hfToken = process.env.HF_TOKEN;
//   if (!hfToken) throw new Error("HF_TOKEN missing");

//   const response = await fetch(
//     "https://router.huggingface.co/v1/chat/completions",
//     {
//       method: "POST",
//       headers: {
//         Authorization: `Bearer ${hfToken}`,
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         model: "meta-llama/Llama-3.1-8B-Instruct:cerebras",
//         messages: [
//           {
//             role: "system",
//             content: "You are a resume parser. Respond with valid JSON only. No markdown, no extra text, no explanation.",
//           },
//           {
//             role: "user",
//             content: `Extract from this resume and return ONLY a JSON object with these exact fields:
// {
//   "yearsOfExperience": <number, total professional years, 0 if student/intern>,
//   "tier": <one of: "internship", "entry", "mid", "senior", "lead">,
//   "skills": <string[] up to 10 most relevant technical skills>,
//   "summary": <string, 2-3 sentences capturing level, domain, and key strengths>,
//   "jobTitles": <string[], up to 3 typical job titles for this candidate>,
// }

// Tier rules: Assign 'internship' for undergraduate students with no full-time experience, 'entry' for 1-2 years, 'mid' for 3-5 years, 'senior' for 5-9 years, and 'lead' for 9+ years or staff/principal/director/VP title.

// Resume:
// ${resumeText.slice(0, 4000)}`,
//           },
//         ],
//         max_tokens: 512,
//         temperature: 0.1,
//       }),
//     }
//   );

//   const resultText = await response.text();
//   if (!response.ok) throw new Error(`HF API Error: ${resultText}`);

//   const result = JSON.parse(resultText);
//   const rawOutput: string = result.choices?.[0]?.message?.content?.trim() ?? "";
//   return parseProfileFromLLMOutput(rawOutput);
// }




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

  return parsed;
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
