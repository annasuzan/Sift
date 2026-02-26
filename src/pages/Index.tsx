import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, FileSearch } from "lucide-react";
import ResumeUpload from "@/components/ResumeUpload";
import JobCard, { Job } from "@/components/JobCard";
import { mockJobs } from "@/data/mockJobs";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [jobs, setJobs] = useState<typeof mockJobs>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allJobs, setAllJobs] = useState<Job[]>([]); 
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]); 
  const [filters, setFilters] = useState({
    location: "",
    seniority: "",
    dateRange: "all"
  });

  useEffect(() => {
    let result = [...allJobs];

    // 1. Filter by Location
    if (filters.location) {
      result = result.filter(job => 
        job.location.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    // 2. Filter by Seniority
    if (filters.seniority) {
      result = result.filter(job => job.seniority_level === filters.seniority);
    }

    // 3. Filter by Date
    const now = new Date();
    if (filters.dateRange === "1day") {
      result = result.filter(job => {
        const diff = (now.getTime() - new Date(job.posted_at).getTime()) / (1000 * 3600 * 24);
        return diff <= 1;
      });
    } else if (filters.dateRange === "2days") {
      result = result.filter(job => {
        const diff = (now.getTime() - new Date(job.posted_at).getTime()) / (1000 * 3600 * 24);
        return diff <= 2;
      });
    } else if (filters.dateRange === "older") {
      result = result.filter(job => {
        const diff = (now.getTime() - new Date(job.posted_at).getTime()) / (1000 * 3600 * 24);
        return diff > 2;
      });
    }

    setFilteredJobs(result);
  }, [filters, allJobs]);


  const handleUpload = async (file: File) => {
    setIsProcessing(true);
    setHasSearched(false); 
    setError(null);
    
    // Clear all lists so the UI feels fresh
    setAllJobs([]);
    setFilteredJobs([]);
    
    const formData = new FormData();
    formData.append("resume", file);

    try {
      const response = await fetch("http://localhost:5000/api/jobs/match", {
        method: "POST",
        body: formData, 
      });

      if (!response.ok) throw new Error("Failed to match resume");

      const matches = await response.json();
      console.log("Received matches from backend:", matches);
      
      // THE KEY CHANGE: 
      // We update allJobs and filteredJobs. The useEffect will 
      // automatically handle the display from here.
      setAllJobs(matches);
      setFilteredJobs(matches); 
      setHasSearched(true);
      
    } catch (error) {
      console.error("Upload failed", error);
      setError("Server is offline or could not process resume.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
  <div className="min-h-screen flex flex-col">
    {/* Header - Always Visible */}
    <header className="border-b border-border sticky top-0 z-50 bg-background/80 backdrop-blur-md">
      <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setHasSearched(false)}>
          <FileSearch className="w-5 h-5 text-primary" />
          <span className="font-display text-lg">Sift</span>
        </div>
        {hasSearched && (
          <Button variant="ghost" size="sm" onClick={() => setHasSearched(false)} className="text-xs">
            Upload New
          </Button>
        )}
      </div>
    </header>

    <main className="flex-1">
      <AnimatePresence mode="wait">
        {!hasSearched ? (
          /* --- VIEW 1: UPLOAD & HERO --- */
          <motion.div
            key="upload-hero"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="pt-20 pb-12"
          >
            <section className="max-w-4xl mx-auto px-6 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-sm mb-6">
                <Sparkles className="w-3.5 h-3.5" />
                Smart resume analysis
              </div>
              <h1 className="text-4xl sm:text-5xl font-display text-foreground leading-tight mb-4">
                Find jobs that actually<br />match your skills
              </h1>
              <p className="text-lg text-muted-foreground max-w-lg mx-auto mb-10">
                Upload your resume and let AI shortlist the best opportunities for you.
              </p>
              <ResumeUpload onUpload={handleUpload} isProcessing={isProcessing} />
            </section>
          </motion.div>
        ) : (
          /* --- VIEW 2: FILTERS & RESULTS (Appears together) --- */
          <motion.div
            key="results-dashboard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto px-6 py-10"
          >
            {/* Results Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="font-display text-3xl text-foreground">Top Matches</h2>
                <p className="text-muted-foreground text-sm mt-1">Based on your experience and skills</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-primary">{filteredJobs.length}</span>
                <span className="text-xs block text-muted-foreground uppercase tracking-wider">Jobs Found</span>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap gap-4 p-4 bg-secondary/30 rounded-xl border border-border mb-10">
              <div className="flex-1 min-w-[200px]">
                <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">Location</label>
                <input 
                  type="text"
                  placeholder="Filter by city..."
                  className="w-full p-2 rounded-md border bg-background text-sm outline-none focus:ring-1 focus:ring-primary"
                  value={filters.location}
                  onChange={(e) => setFilters({...filters, location: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">Seniority</label>
                <select 
                  className="p-2 rounded-md border bg-background text-sm w-40"
                  value={filters.seniority}
                  onChange={(e) => setFilters({...filters, seniority: e.target.value})}
                >
                  <option value="">All Levels</option>
                  <option value="Entry level">Entry Level</option>
                  <option value="Mid-Senior level">Mid-Senior</option>
                  <option value="Associate">Associate</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">Date</label>
                <select 
                  className="p-2 rounded-md border bg-background text-sm w-40"
                  value={filters.dateRange}
                  onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
                >
                  <option value="all">Any time</option>
                  <option value="1day">Last 24h</option>
                  <option value="2days">Last 48h</option>
                  <option value="older">Older</option>
                </select>
              </div>
            </div>

            {/* Jobs List */}
            <div className="flex flex-col gap-4">
              {filteredJobs.length > 0 ? (
                filteredJobs.map((job, i) => (
                  <JobCard key={job.id} job={job} index={i} />
                ))
              ) : (
                <div className="text-center py-20 border-2 border-dashed rounded-2xl border-border">
                  <p className="text-muted-foreground">No jobs match your selected filters.</p>
                  <Button variant="link" onClick={() => setFilters({location: "", seniority: "", dateRange: "all"})}>
                    Reset Filters
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>

    <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground mt-auto">
      Sift — Find work that fits.
    </footer>
  </div>
);
};

export default Index;
