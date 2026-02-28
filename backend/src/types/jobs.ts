export type SeniorityTier = "internship" | "entry" | "mid" | "senior" | "lead";

export interface ResumeDetails {
  yearsOfExperience: number;
  tier: SeniorityTier;
  skills: string[];
  summary: string;
  jobTitles: string[];
  industries: string[];
}

export const SENIORITY_FILTER: Record<SeniorityTier, string[]> = {
  internship: ["Internship", "Entry level"],
  entry:      ["Internship", "Entry level", "Associate"],
  mid:        ["Entry level", "Associate", "Mid-Senior level"],
  senior:     ["Mid-Senior level", "Director"],
  lead:       ["Mid-Senior level", "Director", "Executive"],
};
