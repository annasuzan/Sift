import { motion } from "framer-motion";
import { MapPin, Building2, Clock, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  matchScore: number;
  skills: string[];
  posted: string;
}

interface JobCardProps {
  job: Job;
  index: number;
}

const JobCard = ({ job, index }: JobCardProps) => {
  const matchLabel = job.matchScore >= 85 ? "Strong Match" : job.matchScore >= 70 ? "Good Match" : "Partial Match";
  const matchClass = job.matchScore >= 85 ? "match-high" : "match-medium";

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
              {matchLabel} · {job.matchScore}%
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
            <span className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" /> {job.company}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> {job.location}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> {job.posted}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {job.skills.map((skill) => (
              <span
                key={skill}
                className="text-xs px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-foreground">
          <ExternalLink className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
};

export default JobCard;
export type { Job };
