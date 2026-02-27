import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Building2, Clock, ExternalLink, Briefcase, X, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface Job {
  id: string;
  title: string;
  company_name: string;
  company_employees_count: string;
  location: string;
  apply_url: string;
  seniority_level: string;
  employment_type: string;
  posted_at: string;
  similarity: number;
  description_text?: string;
}

interface JobCardProps {
  job: Job;
  index: number;
}

const formatDate = (dateString: string) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
};

const JobCard = ({ job, index }: JobCardProps) => {
  const [flipped, setFlipped] = useState(false);

  const matchLabel =
    job.similarity >= 85 ? "Strong Match" : job.similarity >= 70 ? "Good Match" : "Partial Match";

  const matchColor =
    job.similarity >= 85
      ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30"
      : job.similarity >= 70
      ? "bg-sky-500/15 text-sky-400 ring-1 ring-sky-500/30"
      : "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30";

  return (
    <>
      {/* ── CARD (front face) ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: index * 0.06, ease: [0.23, 1, 0.32, 1] }}
        onClick={() => setFlipped(true)}
        className="group relative bg-card border border-border rounded-2xl p-6 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 flex flex-col gap-4 cursor-pointer"
        style={{ perspective: "1000px" }}
      >
        {/* Top row: title + match badge */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold text-lg text-foreground leading-snug line-clamp-2 flex-1">
            {job.title}
          </h3>
          <span className={`shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${matchColor}`}>
            {job.similarity}% · {matchLabel}
          </span>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 shrink-0" /> {job.company_name}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 shrink-0" /> {job.location}
          </span>
          {job.seniority_level?.trim() && (
            <span className="flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 shrink-0" /> {job.seniority_level}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 shrink-0" /> {formatDate(job.posted_at)}
          </span>
        </div>

        {/* Bottom */}
        <div className="flex items-center justify-between mt-auto pt-1">
          <span className="text-xs px-2.5 py-1 rounded-md bg-secondary/70 text-secondary-foreground font-medium">
            {job.employment_type}
          </span>
          <a
            href={job.apply_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-8 gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              Apply <ExternalLink className="w-3 h-3" />
            </Button>
          </a>
        </div>
      </motion.div>

      {/* ── FLIP MODAL ── */}
      <AnimatePresence>
        {flipped && (
          <>
            {/* Backdrop */}
            <motion.div
              key="flip-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-[60] bg-background/70 backdrop-blur-md"
              onClick={() => setFlipped(false)}
            />

            {/* Flip container — 3D perspective wrapper */}
            <div
              className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none"
              style={{ perspective: "1200px" }}
            >
              {/* The flipping card */}
              <motion.div
                key="flip-card"
                initial={{ rotateY: -180, opacity: 0.6, scale: 0.85 }}
                animate={{ rotateY: 0, opacity: 1, scale: 1 }}
                exit={{ rotateY: 180, opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.55, ease: [0.23, 1, 0.32, 1] }}
                style={{ transformStyle: "preserve-3d", backfaceVisibility: "hidden" }}
                className="pointer-events-auto w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl shadow-black/30 overflow-hidden"
              >
                {/* Modal header */}
                <div className="px-7 pt-7 pb-5 border-b border-border flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold text-foreground leading-tight mb-1">
                      {job.title}
                    </h2>
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted-foreground mt-2">
                      <span className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 shrink-0" /> {job.company_name}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 shrink-0" /> {job.location}
                      </span>
                      {job.seniority_level?.trim() && (
                        <span className="flex items-center gap-1.5">
                          <Briefcase className="w-3.5 h-3.5 shrink-0" /> {job.seniority_level}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 shrink-0" /> {formatDate(job.posted_at)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${matchColor}`}>
                      {job.similarity}% · {matchLabel}
                    </span>
                    <button
                      onClick={() => setFlipped(false)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors ml-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Tags row */}
                <div className="px-7 py-3.5 border-b border-border flex items-center gap-2 flex-wrap">
                  <span className="text-xs px-2.5 py-1 rounded-md bg-secondary/70 text-secondary-foreground font-medium">
                    {job.employment_type}
                  </span>
                  {job.company_employees_count && (
                    <span className="text-xs px-2.5 py-1 rounded-md bg-secondary/70 text-secondary-foreground font-medium">
                      {job.company_employees_count} employees
                    </span>
                  )}
                </div>

                {/* Description */}
                <div className="px-7 py-6 max-h-[50vh] overflow-y-auto">
                  {job.description_text ? (
                    <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none">
                      <p className="text-[11px] uppercase font-bold tracking-widest text-muted-foreground mb-3">
                        About the role
                      </p>
                      <p className="text-sm text-foreground/85 leading-relaxed whitespace-pre-line">
                        {job.description_text}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No description available.</p>
                  )}
                </div>

                {/* Footer CTA */}
                <div className="px-7 py-5 border-t border-border bg-secondary/20 flex items-center justify-between gap-3">
                  <button
                    onClick={() => setFlipped(false)}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    ← Back to results
                  </button>
                  <a href={job.apply_url} target="_blank" rel="noopener noreferrer">
                    <Button className="gap-2">
                      Apply Now <ArrowUpRight className="w-4 h-4" />
                    </Button>
                  </a>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default JobCard;
export type { Job };
