import { motion } from "framer-motion";
import { Sparkles, FileSearch, Upload, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import JobCard, { Job } from "@/components/JobCard";

interface ResultsDashboardProps {
  filteredJobs: Job[];
  isBrowsingAll: boolean;
  isProcessing: boolean;
  positionSearch: string;
  setPositionSearch: (v: string) => void;
  lastJobElementRef: (node: HTMLDivElement) => void;
  onBrowseAll: () => void;
  onOpenUploadModal: () => void;
  onResetFilters: () => void;
}

const ResultsDashboard = ({
  filteredJobs, isBrowsingAll, isProcessing,
  positionSearch, setPositionSearch,
  lastJobElementRef,
  onBrowseAll, onOpenUploadModal, onResetFilters,
}: ResultsDashboardProps) => {
  return (
    <motion.div
      key="results-dashboard"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 py-8"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <h2 className="text-3xl font-bold text-foreground tracking-tight">
            {isBrowsingAll ? "All Jobs" : "Top Matches"}
          </h2>
          {!isBrowsingAll && (
            <span className="px-2.5 py-0.5 rounded-full bg-primary/15 text-primary text-sm font-semibold ring-1 ring-primary/30">
              {filteredJobs.length} jobs
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {!isBrowsingAll && (
            <Button
              onClick={onBrowseAll}
              variant="outline"
              className="gap-2 rounded-full px-5 h-9 border-border hover:border-primary/60 hover:bg-primary/5 transition-all shrink-0 text-sm"
            >
              <FileSearch className="w-3.5 h-3.5" />
              Browse all jobs
            </Button>
          )}
          <Button
            onClick={onOpenUploadModal}
            variant="outline"
            className="gap-2 rounded-full px-5 h-9 border-border hover:border-primary/60 hover:bg-primary/5 transition-all shrink-0 text-sm"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload new resume
          </Button>
        </div>
      </div>

      {/* Position search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          placeholder="Search by job title or company…"
          value={positionSearch}
          onChange={(e) => setPositionSearch(e.target.value)}
          className="w-full h-11 pl-11 pr-4 rounded-xl border border-border bg-card/60 backdrop-blur-sm text-sm outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all placeholder:text-muted-foreground/50"
        />
        {positionSearch && (
          <button
            onClick={() => setPositionSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Job grid */}
      {filteredJobs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredJobs.map((job, i) => {
            const isLast = filteredJobs.length === i + 1;
            return isLast ? (
              <div ref={lastJobElementRef} key={job.id}>
                <JobCard job={job} index={i} />
              </div>
            ) : (
              <JobCard key={job.id} job={job} index={i} />
            );
          })}
        </div>
      ) : (
        <div className="text-center py-24 border-2 border-dashed rounded-2xl border-border">
          <p className="text-muted-foreground mb-3">No jobs match your current filters.</p>
          <Button variant="link" onClick={onResetFilters}>Reset all filters</Button>
        </div>
      )}

      {isProcessing && isBrowsingAll && (
        <div className="py-10 text-center">
          <Sparkles className="w-6 h-6 animate-spin mx-auto text-primary opacity-50" />
        </div>
      )}
    </motion.div>
  );
};

export default ResultsDashboard;
