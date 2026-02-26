import { motion } from "framer-motion";
import { MapPin, Building2, Clock, ExternalLink, Users, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";

// 1. Updated Interface to match your SQL query results
interface Job {
  id: string;
  title: string;
  company_name: string;          // Changed from company
  company_employees_count: string; // New field
  location: string;
  apply_url: string;             // New field
  seniority_level: string;       // New field
  employment_type: string;       // New field
  posted_at: string;             // Changed from posted
  similarity: number;            // Changed from matchScore
}

interface JobCardProps {
  job: Job;
  index: number;
}

const JobCard = ({ job, index }: JobCardProps) => {
  // 2. Map similarity to labels
  const matchLabel = job.similarity >= 85 ? "Strong Match" : job.similarity >= 70 ? "Good Match" : "Partial Match";
  const matchClass = job.similarity >= 85 ? "match-high" : "match-medium";
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

// Then use it in your JSX:
<span className="flex items-center gap-1.5" title="Date Posted">
  <Clock className="w-3.5 h-3.5" /> {formatDate(job.posted_at)}
</span>

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="card-elevated"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-body text-lg font-semibold text-foreground truncate">
              {job.title}
            </h3>
            <span className={`match-badge ${matchClass} shrink-0`}>
              {matchLabel} · {job.similarity}%
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
            <span className="flex items-center gap-1.5" title="Company">
              <Building2 className="w-3.5 h-3.5" /> {job.company_name}
            </span>
            <span className="flex items-center gap-1.5" title="Location">
              <MapPin className="w-3.5 h-3.5" /> {job.location}
            </span>
            {job.seniority_level && job.seniority_level.trim() !== "" && (
              <span className="flex items-center gap-1.5" title="Seniority">
                <Briefcase className="w-3.5 h-3.5" /> {job.seniority_level}
              </span>
            )}
            {/* <span className="flex items-center gap-1.5" title="Company Size">
              <Users className="w-3.5 h-3.5" /> {job.company_employees_count || "N/A"}
            </span> */}
            <span className="flex items-center gap-1.5" title="Date Posted">
              <Clock className="w-3.5 h-3.5" /> {formatDate(job.posted_at)}
            </span>
          </div>

          {/* Display Employment Type as a tag */}
          <div className="flex flex-wrap gap-2">
            <span className="text-xs px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground">
              {job.employment_type}
            </span>
          </div>
        </div>

        {/* 3. Update the button to actually link to the application */}
        <a href={job.apply_url} target="_blank" rel="noopener noreferrer">
          <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-foreground">
            <ExternalLink className="w-4 h-4" />
          </Button>
        </a>
      </div>
    </motion.div>
  );
};

export default JobCard;
export type { Job };